import { Router } from "express";
import { validarJWT } from "../middleware/ValidarJWT.js";
import { getDias } from "../controllers/dias.controller.js";

 export const diasRouter = Router()

 diasRouter.get('/',validarJWT,getDias)
 diasRouter.post('/')
 diasRouter.patch('/')