import {request, response} from 'express';
import { DateTime } from 'luxon';
import { Pago } from '../models/pago.model.js';
import { Inscripcion } from '../models/inscripcion.model.js';
import { Usuario } from '../models/usuario.model.js';
import { enviarCorreoPago } from '../helpers/mailer.js';

const ZONA = 'America/Santo_Domingo';
const incluirInscripcion = {
    model: Inscripcion,
    as: 'Inscripcion',
    attributes: ['ID_Inscripcion', 'ID_Usuario', 'ID_Horario', 'Fecha'],
    include: [{
        model: Usuario,
        as: 'Usuario',
        attributes: ['ID_Usuario', 'Nombre', 'Tipo_Usuario', 'Matricula', 'Cedula']
    }]
};

export const ObtenerPagos = async (req = request, res = response) => {
    try {
        const esAdmin = req.usuario.Rol === 'Admin';
        const opciones = {
            include: [{ ...incluirInscripcion }],
            order: [['Fecha_Pago', 'DESC'], ['ID_Pago', 'DESC']]
        };
        if (!esAdmin) {
            opciones.include[0].where = { ID_Usuario: req.usuario.ID_Usuario };
            opciones.include[0].required = true;
        }

        const pagos = await Pago.findAll(opciones);
        return res.status(200).json({ pagos });
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        return res.status(500).json({ msg: 'Error al obtener los pagos' });
    }
};

export const ObtenerPago = async (req = request, res = response) => {
    try {
        const pago = await Pago.findByPk(req.params.id, { include: [incluirInscripcion] });
        if (!pago || (req.usuario.Rol !== 'Admin' &&
            pago.Inscripcion?.ID_Usuario !== req.usuario.ID_Usuario)) {
            return res.status(404).json({ msg: 'Pago no encontrado' });
        }
        return res.status(200).json({ pago });
    } catch (error) {
        console.error('Error al obtener pago:', error);
        return res.status(500).json({ msg: 'Error al obtener el pago' });
    }
};

export const pagoMensual = async (req = request, res = response) => {
    const {ID_Usuario } = req.usuario;
    const Fecha = DateTime.now().setZone(ZONA).toISODate();
    const { ID_Inscripcion, Metodo_Pago, Monto } = req.body;

     try{
          const inscripcion = await Inscripcion.findOne({
            where: {
                ID_Inscripcion,
                ID_Usuario
            }
        });
        if (!inscripcion) {
            return res.status(404).json({ error: 'Inscripción no encontrada para el usuario' });
        }
        const newPago = await Pago.create({
            ID_Inscripcion: inscripcion.ID_Inscripcion,
            Metodo_Pago,
            Motivo_Pago: 'Mensual',
            Monto,
            Fecha_Pago: Fecha,
            Estado: 'Realizado'
        });
        enviarCorreoPago({
            Nombre: req.usuario.Nombre,
            Correo: req.usuario.Correo,
            ID_Pago: newPago.ID_Pago,
            ID_Inscripcion: newPago.ID_Inscripcion,
            Fecha_Pago: Fecha,
            Motivo_Pago: newPago.Motivo_Pago,
            Monto: new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(newPago.Monto)),
            Metodo_Pago: newPago.Metodo_Pago,
            Estado: newPago.Estado
        }).catch((error) => console.error('Error enviando correo de pago:', error.message));
        res.status(201).json({ message: 'Pago creado exitosamente', pago: newPago });
     }
     catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar el pago' });
    }
}
