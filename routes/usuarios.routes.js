import { Router } from "express";
import { body, param } from "express-validator";
import {
    ActualizarUsuario,
    BuscarUsuario,
    CrearUsuario,
    DesactivarUsuario,
    ObtenerUsuario,
    ObtenerUsuarios,
    RegistrarPagoUsuario
} from "../controllers/usuario.controller.js";
import { validarJWT } from "../middleware/ValidarJWT.js";
import { validarRol } from "../middleware/validarRol.js";
import { validarCampos } from "../middleware/validarCampos.js";
import { CorreoInstucional, verifyCorreo, VerifyCedula, VerifyMatricula } from "../helpers/DB_Validators.js";

export const usuariosRouter = Router();

const validarIdentificacion = () => body().custom((_, { req }) => {
    const tieneMatricula = typeof req.body.Matricula === "string" && req.body.Matricula.trim() !== "";
    const tieneCedula = typeof req.body.Cedula === "string" && req.body.Cedula.trim() !== "";
    if (tieneMatricula === tieneCedula) {
        throw new Error("Debe indicar únicamente Matricula o Cedula");
    }
    if (tieneMatricula && !/^\d{4}-\d{4}$/.test(req.body.Matricula.trim())) {
        throw new Error("La matrícula debe tener formato 0000-0000");
    }
    if (tieneCedula && (req.body.Cedula.trim().length > 20 || req.body.Cedula.trim().length < 1)) {
        throw new Error("La cédula debe tener entre 1 y 20 caracteres");
    }
    req.body.Matricula = tieneMatricula ? req.body.Matricula.trim() : undefined;
    req.body.Cedula = tieneCedula ? req.body.Cedula.trim() : undefined;
    return true;
});

usuariosRouter.get("/", validarJWT, validarRol("Admin"), ObtenerUsuarios);

usuariosRouter.post(
    "/",
    validarJWT,
    validarRol("Admin"),
    body().custom((_, { req }) => {
        const camposPermitidos = ["Nombre", "Correo", "Password", "Tipo_Usuario", "Matricula", "Cedula"];
        if (Object.keys(req.body).some((campo) => !camposPermitidos.includes(campo))) {
            throw new Error("No puede enviar campos adicionales");
        }
        return true;
    }),
    body("Nombre").trim().notEmpty().withMessage("Debe ingresar el nombre del usuario")
        .bail().isString().withMessage("El nombre debe ser un texto")
        .bail().isLength({ max: 50 }).withMessage("El nombre no puede superar 50 caracteres"),
    body("Correo").trim().notEmpty().withMessage("Debe ingresar el correo del usuario")
        .bail().isEmail().withMessage("Debe ingresar un correo válido")
        .bail().isLength({ max: 50 }).withMessage("El correo no puede superar 50 caracteres")
        .bail().custom(verifyCorreo)
        .bail().custom(CorreoInstucional),
    body("Password").isString().withMessage("La contraseña debe ser un texto")
        .bail().isLength({ min: 6 }).withMessage("La contraseña debe tener mínimo 6 caracteres"),
    body("Tipo_Usuario").isIn(["Estudiante", "Maestro", "Externo"])
        .withMessage("El tipo de usuario debe ser Estudiante, Maestro o Externo"),
    body("Matricula")
        .if((_, { req }) => ["Estudiante", "Maestro"].includes(req.body.Tipo_Usuario))
        .isString().withMessage("La matrícula debe ser un texto")
        .bail().trim().notEmpty().withMessage("Debe ingresar la matrícula")
        .bail().matches(/^\d{4}-\d{4}$/).withMessage("La matrícula debe tener formato 0000-0000")
        .bail().custom(VerifyMatricula),
    body("Cedula")
        .if((_, { req }) => req.body.Tipo_Usuario === "Externo")
        .isString().withMessage("La cédula debe ser un texto")
        .bail().trim().notEmpty().withMessage("Debe ingresar la cédula")
        .bail().isLength({ max: 20 }).withMessage("La cédula no puede superar 20 caracteres")
        .bail().custom(VerifyCedula),
    body().custom((_, { req }) => {
        const requiereMatricula = ["Estudiante", "Maestro"].includes(req.body.Tipo_Usuario);
        const tieneMatricula = typeof req.body.Matricula === "string" && req.body.Matricula.trim() !== "";
        const tieneCedula = typeof req.body.Cedula === "string" && req.body.Cedula.trim() !== "";
        if ((requiereMatricula && (!tieneMatricula || tieneCedula)) ||
            (!requiereMatricula && (!tieneCedula || tieneMatricula))) {
            throw new Error("Debe indicar únicamente la matrícula o cédula correspondiente al tipo de usuario");
        }
        return true;
    }),
    validarCampos,
    CrearUsuario
);

usuariosRouter.post(
    "/buscar",
    validarJWT,
    validarRol("Admin"),
    validarIdentificacion(),
    validarCampos,
    BuscarUsuario
);

usuariosRouter.post(
    "/pagos",
    validarJWT,
    validarRol("Admin"),
    validarIdentificacion(),
    body("ID_Inscripcion").isInt({ min: 1 }).withMessage("Debe indicar una inscripción válida").bail().toInt(),
    body("Metodo_Pago").isIn(["Efectivo", "Paypal", "Tarjeta", "Transferencia"])
        .withMessage("El método de pago debe ser Efectivo, Paypal, Tarjeta o Transferencia"),
    body("Motivo_Pago").isIn(["Inscripción", "Mensual"])
        .withMessage("El motivo debe ser Inscripción o Mensual"),
    body("Monto")
        .isFloat({ min: 0.01, max: 99999999.99 })
        .withMessage("El monto debe ser mayor que cero y no superar 99999999.99")
        .bail()
        .matches(/^\d{1,8}(?:\.\d{1,2})?$/)
        .withMessage("El monto admite hasta dos decimales")
        .bail()
        .toFloat(),
    validarCampos,
    RegistrarPagoUsuario
);

usuariosRouter.get(
    "/:id",
    validarJWT,
    param("id").isInt({ min: 1 }).withMessage("El ID del usuario debe ser un entero positivo"),
    validarCampos,
    ObtenerUsuario
);

usuariosRouter.patch(
    "/:id",
    validarJWT,
    param("id").isInt({ min: 1 }).withMessage("El ID del usuario debe ser un entero positivo"),
    body().custom((_, { req }) => {
        const camposPermitidos = req.usuario?.Rol === "Admin" ? ["Nombre", "Estado"] : ["Nombre"];
        if (!camposPermitidos.some((campo) => Object.hasOwn(req.body, campo))) {
            throw new Error("Debe indicar al menos un campo permitido para actualizar");
        }
        if (Object.keys(req.body).some((campo) => !camposPermitidos.includes(campo))) {
            throw new Error("No puede modificar los campos enviados");
        }
        return true;
    }),
    body("Nombre").optional().trim().notEmpty().withMessage("El nombre no puede estar vacío")
        .bail().isLength({ max: 50 }).withMessage("El nombre no puede superar 50 caracteres"),
    body("Estado").optional().isBoolean().withMessage("Estado debe ser booleano").toBoolean(),
    validarCampos,
    ActualizarUsuario
);

usuariosRouter.delete(
    "/:id",
    validarJWT,
    validarRol("Admin"),
    param("id").isInt({ min: 1 }).withMessage("El ID del usuario debe ser un entero positivo"),
    validarCampos,
    DesactivarUsuario
);
