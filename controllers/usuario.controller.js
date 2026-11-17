import { request, response } from "express";
import { DateTime } from "luxon";
import { Op } from "sequelize";
import { Usuario } from "../models/usuario.model.js";
import { Inscripcion } from "../models/inscripcion.model.js";
import { Horario } from "../models/horario.model.js";
import { Dia } from "../models/dia.model.js";
import { Pago } from "../models/pago.model.js";
import bcrypt from "bcryptjs";
import { enviarCorreoBienvenida, enviarCorreoPago } from "../helpers/mailer.js";

const ZONA = "America/Santo_Domingo";
const atributosPublicos = ["ID_Usuario", "Nombre", "Correo", "Tipo_Usuario", "Matricula", "Cedula", "Rol", "Estado"];

const buscarUsuarioPorIdentificacion = ({ Matricula, Cedula }) => {
    if (Matricula) {
        return Usuario.findOne({
            where: { Matricula, Tipo_Usuario: { [Op.in]: ["Estudiante", "Maestro"] } }
        });
    }

    return Usuario.findOne({
        where: { Cedula, Tipo_Usuario: "Externo" }
    });
};

const obtenerInscripciones = (ID_Usuario) => Inscripcion.findAll({
    where: { ID_Usuario },
    attributes: ["ID_Inscripcion", "Fecha", "ID_Horario"],
    include: [{
        model: Horario,
        as: "Horario",
        attributes: ["Hora_Inicio", "Hora_Fin"],
        include: [
            { model: Dia, as: "PrimerDia", attributes: ["Dia"] },
            { model: Dia, as: "SegundoDia", attributes: ["Dia"] }
        ]
    }],
    order: [["Fecha", "DESC"]]
});

export const CrearUsuario = async (req = request, res = response) => {
    try {
        const { Nombre, Correo, Password, Tipo_Usuario, Matricula, Cedula } = req.body;
        const usuario = await Usuario.create({
            Nombre,
            Correo,
            Password: await bcrypt.hash(Password, 8),
            Tipo_Usuario,
            Matricula: Matricula?.trim() || null,
            Cedula: Cedula?.trim() || null,
            Rol: "Usuario"
        });

        enviarCorreoBienvenida({ Nombre: usuario.Nombre, Correo: usuario.Correo })
            .catch((error) => console.error("Error enviando correo de bienvenida:", error.message));

        return res.status(201).json({
            msg: "Usuario creado correctamente",
            usuario: await Usuario.findByPk(usuario.ID_Usuario, { attributes: atributosPublicos })
        });
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({ msg: "El correo, matrícula o cédula ya está registrado" });
        }
        console.error("Error al crear usuario:", error);
        return res.status(500).json({ msg: "Error al crear el usuario" });
    }
};

export const ObtenerUsuarios = async (req = request, res = response) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: atributosPublicos,
            order: [["ID_Usuario", "ASC"]]
        });
        return res.status(200).json({ usuarios });
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        return res.status(500).json({ msg: "Error al obtener los usuarios" });
    }
};

export const ObtenerUsuario = async (req = request, res = response) => {
    try {
        const esAdmin = req.usuario.Rol === "Admin";
        if (!esAdmin && Number(req.params.id) !== req.usuario.ID_Usuario) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        const usuario = await Usuario.findByPk(req.params.id, { attributes: atributosPublicos });
        if (!usuario) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }
        return res.status(200).json({ usuario });
    } catch (error) {
        console.error("Error al obtener usuario:", error);
        return res.status(500).json({ msg: "Error al obtener el usuario" });
    }
};

export const ActualizarUsuario = async (req = request, res = response) => {
    try {
        const esAdmin = req.usuario.Rol === "Admin";
        if (!esAdmin && Number(req.params.id) !== req.usuario.ID_Usuario) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        const cambios = {};
        if (req.body.Nombre !== undefined) {
            cambios.Nombre = req.body.Nombre;
        }
        if (esAdmin && req.body.Estado !== undefined) {
            if (Number(req.params.id) === req.usuario.ID_Usuario && !req.body.Estado) {
                return res.status(409).json({ msg: "No puede desactivar su propio usuario" });
            }
            cambios.Estado = req.body.Estado;
        }
        await usuario.update(cambios);
        return res.status(200).json({
            msg: "Usuario actualizado correctamente",
            usuario: await Usuario.findByPk(usuario.ID_Usuario, { attributes: atributosPublicos })
        });
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        return res.status(500).json({ msg: "Error al actualizar el usuario" });
    }
};

export const DesactivarUsuario = async (req = request, res = response) => {
    try {
        if (Number(req.params.id) === req.usuario.ID_Usuario) {
            return res.status(409).json({ msg: "No puede desactivar su propio usuario" });
        }

        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }
        usuario.Estado = false;
        await usuario.save();
        return res.status(200).json({ msg: "Usuario desactivado correctamente" });
    } catch (error) {
        console.error("Error al desactivar usuario:", error);
        return res.status(500).json({ msg: "Error al desactivar el usuario" });
    }
};

export const BuscarUsuario = async (req = request, res = response) => {
    try {
        const usuario = await buscarUsuarioPorIdentificacion(req.body);
        if (!usuario || !usuario.Estado) {
            return res.status(404).json({ msg: "Usuario activo no encontrado" });
        }

        const inscripciones = await obtenerInscripciones(usuario.ID_Usuario);
        return res.status(200).json({
            usuario: {
                ID_Usuario: usuario.ID_Usuario,
                Nombre: usuario.Nombre,
                Tipo_Usuario: usuario.Tipo_Usuario,
                Matricula: usuario.Matricula,
                Cedula: usuario.Cedula
            },
            inscripciones
        });
    } catch (error) {
        console.error("Error al buscar usuario por identificación:", error);
        return res.status(500).json({ msg: "Error al buscar el usuario" });
    }
};

export const RegistrarPagoUsuario = async (req = request, res = response) => {
    try {
        const usuario = await buscarUsuarioPorIdentificacion(req.body);
        if (!usuario || !usuario.Estado) {
            return res.status(404).json({ msg: "Usuario activo no encontrado" });
        }

        const inscripcion = await Inscripcion.findOne({
            where: {
                ID_Inscripcion: req.body.ID_Inscripcion,
                ID_Usuario: usuario.ID_Usuario
            }
        });
        if (!inscripcion) {
            return res.status(404).json({ msg: "La inscripción no pertenece al usuario identificado" });
        }

        const Fecha_Pago = DateTime.now().setZone(ZONA).toISODate();
        const pago = await Pago.create({
            ID_Inscripcion: inscripcion.ID_Inscripcion,
            Metodo_Pago: req.body.Metodo_Pago,
            Motivo_Pago: req.body.Motivo_Pago,
            Monto: req.body.Monto,
            Fecha_Pago,
            Estado: "Realizado"
        });

        enviarCorreoPago({
            Nombre: usuario.Nombre,
            Correo: usuario.Correo,
            ID_Pago: pago.ID_Pago,
            ID_Inscripcion: pago.ID_Inscripcion,
            Fecha_Pago,
            Motivo_Pago: pago.Motivo_Pago,
            Monto: new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" })
                .format(Number(pago.Monto)),
            Metodo_Pago: pago.Metodo_Pago,
            Estado: pago.Estado
        }).catch((error) => console.error("Error enviando correo de pago:", error.message));

        return res.status(201).json({ msg: "Pago registrado correctamente", pago });
    } catch (error) {
        console.error("Error al registrar pago de usuario:", error);
        return res.status(500).json({ msg: "Error al registrar el pago" });
    }
};
