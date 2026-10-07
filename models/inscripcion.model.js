import { DataTypes } from "sequelize";
import { conexion } from '../DB/Conexion.js';
import { Usuario } from "./usuario.model.js";
import { Horario } from "./horario.model.js";

export const Inscripcion = conexion.define('Inscripcion', {
    ID_Inscripcion: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Usuario, key: 'ID_Usuario' },
        unique: 'uq_usuario_horario'
    },
    ID_Horario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Horario, key: 'ID_Horario' },
        unique: 'uq_usuario_horario'
    }
}, {
    tableName: 'inscripcion',
    timestamps: false
});