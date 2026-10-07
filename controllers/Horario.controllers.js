import { request, response } from "express";
import { Horario } from "../models/horario.model.js";
import { Dia } from "../models/dia.model.js";




export const getHorarios = async (req = request,res =response) => {
    const query ={Estado:'Disponible'}
    try {
        const Horarios = await Horario.findAll({
        where:query,
         attributes: ['ID_Horario', 'Hora_Inicio', 'Hora_Fin', 'Cumpo_Maximo', 'Estado'],
  include: [
    {
      model: Dia,
      as: 'PrimerDia',
      attributes: ['Dia'],
      required: true   // INNER JOIN
    },
    {
      model: Dia,
      as: 'SegundoDia',
      attributes: ['Dia'],
      required: true   // INNER JOIN
    }
  ]
        })
        res.status(200).json({
            msg:'horarios disponibles',
            Horarios
        })
    } catch (error) {
         console.error(error)
         console.error(error.message) 
       return res.status(500).json({
        msg:'error al realizar la peticion'
       })
    }
}

export const getHorarioById = async (req = request,res =response) => {
    const {id} = req.params
  try {
    const HorarioById = await Horario.findByPk(id, {
         attributes: ['ID_Horario', 'Hora_Inicio', 'Hora_Fin', 'Cumpo_Maximo', 'Estado'],
  include: [
    {
      model: Dia,
      as: 'PrimerDia',
      attributes: ['Dia'],
      required: true   // INNER JOIN
    },
    {
      model: Dia,
      as: 'SegundoDia',
      attributes: ['Dia'],
      required: true   // INNER JOIN
    }
  ]  
})
res.status(200).json({
    msg:'horario encontrado',
    HorarioById
})
  } catch (error) {
    console.error(error)
    console.error(error.message)
    return res.status(500).json({
      msg:'error al realizar la peticion'
    })
  } 
}