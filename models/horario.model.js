
import { DataTypes } from "sequelize";
import { conexion } from '../DB/Conexion.js';
import { Dia } from "./dia.model.js"; // ajusta el nombre del archivo si es distinto

export const Horario = conexion.define('Horario', {
    ID_Horario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Dia1: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Dia, key: 'ID_Dia' }
    },
    Dia2: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Dia, key: 'ID_Dia' }
    },
    Hora_Inicio: {
        type: DataTypes.TIME,
        allowNull: false
    },
    Hora_Fin: {
        type: DataTypes.TIME,
        allowNull: false
    },
    Cumpo_Maximo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Estado: {
        type: DataTypes.ENUM('Disponible', 'lleno'),
        allowNull: true
    }
}, {
    tableName: 'horario',
    timestamps: false
});

