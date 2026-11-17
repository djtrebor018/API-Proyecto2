import { request, response } from "express";
import { Horario } from "../models/horario.model.js";
import { Dia } from "../models/dia.model.js";
import { Inscripcion } from "../models/inscripcion.model.js";

const incluirDias = [
  { model: Dia, as: 'PrimerDia', attributes: ['ID_Dia', 'Dia'], required: true },
  { model: Dia, as: 'SegundoDia', attributes: ['ID_Dia', 'Dia'], required: true }
];

export const getHorarios = async (req = request,res =response) => {
    const query ={Estado:'Disponible'}
    try {
        const Horarios = await Horario.findAll({
        where:query,
         attributes: ['ID_Horario', 'Hora_Inicio', 'Hora_Fin', 'Cumpo_Maximo', 'Estado'],
        include: incluirDias
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
        include: incluirDias
})
if (!HorarioById) {
  return res.status(404).json({
    msg: 'horario no encontrado'
  })
}
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

export const crearHorario = async (req = request, res = response) => {
  try {
    const horario = await Horario.create({
      ...req.body,
      Estado: req.body.Estado ?? 'Disponible'
    });
    return res.status(201).json({ msg: 'Horario creado correctamente', horario });
  } catch (error) {
    console.error('Error al crear horario:', error);
    return res.status(500).json({ msg: 'Error al crear el horario' });
  }
};

export const actualizarHorario = async (req = request, res = response) => {
  try {
    const horario = await Horario.findByPk(req.params.id);
    if (!horario) {
      return res.status(404).json({ msg: 'Horario no encontrado' });
    }

    await horario.update(req.body);
    return res.status(200).json({ msg: 'Horario actualizado correctamente', horario });
  } catch (error) {
    console.error('Error al actualizar horario:', error);
    return res.status(500).json({ msg: 'Error al actualizar el horario' });
  }
};

export const eliminarHorario = async (req = request, res = response) => {
  try {
    const horario = await Horario.findByPk(req.params.id);
    if (!horario) {
      return res.status(404).json({ msg: 'Horario no encontrado' });
    }

    const tieneInscripciones = await Inscripcion.count({
      where: { ID_Horario: horario.ID_Horario }
    });
    if (tieneInscripciones > 0) {
      return res.status(409).json({
        msg: 'No se puede eliminar un horario con inscripciones asociadas'
      });
    }

    await horario.destroy();
    return res.status(200).json({ msg: 'Horario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    return res.status(500).json({ msg: 'Error al eliminar el horario' });
  }
};