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
        type: DataTypes.ENUM('Efectivo', 'Paypal', 'Tarjeta'),
        allowNull: false,
        defaultValue: 'Efectivo'
    },
    Monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
            const valor = this.getDataValue('Monto');
            return valor === null ? null : parseFloat(valor);
        }
    },
     Motivo_Pago: {
        type: DataTypes.ENUM('Inscripción', 'Mensual'),
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
    Referencia: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
}, {
    tableName: 'pago',
    timestamps: false
});