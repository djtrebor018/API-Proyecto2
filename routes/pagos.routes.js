import { Router } from "express";
import { body, param } from "express-validator";
import { validarJWT } from "../middleware/ValidarJWT.js";
import { ObtenerPago, ObtenerPagos, pagoMensual } from "../controllers/pagos.controller.js";
import { validarCampos } from "../middleware/validarCampos.js";
import { Inscripcion } from "../models/inscripcion.model.js";

export const pagoRouter = Router();

pagoRouter.get("/", validarJWT, ObtenerPagos);
pagoRouter.get(
    "/:id",
    validarJWT,
    param("id").isInt({ min: 1 }).withMessage("El ID del pago debe ser un entero positivo"),
    validarCampos,
    ObtenerPago
);

pagoRouter.post(
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
                throw new Error("No se encontró una inscripción asociada a este usuario");
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
    pagoMensual
);
