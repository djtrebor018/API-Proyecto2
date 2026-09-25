import { Router } from "express";
import { Auth, Login, Registro } from "../controllers/auth.controller.js";
import { validarJWT } from "../middleware/ValidarJWT.js";
import { check } from "express-validator";
import { validarCampos } from "../middleware/validarCampos.js";
export const authRouter = Router() 

authRouter.post('/login',[ 
    check('Correo').trim().notEmpty().withMessage('Debe ingresar el Correo para iniciar sesion').bail()
    .isEmail().withMessage('no es un correo valido').bail(),
    check('Password').trim().notEmpty().withMessage('Debe ingresar un Password para iniciar sesion').bail()
    .isString().withMessage('el password debe ser del tipo string').bail(),
    validarCampos],Login)

authRouter.post('/registro',[ check('Nombre').trim().notEmpty().withMessage('debe ingresar el Nombrre del usuario').bail()
        .isString().withMessage('el nombre debe ser un string').bail(),
    
        check('Correo').trim().notEmpty().withMessage('debe ingresar el correo del usuario').bail()
        .isEmail().withMessage('este campo debe ser un correo valido').bail(),
        
        check('Password').trim().notEmpty().withMessage('debe ingresar el password del usuario').bail()
        .isString().withMessage('el password debe ser un string').bail()
        .isLength({min: 6}).withMessage('el password debe terner minimo 6 caractertes').bail()
    
],Registro)
authRouter.get('',validarJWT,Auth)