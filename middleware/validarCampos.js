import { validationResult } from "express-validator"
import { request ,response} from "express";

export const validarCampos = async(req = request,res =response ,  next)=>{
    const errors = validationResult(req);
    console.log('BODY RECIBIDO EN VALIDACIÓN:', req.body); 
    if (!errors.isEmpty()) {
        return res.status(400).json(errors)
    }
    next()
}