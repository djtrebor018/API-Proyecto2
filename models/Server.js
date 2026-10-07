import express from 'express'
import cors from 'cors'
import { authRouter } from '../routes/auth.routes.js';
import { conexion } from '../DB/Conexion.js';
import { diasRouter } from '../routes/Dias.routes.js';
import { horarioRouter } from '../routes/horario.routes.js';
import { inscripcionesRouter } from '../routes/inscripciones.routes.js';
export class Servidor {
    constructor(){
        this.app = express();
        this.Port = process.env.PORT 
        this.Path = {
            auth: '/Api/Auth',
            dias: '/Api/Dias',
            horarios: '/Api/Horarios',
            inscripciones: '/Api/Inscripciones'
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
      this.app.use(this.Path.dias,diasRouter)
      this.app.use(this.Path.horarios,horarioRouter)
      this.app.use(this.Path.inscripciones,inscripcionesRouter)
   }

   listen(){
   this.app.listen(this.Port,()=>{
    console.log(`server running on port:${this.Port}`)
   })

}

}