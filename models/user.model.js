import { DataTypes } from "sequelize";
import { conexion } from '../DB/Conexion.js';

export const Usuario = conexion.define('Usuario',{
    ID_Usuario: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    Nombre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    Correo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    Password: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    Tipo_Usuario: {
      type: DataTypes.ENUM('Estudiante', 'Maestro', 'Externo'),
      allowNull: false
    },
    Matricula: {
      type: DataTypes.STRING(20),
      unique: true
    },
    Cedula: {
      type: DataTypes.STRING(20),
          allowNull: true,

      unique: true
    },
    Rol: {
      type: DataTypes.ENUM('Usuario', 'Admin')
    },
    Estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'usuario',
    timestamps: false,
})