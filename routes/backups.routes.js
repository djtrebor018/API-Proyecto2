import { Router } from "express";
import { DescargarBackup } from "../controllers/backup.controller.js";
import { validarJWT } from "../middleware/ValidarJWT.js";
import { validarRol } from "../middleware/validarRol.js";

export const backupsRouter = Router();

backupsRouter.post("/", validarJWT, validarRol("Admin"), DescargarBackup);
