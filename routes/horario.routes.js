import { Router } from "express";
import { body, param } from "express-validator";
import { validarJWT } from "../middleware/ValidarJWT.js";
import { actualizarHorario, crearHorario, eliminarHorario, getHorarios, getHorarioById } from "../controllers/Horario.controllers.js";
import { validarCampos } from "../middleware/validarCampos.js";
import { validarRol } from "../middleware/validarRol.js";
import { Dia } from "../models/dia.model.js";
import { Horario } from "../models/horario.model.js";

export const horarioRouter = Router();

horarioRouter.get('/',validarJWT,getHorarios)
horarioRouter.get(
    '/:id',
    validarJWT,
    param('id').isInt({ min: 1 }).withMessage('El ID del horario debe ser un entero positivo'),
    validarCampos,
    getHorarioById
)

const validarDia = (campo) => body(campo)
    .isInt({ min: 1 })
    .withMessage(`${campo} debe ser un ID positivo`)
    .bail()
    .toInt()
    .custom(async (idDia) => {
        const dia = await Dia.findByPk(idDia);
        if (!dia || !dia.Estado) {
            throw new Error('El día indicado no existe o está inactivo');
        }
        return true;
    });

const horaEnSegundos = (hora) => {
    const [horas, minutos, segundos = '0'] = hora.split(':');
    return Number(horas) * 3600 + Number(minutos) * 60 + Number(segundos);
};

const validarHoras = () => [
    body('Hora_Inicio').matches(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
        .withMessage('Hora_Inicio debe tener formato HH:mm o HH:mm:ss'),
    body('Hora_Fin').matches(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
        .withMessage('Hora_Fin debe tener formato HH:mm o HH:mm:ss'),
    body().custom((_, { req }) => {
        const inicio = req.body.Hora_Inicio;
        const fin = req.body.Hora_Fin;
        if (inicio && fin && horaEnSegundos(inicio) >= horaEnSegundos(fin)) {
            throw new Error('Hora_Fin debe ser posterior a Hora_Inicio');
        }
        return true;
    })
];

const validarCupo = () => body('Cumpo_Maximo')
    .isInt({ min: 1 })
    .withMessage('Cumpo_Maximo debe ser un entero positivo')
    .toInt();

horarioRouter.post(
    '/',
    validarJWT,
    validarRol('Admin'),
    body().custom((_, { req }) => {
        const camposPermitidos = ['Dia1', 'Dia2', 'Hora_Inicio', 'Hora_Fin', 'Cumpo_Maximo', 'Estado'];
        if (Object.keys(req.body).some((campo) => !camposPermitidos.includes(campo))) {
            throw new Error('La solicitud contiene campos no permitidos');
        }
        return true;
    }),
    validarDia('Dia1'),
    validarDia('Dia2'),
    ...validarHoras(),
    validarCupo(),
    body('Estado').optional().isIn(['Disponible', 'lleno'])
        .withMessage('Estado debe ser Disponible o lleno'),
    validarCampos,
    crearHorario
);

horarioRouter.patch(
    '/:id',
    validarJWT,
    validarRol('Admin'),
    param('id').isInt({ min: 1 }).withMessage('El ID del horario debe ser un entero positivo'),
    body().custom((_, { req }) => {
        const camposPermitidos = ['Dia1', 'Dia2', 'Hora_Inicio', 'Hora_Fin', 'Cumpo_Maximo', 'Estado'];
        if (!camposPermitidos.some((campo) => Object.hasOwn(req.body, campo))) {
            throw new Error('Debe indicar al menos un campo válido para actualizar');
        }
        if (Object.keys(req.body).some((campo) => !camposPermitidos.includes(campo))) {
            throw new Error('La solicitud contiene campos no permitidos');
        }
        return true;
    }),
    body('Dia1').optional().isInt({ min: 1 }).withMessage('Dia1 debe ser un ID positivo').bail().toInt()
        .custom(async (id) => {
            const dia = await Dia.findByPk(id);
            if (!dia || !dia.Estado) throw new Error('El día indicado no existe o está inactivo');
        }),
    body('Dia2').optional().isInt({ min: 1 }).withMessage('Dia2 debe ser un ID positivo').bail().toInt()
        .custom(async (id) => {
            const dia = await Dia.findByPk(id);
            if (!dia || !dia.Estado) throw new Error('El día indicado no existe o está inactivo');
        }),
    body('Hora_Inicio').optional().matches(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
        .withMessage('Hora_Inicio debe tener formato HH:mm o HH:mm:ss'),
    body('Hora_Fin').optional().matches(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
        .withMessage('Hora_Fin debe tener formato HH:mm o HH:mm:ss'),
    body('Cumpo_Maximo').optional().isInt({ min: 1 }).withMessage('Cumpo_Maximo debe ser un entero positivo').bail().toInt(),
    body('Estado').optional().isIn(['Disponible', 'lleno']).withMessage('Estado debe ser Disponible o lleno'),
    body().custom(async (_, { req }) => {
        const horario = await Horario.findByPk(req.params.id);
        if (!horario) return true;
        const horaInicio = req.body.Hora_Inicio ?? horario.Hora_Inicio;
        const horaFin = req.body.Hora_Fin ?? horario.Hora_Fin;
        if (horaEnSegundos(horaInicio) >= horaEnSegundos(horaFin)) {
            throw new Error('Hora_Fin debe ser posterior a Hora_Inicio');
        }
        return true;
    }),
    validarCampos,
    actualizarHorario
);

horarioRouter.delete(
    '/:id',
    validarJWT,
    validarRol('Admin'),
    param('id').isInt({ min: 1 }).withMessage('El ID del horario debe ser un entero positivo'),
    validarCampos,
    eliminarHorario
);