import {request, response} from "express";
import { Inscripcion } from "../models/inscripcion.model.js";
import { Contrato } from "../models/contrato.model.js";
import { Horario } from "../models/horario.model.js";
import {DateTime} from 'luxon'

export const CrearInscripcion = async(req = request, res = response)=>{
    const {ID_Horario ,Metodo_Pago,Monto,Estado} = req.body  
  try {
  const Fecha = DateTime.now().setZone('America/Santo_Domingo').toFormat('dd/MM/yyyy'); 
  const {ID_Usuario} = req.usuario
   const horario = await Horario.findByPk(ID_Horario);
   horario.Cumpo_Maximo -= 1;
   await horario.save();
    const nuevaInscripcion = await Inscripcion.create({
        ID_Usuario,
        ID_Horario,
        Fecha
    });

    const nuevoContrato = await Contrato.create({
        ID_Inscripcion: nuevaInscripcion.ID_Inscripcion,
        Fecha_Inicio: Fecha,
    });
     const nuevoPago = await Pago.create({
        ID_Inscripcion: nuevaInscripcion.ID_Inscripcion,
        Metodo_Pago,
        Monto,
        Estado
    });
    
    res.status(201).json({msg:'usuario inscrito correctamente', inscripcion: nuevaInscripcion});
  }
  catch (error) {
    console.log(error)
    res.status(500).json({msg:'Error al inscribir el usuario'})
  }

}