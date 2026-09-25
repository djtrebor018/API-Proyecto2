import express from 'express'
import cors from 'cors'
import { authRouter } from '../routes/auth.routes.js';
import { conexion } from '../DB/Conexion.js';

export class Servidor {
    constructor(){
        this.app = express();
        this.Port = process.env.PORT 
        this.Path = {
            auth: '/Api/Auth'
        }
    }

    async Init(){
        await this.conectar() 
        this.middleware()
        this.routes()
        this.listen()
    }
    async conectar(){
      try {
        await conexion.authenticate();
        console.log('database online')
      } catch (error) {
         console.log(error,'error al conectar con la base de datos')
      }
   }  
  
    middleware(){
    this.app.use(express.json())
    this.app.use(cors());
   }

   routes(){
      this.app.use(this.Path.auth,authRouter)
   }

   listen(){
   this.app.listen(this.Port,()=>{
    console.log(`server running on port:${this.Port}`)
   })

}

}