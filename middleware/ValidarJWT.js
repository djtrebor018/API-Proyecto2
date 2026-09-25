  import { request,response } from "express"
  import jwt from 'jsonwebtoken'
import { Usuario } from "../models/user.model.js"

  export const validarJWT =async(req= request, res = response , next)=>{

   const token = req.header('token')
   if(!token){
    return res.status(401).json({
        msg:'token invalido'
    })
   }
   try {
    
       const{uid} = jwt.verify(token,process.env.JWT_SECRET)
        
       const user = await Usuario.findByPk(uid)
    
       if(!user || !user.Estado){
        return res.status(401).json({
            msg: 'no existe usuario con ese token'
        })
       }
    
       req.usuario = user;
       req.uid = uid;
     
       next();
   } catch (error) {
    
     console.error(error)
        res.status(401).json({
            msg: 'token invalido'
         })
   }

  }