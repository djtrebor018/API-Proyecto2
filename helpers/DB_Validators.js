import { Usuario } from "../models/usuario.model.js"

export const verifyCorreo = async(Correo='')=>{
    const foundUser = await Usuario.findOne({
        where:{
            Correo:Correo
        }
    })

    if(foundUser){
        throw new Error(` ya existe un usuario con este correo`)
    }
}


export const VerifyMatricula=async(Matricula = '')=>{
     const foundUser = await Usuario.findOne({
        where:{
          Matricula:Matricula
        }
    })

    if(foundUser){
        throw new Error(` ya existe un usuario con esta matricula`)
    }

}

export const VerifyCedula=async(Cedula = '')=>{
     const foundUser = await Usuario.findOne({
        where:{
          Cedula:Cedula
        }
    })

    if(foundUser){
        throw new Error(` ya existe un usuario con esta matricula`)
    }

}


export const CorreoInstucional=async(value,{req})=>{
    const REGEX_CORREO_UCSD = /^[a-z]+\d{8}@ucsd\.edu\.do$/i;

    const Tipo_Usuario = req.body.Tipo_Usuario;

    if (['Estudiante', 'Maestro'].includes(Tipo_Usuario) && !REGEX_CORREO_UCSD.test(value)) {
        throw new Error('Los estudiantes y maestros deben usar su correo institucional');
    }

    }