import { request, response } from "express";
import { DateTime } from "luxon";
import { col, fn, Op } from "sequelize";
import { Pago } from "../models/pago.model.js";

const ZONA = "America/Santo_Domingo";

export const ObtenerMetricasIngresos = async (req = request, res = response) => {
    try {
        const ahora = DateTime.now().setZone(ZONA);
        const inicioDia = ahora.toISODate();
        const inicioMes = ahora.startOf("month").toISODate();
        const inicioAnio = ahora.startOf("year").toISODate();

        const porDia = await Pago.findAll({
            attributes: [
                [fn("COALESCE", fn("SUM", col("Monto")), 0), "total"],
                [fn("COUNT", col("ID_Pago")), "cantidad"]
            ],
            where: {
                Estado: "Realizado",
                Fecha_Pago: { [Op.between]: [inicioDia, inicioDia] }
            },
            raw: true
        });

        const porMes = await Pago.findAll({
            attributes: [
                [fn("COALESCE", fn("SUM", col("Monto")), 0), "total"],
                [fn("COUNT", col("ID_Pago")), "cantidad"]
            ],
            where: {
                Estado: "Realizado",
                Fecha_Pago: { [Op.between]: [inicioMes, inicioDia] }
            },
            raw: true
        });

        const porAnio = await Pago.findAll({
            attributes: [
                [fn("COALESCE", fn("SUM", col("Monto")), 0), "total"],
                [fn("COUNT", col("ID_Pago")), "cantidad"]
            ],
            where: {
                Estado: "Realizado",
                Fecha_Pago: { [Op.between]: [inicioAnio, inicioDia] }
            },
            raw: true
        });

        const ingresosPorMes = await Pago.findAll({
            attributes: [
                [fn("MONTH", col("Fecha_Pago")), "periodo"],
                [fn("COALESCE", fn("SUM", col("Monto")), 0), "total"],
                [fn("COUNT", col("ID_Pago")), "cantidad"]
            ],
            where: {
                Estado: "Realizado",
                Fecha_Pago: { [Op.between]: [inicioAnio, inicioDia] }
            },
            group: [fn("MONTH", col("Fecha_Pago"))],
            order: [[fn("MONTH", col("Fecha_Pago")), "ASC"]],
            raw: true
        });

        const ingresosPorDia = await Pago.findAll({
            attributes: [
                [fn("DAYOFMONTH", col("Fecha_Pago")), "periodo"],
                [fn("COALESCE", fn("SUM", col("Monto")), 0), "total"],
                [fn("COUNT", col("ID_Pago")), "cantidad"]
            ],
            where: {
                Estado: "Realizado",
                Fecha_Pago: { [Op.between]: [inicioMes, inicioDia] }
            },
            group: [fn("DAYOFMONTH", col("Fecha_Pago"))],
            order: [[fn("DAYOFMONTH", col("Fecha_Pago")), "ASC"]],
            raw: true
        });

        const formatoResumen = (registro, periodo) => ({
            periodo,
            total: Number(registro?.total ?? 0),
            cantidadPagos: Number(registro?.cantidad ?? 0)
        });

        const mapaMeses = new Map(ingresosPorMes.map((item) => [
            Number(item.periodo),
            formatoResumen(item, Number(item.periodo))
        ]));
        const mapaDias = new Map(ingresosPorDia.map((item) => [
            Number(item.periodo),
            formatoResumen(item, Number(item.periodo))
        ]));

        const meses = Array.from({ length: 12 }, (_, indice) => {
            const mes = indice + 1;
            return mapaMeses.get(mes) ?? { periodo: mes, total: 0, cantidadPagos: 0 };
        });
        const dias = Array.from({ length: ahora.daysInMonth }, (_, indice) => {
            const dia = indice + 1;
            return mapaDias.get(dia) ?? { periodo: dia, total: 0, cantidadPagos: 0 };
        });

        return res.status(200).json({
            zonaHoraria: ZONA,
            moneda: "DOP",
            resumen: {
                dia: formatoResumen(porDia[0], inicioDia),
                mes: formatoResumen(porMes[0], inicioMes.slice(0, 7)),
                anio: formatoResumen(porAnio[0], ahora.year)
            },
            ingresosPorMes: meses,
            ingresosPorDia: dias
        });
    } catch (error) {
        console.error("Error al obtener métricas de ingresos:", error);
        return res.status(500).json({ msg: "Error al obtener las métricas de ingresos" });
    }
};
