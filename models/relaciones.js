import { Horario } from "./horario.model.js";
import { Dia } from "./dia.model.js";
import { Usuario } from "./usuario.model.js";        // ajusta al nombre real del archivo
import { Inscripcion } from "./inscripcion.model.js";
import { Contrato } from "./contrato.model.js";
import { Pago } from "./pago.model.js";

// Horario -> Dia (join doble)
Horario.belongsTo(Dia, { foreignKey: 'Dia1', as: 'PrimerDia' });
Horario.belongsTo(Dia, { foreignKey: 'Dia2', as: 'SegundoDia' });
Dia.hasMany(Horario, { foreignKey: 'Dia1', as: 'HorariosComoPrimerDia' });
Dia.hasMany(Horario, { foreignKey: 'Dia2', as: 'HorariosComoSegundoDia' });

// Usuario <-> Inscripcion (uno a uno)
Usuario.hasOne(Inscripcion, { foreignKey: 'ID_Usuario', as: 'Inscripcion' });
Inscripcion.belongsTo(Usuario, { foreignKey: 'ID_Usuario', as: 'Usuario' });

// Horario -> Inscripcion (uno a muchos, por el cupo)
Horario.hasMany(Inscripcion, { foreignKey: 'ID_Horario', as: 'Inscripciones' });
Inscripcion.belongsTo(Horario, { foreignKey: 'ID_Horario', as: 'Horario' });

// Inscripcion <-> Contrato (uno a uno)
Inscripcion.hasOne(Contrato, { foreignKey: 'ID_Inscripcion', as: 'Contrato' });
Contrato.belongsTo(Inscripcion, { foreignKey: 'ID_Inscripcion', as: 'Inscripcion' });

// Inscripcion -> Pago (uno a muchos)
Inscripcion.hasMany(Pago, { foreignKey: 'ID_Inscripcion', as: 'Pagos' });
Pago.belongsTo(Inscripcion, { foreignKey: 'ID_Inscripcion', as: 'Inscripcion' });