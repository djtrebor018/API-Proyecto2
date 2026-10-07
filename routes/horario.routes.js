import { Router } from "express";
import { validarJWT } from "../middleware/ValidarJWT.js";
import { getHorarios,getHorarioById } from "../controllers/Horario.controllers.js";

export const horarioRouter = Router();

horarioRouter.get('/',validarJWT,getHorarios)
horarioRouter.get('/:id',validarJWT,getHorarioById)