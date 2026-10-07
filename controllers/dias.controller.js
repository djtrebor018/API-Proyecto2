import { request, response } from "express";
import { Dia } from "../models/dia.model.js";

export const getDias = async (req = request, res = response) => {
    const query = {
        Estado: true
    }
    try {
        const dias = await Dia.findAll({
            where: query
        })
        res.status(200).json({
            msg:'Disponibles',
            dias
        })
    } catch (error) {
         console.error(error)
        console.error(error.message) 
       return res.status(500).json({
        msg:'error al realizar la peticion'
       })
    }
}