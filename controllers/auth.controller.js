import { request, response } from "express";
import { Jwt } from "../helpers/jwt.js";
import { Usuario } from "../models/usuario.model.js";
import bcrypt from "bcryptjs";

export const Login = async (req = request, res = response) => {
    const { Correo ,Password} = req.body
    try {
      const logUser = await Usuario.findOne({
            where:{
                Correo: Correo
            }
        })
    
        if(!logUser || !logUser.Estado){
            return res.status(404).json({
                msg:'Correo incorrecto'
            })
        }
    
        const validPassword = await bcrypt.compare(Password,logUser.Password)
        if(!validPassword){
            return res.status(400).json({
                msg:"password incorrecto"
            })
        }
        const token = Jwt(logUser.ID_Usuario)
     res.status(200).json({
        msg: 'login exitoso',
        token
     })
        
    } catch (error) {
       console.error(error.message) 
       return res.status(500).json({
        msg:'error al realizar login'
       })
    }
}

export const Registro =async(req = request , res =response)=>{
    const {Nombre,Correo,Password,Tipo_Usuario,Matricula,Cedula,Rol} = req.body
  
     const salt =  bcrypt.genSaltSync(8)
        const hashPassword = bcrypt.hashSync(Password,salt)
          const matriculaFinal = Matricula?.trim() || null;
          const cedulaFinal = Cedula?.trim() || null;
    try {
       const newUser = await Usuario.create({ Nombre,Correo,Password:hashPassword,Tipo_Usuario,Matricula:matriculaFinal,Cedula:cedulaFinal,Rol})
       const token = Jwt(newUser.ID_Usuario)
       res.status(201).json({ 
            msg:'registro exitoso',
            token
        })
    } catch (error) {
        console.error(error)
       console.error(error.message) 
       return res.status(500).json({
        msg:'error al registrar el usuario'
       })
    }
}

export const Auth = async (req = request, res = response) => {
    try {
    const  {ID_Usuario,Password,...dataUser} = req.usuario.toJSON()  

    res.status(200).json({
        dataUser
    })
        
    } catch (error) {
         console.error(error.message) 
       return res.status(500).json({
        msg:'error al realizar esta peticion'
       })
    }
}
