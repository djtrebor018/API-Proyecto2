import { Router } from "express";
import { body, param } from "express-validator";
import { validarJWT } from "../middleware/ValidarJWT.js";
import { validarRol } from "../middleware/validarRol.js";
import { validarCampos } from "../middleware/validarCampos.js";
import { actualizarDia, crearDia, eliminarDia, getDiaById, getDias } from "../controllers/dias.controller.js";

 export const diasRouter = Router()

 diasRouter.get('/',validarJWT,getDias)
 diasRouter.get('/:id', validarJWT, param('id').isInt({ min: 1 }), validarCampos, getDiaById)

 const validarNombreDia = () => body('Dia')
    .isIn(['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'])
    .withMessage('El día indicado no es válido');

 diasRouter.post(
    '/',
    validarJWT,
    validarRol('Admin'),
    body().custom((_, { req }) => {
        if (Object.keys(req.body).some((campo) => !['Dia', 'Estado'].includes(campo))) {
            throw new Error('La solicitud contiene campos no permitidos');
        }
        return true;
    }),
    validarNombreDia(),
    body('Estado').optional().isBoolean().withMessage('Estado debe ser booleano').toBoolean(),
    validarCampos,
    crearDia
 )

 diasRouter.patch(
    '/:id',
    validarJWT,
    validarRol('Admin'),
    param('id').isInt({ min: 1 }).withMessage('El ID del día debe ser un entero positivo'),
    body().custom((_, { req }) => {
        if (!Object.hasOwn(req.body, 'Dia') && !Object.hasOwn(req.body, 'Estado')) {
            throw new Error('Debe indicar al menos un campo para actualizar');
        }
        if (Object.keys(req.body).some((campo) => !['Dia', 'Estado'].includes(campo))) {
            throw new Error('La solicitud contiene campos no permitidos');
        }
        return true;
    }),
    body('Dia').optional().isIn(['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'])
        .withMessage('El día indicado no es válido'),
    body('Estado').optional().isBoolean().withMessage('Estado debe ser booleano').toBoolean(),
    validarCampos,
    actualizarDia
 )

 diasRouter.delete(
    '/:id',
    validarJWT,
    validarRol('Admin'),
    param('id').isInt({ min: 1 }).withMessage('El ID del día debe ser un entero positivo'),
    validarCampos,
    eliminarDia
 )