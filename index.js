import { Servidor } from "./models/Server.js";
import dotenv from 'dotenv'
import './models/relaciones.js'

dotenv.config()

const server = new Servidor;

server.Init()
