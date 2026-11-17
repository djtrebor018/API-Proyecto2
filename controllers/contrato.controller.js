import { request, response } from "express";
import { DateTime } from "luxon";
import { Contrato } from "../models/contrato.model.js";
import { Inscripcion } from "../models/inscripcion.model.js";

const ZONA = "America/Santo_Domingo";
const incluirInscripcion = {
    model: Inscripcion,
    as: "Inscripcion",
    attributes: ["ID_Inscripcion", "ID_Usuario", "ID_Horario", "Fecha"]
};

const esAdministrador = (usuario) => usuario.Rol === "Admin";

export const ObtenerContratos = async (req = request, res = response) => {
    try {
        const opciones = {
            include: [incluirInscripcion],
            order: [["Fecha_Inicio", "DESC"]]
        };

        if (!esAdministrador(req.usuario)) {
            opciones.include = [{
                ...incluirInscripcion,
                where: { ID_Usuario: req.usuario.ID_Usuario },
                required: true
            }];
        }

        const contratos = await Contrato.findAll(opciones);
        return res.status(200).json({ contratos });
    } catch (error) {
        console.error("Error al obtener contratos:", error);
        return res.status(500).json({ msg: "Error al obtener los contratos" });
    }
};

export const ObtenerContrato = async (req = request, res = response) => {
    try {
        const contrato = await Contrato.findByPk(req.params.id, {
            include: [incluirInscripcion]
        });

        if (!contrato || (!esAdministrador(req.usuario) &&
            contrato.Inscripcion?.ID_Usuario !== req.usuario.ID_Usuario)) {
            return res.status(404).json({ msg: "Contrato no encontrado" });
        }

        return res.status(200).json({ contrato });
    } catch (error) {
        console.error("Error al obtener contrato:", error);
        return res.status(500).json({ msg: "Error al obtener el contrato" });
    }
};

export const CrearContrato = async (req = request, res = response) => {
    try {
        const { ID_Inscripcion, Fecha_Inicio, Fecha_Fin } = req.body;
        const fechaInicio = Fecha_Inicio || DateTime.now().setZone(ZONA).toISODate();
        const contratoExistente = await Contrato.findOne({ where: { ID_Inscripcion } });

        if (contratoExistente) {
            return res.status(409).json({ msg: "La inscripción ya tiene un contrato" });
        }

        const contrato = await Contrato.create({
            ID_Inscripcion,
            Fecha_Inicio: fechaInicio,
            Fecha_Fin: Fecha_Fin || null,
            Estado: Fecha_Fin ? "Cancelado" : "Vigente"
        });

        return res.status(201).json({ msg: "Contrato creado correctamente", contrato });
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({ msg: "La inscripción ya tiene un contrato" });
        }
        console.error("Error al crear contrato:", error);
        return res.status(500).json({ msg: "Error al crear el contrato" });
    }
};

export const ActualizarContrato = async (req = request, res = response) => {
    try {
        const contrato = await Contrato.findByPk(req.params.id, {
            include: [incluirInscripcion]
        });

        if (!contrato || (!esAdministrador(req.usuario) &&
            contrato.Inscripcion?.ID_Usuario !== req.usuario.ID_Usuario)) {
            return res.status(404).json({ msg: "Contrato no encontrado" });
        }

        if (contrato.Estado === "Cancelado") {
            return res.status(409).json({ msg: "El contrato ya está cancelado" });
        }

        const fechaFin = req.body.Fecha_Fin ||
            DateTime.now().setZone(ZONA).toISODate();
        if (fechaFin < contrato.Fecha_Inicio) {
            return res.status(400).json({
                msg: "Fecha_Fin no puede ser anterior a Fecha_Inicio"
            });
        }
        contrato.Fecha_Fin = fechaFin;
        contrato.Estado = "Cancelado";
        await contrato.save();

        return res.status(200).json({ msg: "Contrato cancelado correctamente", contrato });
    } catch (error) {
        console.error("Error al cancelar contrato:", error);
        return res.status(500).json({ msg: "Error al cancelar el contrato" });
    }
};
