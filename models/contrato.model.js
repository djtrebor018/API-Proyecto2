import { DataTypes } from "sequelize";
import { conexion } from '../DB/Conexion.js';
import { Inscripcion } from "./inscripcion.model.js";

export const Contrato = conexion.define('Contrato', {
    ID_Contrato: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ID_Inscripcion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: Inscripcion, key: 'ID_Inscripcion' }
    },
    Fecha_Inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    Fecha_Fin: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    Estado: {
        type: DataTypes.ENUM('Vigente', 'Cancelado'),
        allowNull: true,
        defaultValue: 'Vigente'
    }
}, {
    tableName: 'contrato',
    timestamps: false
});

