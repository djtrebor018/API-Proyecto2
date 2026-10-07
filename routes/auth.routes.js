import { Router } from "express";
import { Auth, Login, Registro } from "../controllers/auth.controller.js";
import { validarJWT } from "../middleware/ValidarJWT.js";
import { check } from "express-validator";
import { validarCampos } from "../middleware/validarCampos.js";
import { VerifyCedula, verifyCorreo, VerifyMatricula, CorreoInstucional } from "../helpers/DB_Validators.js";

export const authRouter = Router() 
const REGEX_CORREO_UCSD = /^[a-z]+\d{8}@ucsd\.edu\.do$/i;
authRouter.post('/login',[ 
    check('Correo').trim().notEmpty().withMessage('Debe ingresar el Correo para iniciar sesion').bail()
    .isEmail().withMessage('no es un correo valido').bail(),
    check('Password').trim().notEmpty().withMessage('Debe ingresar un Password para iniciar sesion').bail()
    .isString().withMessage('el password debe ser del tipo string').bail(),
    validarCampos],Login)

authRouter.post('/registro',[ check('Nombre').trim().notEmpty().withMessage('debe ingresar el Nombrre del usuario').bail()
        .isString().withMessage('el nombre debe ser un string').bail(),
    
        check('Correo').trim().notEmpty().withMessage('debe ingresar el correo del usuario').bail()
        .isEmail().withMessage('este campo debe ser un correo valido').bail()
        .custom(verifyCorreo).bail()
        .custom(CorreoInstucional).bail(),
        
        check('Password').trim().notEmpty().withMessage('debe ingresar el password del usuario').bail()
        .isString().withMessage('el password debe ser un string').bail()
        .isLength({min: 6}).withMessage('el password debe terner minimo 6 caractertes').bail(),

        check('Tipo_Usuario').trim().notEmpty().withMessage('debe ingresar el tipo de usuario').bail()
        .isString().withMessage('el Tipo de usuario debe ser string').bail()
        .isIn(['Estudiante', 'Maestro', 'Externo']).withMessage('el tipo de usuario debe ser Estudiante, Maestro o Externo').bail(),
        
        check('Matricula')
    .if((value, { req }) => ['Estudiante', 'Maestro'].includes(req.body.Tipo_Usuario))
    .isString().withMessage('la matricula debe ser string').bail()
    .trim().notEmpty().withMessage('los maestros y estudiantes deben ingresar matricula').bail()
    .matches(/^\d{4}-\d{4}$/).withMessage('La matrícula debe tener el formato 0000-0000').bail()
    .custom(VerifyMatricula).bail(),

check('Cedula')
    .if(check('Tipo_Usuario').equals('Externo'))
    .isString().withMessage('la cedula debe ser string').bail()
    .trim().notEmpty().withMessage('los usuarios externos deben ingresar cédula').bail()
    .custom(VerifyCedula).bail(),   
 validarCampos],Registro) 

authRouter.get('',validarJWT,Auth)