import { request, response } from "express";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { QueryTypes, Transaction } from "sequelize";
import { conexion } from "../DB/Conexion.js";

const TAMANO_LOTE = 500;

const obtenerTablas = async (transaction) => {
    const resultados = await conexion.query("SHOW FULL TABLES", {
        type: QueryTypes.SELECT,
        transaction
    });

    return resultados.map((resultado) => {
        const [nombre, tipo] = Object.values(resultado);
        return { nombre, tipo };
    });
};

const obtenerDependencias = async (transaction) => conexion.query(
    `SELECT TABLE_NAME, REFERENCED_TABLE_NAME
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL`,
    { type: QueryTypes.SELECT, transaction }
);

const obtenerClavesPrimarias = async (transaction) => conexion.query(
    `SELECT TABLE_NAME, COLUMN_NAME
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'PRIMARY'
     ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    { type: QueryTypes.SELECT, transaction }
);

const ordenarTablasPorDependencia = (tablas, dependencias) => {
    const nombresTablas = new Set(tablas.map(({ nombre }) => nombre));
    const referenciasPorTabla = new Map();
    for (const { TABLE_NAME, REFERENCED_TABLE_NAME } of dependencias) {
        if (TABLE_NAME !== REFERENCED_TABLE_NAME &&
            nombresTablas.has(TABLE_NAME) && nombresTablas.has(REFERENCED_TABLE_NAME)) {
            const referencias = referenciasPorTabla.get(TABLE_NAME) ?? new Set();
            referencias.add(REFERENCED_TABLE_NAME);
            referenciasPorTabla.set(TABLE_NAME, referencias);
        }
    }

    const pendientes = new Set(nombresTablas);
    const ordenadas = [];
    while (pendientes.size > 0) {
        const listas = [...pendientes].filter((nombre) =>
            [...(referenciasPorTabla.get(nombre) ?? [])].every((referencia) => !pendientes.has(referencia))
        );
        if (listas.length === 0) {
            throw new Error("No se puede ordenar el backup: se detectó una dependencia circular entre tablas");
        }
        listas.forEach((nombre) => {
            pendientes.delete(nombre);
            ordenadas.push(nombre);
        });
    }
    return ordenadas;
};

const escaparValorSql = (valor) => {
    if (valor !== null && typeof valor === "object" &&
        !Buffer.isBuffer(valor) && !(valor instanceof Date)) {
        return conexion.escape(JSON.stringify(valor));
    }
    return conexion.escape(valor);
};

async function* generarDump(transaction, tablas, tablasOrdenadas, clavesPrimarias) {
    let completado = false;
    const quoteIdentifier = (identifier) => conexion.getQueryInterface().quoteIdentifier(identifier);

    try {
        yield `-- Backup creado: ${new Date().toISOString()}\nSET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n\n`;

        const vistas = tablas.filter(({ tipo }) => tipo === "VIEW");

        for (const { nombre } of vistas) {
            yield `DROP VIEW IF EXISTS ${quoteIdentifier(nombre)};\n`;
        }
        for (const nombre of tablasOrdenadas) {
            yield `DROP TABLE IF EXISTS ${quoteIdentifier(nombre)};\n`;
        }
        yield "\n";

        for (const nombre of tablasOrdenadas) {
            const tablaSql = quoteIdentifier(nombre);
            const claves = clavesPrimarias
                .filter((clave) => clave.TABLE_NAME === nombre)
                .map((clave) => quoteIdentifier(clave.COLUMN_NAME));
            const ordenSql = claves.length > 0 ? ` ORDER BY ${claves.join(", ")}` : "";
            const [definicion] = await conexion.query(`SHOW CREATE TABLE ${tablaSql}`, {
                type: QueryTypes.SELECT,
                transaction
            });
            yield `${definicion["Create Table"]};\n\n`;

            const primeraPagina = await conexion.query(
                `SELECT * FROM ${tablaSql}${ordenSql} LIMIT ${TAMANO_LOTE}`,
                {
                type: QueryTypes.SELECT,
                transaction
                }
            );
            if (primeraPagina.length === 0) {
                continue;
            }

            const columnas = Object.keys(primeraPagina[0]);
            const columnasSql = columnas.map(quoteIdentifier).join(", ");
            let pagina = primeraPagina;
            let offset = 0;

            while (pagina.length > 0) {
                const valoresSql = pagina.map((fila) =>
                    `(${columnas.map((columna) => escaparValorSql(fila[columna])).join(", ")})`
                ).join(",\n");
                yield `INSERT INTO ${tablaSql} (${columnasSql}) VALUES\n${valoresSql};\n`;

                offset += pagina.length;
                if (pagina.length < TAMANO_LOTE) {
                    break;
                }
                pagina = await conexion.query(
                    `SELECT * FROM ${tablaSql}${ordenSql} LIMIT ${TAMANO_LOTE} OFFSET ${offset}`,
                    { type: QueryTypes.SELECT, transaction }
                );
            }
            yield "\n";
        }

        for (const { nombre } of vistas) {
            const vistaSql = quoteIdentifier(nombre);
            const [definicion] = await conexion.query(`SHOW CREATE VIEW ${vistaSql}`, {
                type: QueryTypes.SELECT,
                transaction
            });
            yield `DROP VIEW IF EXISTS ${vistaSql};\n${definicion["Create View"]};\n\n`;
        }

        yield "SET FOREIGN_KEY_CHECKS=1;\n";
        await transaction.commit();
        completado = true;
    } finally {
        if (!completado && !transaction.finished) {
            await transaction.rollback();
        }
    }
}

export const DescargarBackup = async (req = request, res = response) => {
    let transaction;
    try {
        transaction = await conexion.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
            readOnly: true
        });
        const tablas = await obtenerTablas(transaction);
        const tablasBase = tablas.filter(({ tipo }) => tipo === "BASE TABLE");
        const tablasOrdenadas = ordenarTablasPorDependencia(
            tablasBase,
            await obtenerDependencias(transaction)
        );
        const clavesPrimarias = await obtenerClavesPrimarias(transaction);
        const fecha = new Date().toISOString().replace(/[:.]/g, "-");

        res.status(200);
        res.set({
            "Content-Type": "application/sql; charset=utf-8",
            "Content-Disposition": `attachment; filename="backup-${fecha}.sql"`,
            "Cache-Control": "no-store"
        });
        await pipeline(
            Readable.from(generarDump(transaction, tablas, tablasOrdenadas, clavesPrimarias)),
            res
        );
    } catch (error) {
        if (transaction && !transaction.finished) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("Error al revertir la transacción del backup:", rollbackError);
            }
        }
        console.error("Error al crear el backup de la base de datos:", error);
        if (!res.headersSent) {
            return res.status(500).json({ msg: "Error al crear el backup de la base de datos" });
        }
    }
};
