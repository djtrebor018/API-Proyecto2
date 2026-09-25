import { Servidor } from "./models/Server.js";
import dotenv from 'dotenv'

dotenv.config()

const server = new Servidor;

server.Init()
