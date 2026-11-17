import { DataTypes } from "sequelize";
import { conexion } from '../DB/Conexion.js';
import { Inscripcion } from "./inscripcion.model.js";

export const Pago = conexion.define('Pago', {
    ID_Pago: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ID_Inscripcion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Inscripcion, key: 'ID_Inscripcion' }
    },
    Metodo_Pago: {
        type: DataTypes.ENUM('Efectivo', 'Paypal', 'Tarjeta', 'Transferencia'),
        allowNull: false,
        defaultValue: 'Efectivo'
    },
     Motivo_Pago: {
        type: DataTypes.ENUM('Inscripción', 'Mensual'),
        allowNull: false,
       
    },
    Monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,

    },
    
    Fecha_Pago: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    Estado: {
        type: DataTypes.ENUM('Pendiente', 'Realizado'),
        allowNull: false,
        defaultValue: 'Pendiente'
    },
}, {
    tableName: 'pago',
    timestamps: false
});