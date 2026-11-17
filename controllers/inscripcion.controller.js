import {request, response} from "express";
import { Inscripcion } from "../models/inscripcion.model.js";
import { Contrato } from "../models/contrato.model.js";
import { Horario } from "../models/horario.model.js";
import { DateTime } from 'luxon';
import { Pago } from "../models/pago.model.js";
import { Dia } from '../models/dia.model.js';
import { Usuario } from "../models/usuario.model.js";
import { conexion } from "../DB/Conexion.js";
import { enviarCorreoInscripcion, enviarCorreoPago } from "../helpers/mailer.js";

const incluirDetalleHorario = {
  model: Horario,
  as: 'Horario',
  attributes: ['ID_Horario', 'Hora_Inicio', 'Hora_Fin'],
  include: [
    { model: Dia, as: 'PrimerDia', attributes: ['Dia'] },
    { model: Dia, as: 'SegundoDia', attributes: ['Dia'] }
  ]
};

export const ObtenerInscripciones = async (req = request, res = response) => {
  try {
    const inscripciones = await Inscripcion.findAll({
      attributes: ['ID_Inscripcion', 'ID_Usuario', 'ID_Horario', 'Fecha'],
      include: [incluirDetalleHorario],
      order: [['Fecha', 'DESC']]
    });
    return res.status(200).json({ inscripciones });
  } catch (error) {
    console.error('Error al obtener inscripciones:', error);
    return res.status(500).json({ msg: 'Error al obtener las inscripciones' });
  }
};

export const ObtenerInscripcion = async (req = request, res = response) => {
  try {
    const opciones = {
      attributes: ['ID_Inscripcion', 'ID_Usuario', 'ID_Horario', 'Fecha'],
      include: [incluirDetalleHorario]
    };
    if (req.usuario.Rol !== 'Admin') {
      opciones.where = {
        ID_Inscripcion: req.params.id,
        ID_Usuario: req.usuario.ID_Usuario
      };
    }

    const inscripcion = await Inscripcion.findOne(opciones);
    if (!inscripcion) {
      return res.status(404).json({ msg: 'Inscripción no encontrada' });
    }
    return res.status(200).json({ inscripcion });
  } catch (error) {
    console.error('Error al obtener inscripción:', error);
    return res.status(500).json({ msg: 'Error al obtener la inscripción' });
  }
};
const crearInscripcionParaUsuario = async ({ ID_Usuario, ID_Horario, Metodo_Pago, Monto, usuario }) => {
  const Fecha = DateTime.now().setZone('America/Santo_Domingo').toISODate();
  let horario;
  let nuevaInscripcion;
  let nuevoPago;

  await conexion.transaction(async (transaction) => {
    horario = await Horario.findByPk(ID_Horario, {
      include: [
        { model: Dia, as: 'PrimerDia', attributes: ['Dia'] },
        { model: Dia, as: 'SegundoDia', attributes: ['Dia'] }
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!horario || horario.Estado !== 'Disponible' || Number(horario.Cumpo_Maximo) < 1) {
      const error = new Error('El horario no existe o no tiene cupos disponibles');
      error.status = 409;
      throw error;
    }

    const inscripcionExistente = await Inscripcion.findOne({
      where: { ID_Usuario, ID_Horario },
      transaction
    });
    if (inscripcionExistente) {
      const error = new Error('Ya existe una inscripción para este horario');
      error.status = 409;
      throw error;
    }

    horario.Cumpo_Maximo -= 1;
    await horario.save({ transaction });
    nuevaInscripcion = await Inscripcion.create({ ID_Usuario, ID_Horario, Fecha }, { transaction });
    await Contrato.create({
      ID_Inscripcion: nuevaInscripcion.ID_Inscripcion,
      Fecha_Inicio: Fecha
    }, { transaction });
    nuevoPago = await Pago.create({
      ID_Inscripcion: nuevaInscripcion.ID_Inscripcion,
      Metodo_Pago,
      Motivo_Pago: 'Inscripción',
      Monto,
      Estado: 'Realizado',
      Fecha_Pago: Fecha
    }, { transaction });
  });

  const formatoMonto = (valor) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(valor));

  enviarCorreoInscripcion({
    Nombre: usuario.Nombre,
    Correo: usuario.Correo,
    ID_Inscripcion: nuevaInscripcion.ID_Inscripcion,
    Fecha,
    Dias: [horario.PrimerDia?.Dia, horario.SegundoDia?.Dia].filter(Boolean).join(' y '),
    Hora_Inicio: horario.Hora_Inicio,
    Hora_Fin: horario.Hora_Fin,
    Monto: formatoMonto(Monto),
    Metodo_Pago
  }).catch((error) => console.error('Error enviando correo de inscripción:', error.message));
  enviarCorreoPago({
    Nombre: usuario.Nombre,
    Correo: usuario.Correo,
    ID_Pago: nuevoPago.ID_Pago,
    ID_Inscripcion: nuevoPago.ID_Inscripcion,
    Fecha_Pago: Fecha,
    Motivo_Pago: nuevoPago.Motivo_Pago,
    Monto: formatoMonto(nuevoPago.Monto),
    Metodo_Pago: nuevoPago.Metodo_Pago,
    Estado: nuevoPago.Estado
  }).catch((error) => console.error('Error enviando correo de pago de inscripción:', error.message));

  return nuevaInscripcion;
};

const responderErrorInscripcion = (res, error, contexto) => {
  if (error.status) {
    return res.status(error.status).json({ msg: error.message });
  }
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ msg: 'Ya existe una inscripción para este horario' });
  }
  console.error(contexto, error);
  return res.status(500).json({ msg: 'Error al inscribir el usuario' });
};

export const CrearInscripcion = async (req = request, res = response) => {
  try {
    const inscripcion = await crearInscripcionParaUsuario({
      ...req.body,
      ID_Usuario: req.usuario.ID_Usuario,
      usuario: req.usuario
    });
    return res.status(201).json({ msg: 'usuario inscrito correctamente', inscripcion });
  } catch (error) {
    return responderErrorInscripcion(res, error, 'Error al inscribir el usuario:');
  }
};

export const CrearInscripcionAdmin = async (req = request, res = response) => {
  try {
    const usuario = await Usuario.findByPk(req.body.ID_Usuario);
    if (!usuario || !usuario.Estado) {
      return res.status(404).json({ msg: 'Usuario activo no encontrado' });
    }

    const inscripcion = await crearInscripcionParaUsuario({ ...req.body, usuario });
    return res.status(201).json({ msg: 'usuario inscrito correctamente', inscripcion });
  } catch (error) {
    return responderErrorInscripcion(res, error, 'Error al crear inscripción como administrador:');
  }
};

export const ObtenerHorarioUsuario = async (req = request, res = response) => {
  try {
    const { ID_Usuario } = req.usuario;

    const inscripciones = await Inscripcion.findAll({
      where: { ID_Usuario },
      attributes: ['ID_Inscripcion', 'Fecha'],
      include: [incluirDetalleHorario],
      order: [['Fecha', 'DESC']]
    });

    
    res.status(200).json({ inscripciones });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error al obtener el horario del usuario' });
  }
};