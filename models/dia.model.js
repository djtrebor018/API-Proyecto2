import { DataTypes } from "sequelize";
import { conexion } from '../DB/Conexion.js';

export const Dia = conexion.define('Dia',{
     ID_Dia: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    Dia: {
      type: DataTypes.ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado')
    },
    Estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'dias',
    timestamps: false
})