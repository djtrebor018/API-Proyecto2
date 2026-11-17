import { Router } from "express";
import { ObtenerMetricasIngresos } from "../controllers/metricas.controller.js";
import { validarJWT } from "../middleware/ValidarJWT.js";
import { validarRol } from "../middleware/validarRol.js";

export const metricasRouter = Router();

metricasRouter.get("/ingresos", validarJWT, validarRol("Admin"), ObtenerMetricasIngresos);
