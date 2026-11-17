import { Router } from "express";
import { body } from "express-validator";
import {
    CrearInscripcion,
    CrearInscripcionAdmin,
    ObtenerHorarioUsuario,
    ObtenerInscripcion,
    ObtenerInscripciones
} from "../controllers/inscripcion.controller.js";
import { Inscripcion } from "../models/inscripcion.model.js";
import { Horario } from "../models/horario.model.js";
import { validarJWT } from "../middleware/ValidarJWT.js";
import { validarCampos } from "../middleware/validarCampos.js";
import { validarRol } from "../middleware/validarRol.js";
import { param } from "express-validator";

export const inscripcionesRouter = Router();

inscripcionesRouter.get("/", validarJWT, ObtenerHorarioUsuario);
inscripcionesRouter.get("/admin", validarJWT, validarRol("Admin"), ObtenerInscripciones);
inscripcionesRouter.post(
    "/admin",
    validarJWT,
    validarRol("Admin"),
    body("ID_Usuario")
        .isInt({ min: 1 })
        .withMessage("Debe indicar un usuario válido")
        .bail()
        .toInt(),
    body("ID_Horario")
        .isInt({ min: 1 })
        .withMessage("Debe indicar un horario válido")
        .bail()
        .toInt(),
    body("Metodo_Pago")
        .isIn(["Efectivo", "Paypal", "Tarjeta", "Transferencia"])
        .withMessage("El método de pago debe ser Efectivo, Paypal, Tarjeta o Transferencia"),
    body("Monto")
        .isFloat({ min: 0.01, max: 99999999.99 })
        .withMessage("El monto debe ser mayor que cero y no superar 99999999.99")
        .bail()
        .matches(/^\d{1,8}(?:\.\d{1,2})?$/)
        .withMessage("El monto admite hasta dos decimales")
        .bail()
        .toFloat(),
    validarCampos,
    CrearInscripcionAdmin
);
inscripcionesRouter.get(
    "/:id",
    validarJWT,
    param("id").isInt({ min: 1 }).withMessage("El ID de la inscripción debe ser un entero positivo"),
    validarCampos,
    ObtenerInscripcion
);
inscripcionesRouter.post(
    "/",
    validarJWT,
    body("ID_Horario")
        .isInt({ min: 1 })
        .withMessage("Debe indicar un horario válido")
        .bail()
        .toInt()
        .custom(async (ID_Horario, { req }) => {
            const horario = await Horario.findByPk(ID_Horario);
            if (!horario || horario.Estado !== "Disponible" || Number(horario.Cumpo_Maximo) < 1) {
                throw new Error("El horario no existe o no tiene cupos disponibles");
            }

            const inscripcionExistente = await Inscripcion.findOne({
                where: { ID_Usuario: req.usuario.ID_Usuario, ID_Horario }
            });
            if (inscripcionExistente) {
                throw new Error("Ya existe una inscripción para este horario");
            }

            return true;
        }),
    body("Metodo_Pago")
        .isIn(["Efectivo", "Paypal", "Tarjeta", "Transferencia"])
        .withMessage("El método de pago debe ser Efectivo, Paypal, Tarjeta o Transferencia"),
    body("Monto")
        .isFloat({ min: 0.01, max: 99999999.99 })
        .withMessage("El monto debe ser mayor que cero y no superar 99999999.99")
        .bail()
        .matches(/^\d{1,8}(?:\.\d{1,2})?$/)
        .withMessage("El monto admite hasta dos decimales"),
    validarCampos,
    CrearInscripcion
);
