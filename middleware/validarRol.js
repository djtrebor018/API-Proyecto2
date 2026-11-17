import { request, response } from "express";

export const validarRol = (...rolesPermitidos) => (req = request, res = response, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.Rol)) {
        return res.status(403).json({ msg: "No tiene permisos para realizar esta acción" });
    }

    return next();
};
