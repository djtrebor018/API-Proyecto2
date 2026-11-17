import { Router } from "express";
import { body, param } from "express-validator";
import { DateTime } from "luxon";
import {
    ActualizarContrato,
    CrearContrato,
    ObtenerContrato,
    ObtenerContratos
} from "../controllers/contrato.controller.js";
import { Inscripcion } from "../models/inscripcion.model.js";
import { validarCampos } from "../middleware/validarCampos.js";
import { validarJWT } from "../middleware/ValidarJWT.js";

export const contratosRouter = Router();

const fechaValida = (campo, requerido = false) => {
    const validacion = body(campo);
    if (requerido) {
        return validacion
            .notEmpty().withMessage(`Debe indicar ${campo}`)
            .bail()
            .isISO8601({ strict: true, strictSeparator: true })
            .withMessage(`${campo} debe tener formato YYYY-MM-DD`);
    }

    return validacion
        .optional({ values: "falsy" })
        .isISO8601({ strict: true, strictSeparator: true })
        .withMessage(`${campo} debe tener formato YYYY-MM-DD`);
};

contratosRouter.get("/", validarJWT, ObtenerContratos);

contratosRouter.get(
    "/:id",
    validarJWT,
    param("id").isInt({ min: 1 }).withMessage("El ID del contrato debe ser un entero positivo"),
    validarCampos,
    ObtenerContrato
);

contratosRouter.post(
    "/",
    validarJWT,
    body("ID_Inscripcion")
        .isInt({ min: 1 })
        .withMessage("Debe indicar una inscripción válida")
        .bail()
        .toInt()
        .custom(async (ID_Inscripcion, { req }) => {
            const inscripcion = await Inscripcion.findOne({
                where: { ID_Inscripcion, ID_Usuario: req.usuario.ID_Usuario }
            });
            if (!inscripcion) {
                throw new Error("La inscripción no existe o no pertenece al usuario autenticado");
            }
            return true;
        }),
    fechaValida("Fecha_Inicio"),
    fechaValida("Fecha_Fin"),
    body().custom((_, { req }) => {
        const { Fecha_Inicio, Fecha_Fin } = req.body;
        const fechaInicioEfectiva = Fecha_Inicio ||
            DateTime.now().setZone("America/Santo_Domingo").toISODate();
        if (Fecha_Fin && Fecha_Fin < fechaInicioEfectiva) {
            throw new Error("Fecha_Fin no puede ser anterior a Fecha_Inicio");
        }
        return true;
    }),
    validarCampos,
    CrearContrato
);

contratosRouter.patch(
    "/:id",
    validarJWT,
    param("id").isInt({ min: 1 }).withMessage("El ID del contrato debe ser un entero positivo"),
    fechaValida("Fecha_Fin"),
    validarCampos,
    ActualizarContrato
);
