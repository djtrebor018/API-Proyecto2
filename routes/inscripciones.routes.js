import { Router } from "express";
import { CrearInscripcion } from "../controllers/inscripcion.controller.js";
import { validarJWT } from "../middleware/ValidarJWT.js";

export const inscripcionesRouter = Router();

inscripcionesRouter.get("/")
inscripcionesRouter.post("/",validarJWT ,CrearInscripcion)