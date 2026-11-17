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

export const getDiaById = async (req = request, res = response) => {
    try {
        const dia = await Dia.findByPk(req.params.id);
        if (!dia) {
            return res.status(404).json({ msg: 'Día no encontrado' });
        }
        return res.status(200).json({ dia });
    } catch (error) {
        console.error('Error al obtener día:', error);
        return res.status(500).json({ msg: 'Error al obtener el día' });
    }
}

export const crearDia = async (req = request, res = response) => {
    try {
        const dia = await Dia.create({
            Dia: req.body.Dia,
            Estado: req.body.Estado ?? true
        });
        return res.status(201).json({ msg: 'Día creado correctamente', dia });
    } catch (error) {
        console.error('Error al crear día:', error);
        return res.status(500).json({ msg: 'Error al crear el día' });
    }
}

export const actualizarDia = async (req = request, res = response) => {
    try {
        const dia = await Dia.findByPk(req.params.id);
        if (!dia) {
            return res.status(404).json({ msg: 'Día no encontrado' });
        }

        await dia.update(req.body);
        return res.status(200).json({ msg: 'Día actualizado correctamente', dia });
    } catch (error) {
        console.error('Error al actualizar día:', error);
        return res.status(500).json({ msg: 'Error al actualizar el día' });
    }
}

export const eliminarDia = async (req = request, res = response) => {
    try {
        const dia = await Dia.findByPk(req.params.id);
        if (!dia) {
            return res.status(404).json({ msg: 'Día no encontrado' });
        }

        dia.Estado = false;
        await dia.save();
        return res.status(200).json({ msg: 'Día desactivado correctamente', dia });
    } catch (error) {
        console.error('Error al desactivar día:', error);
        return res.status(500).json({ msg: 'Error al desactivar el día' });
    }
}