import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: Number(process.env.MAIL_PORT) === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

const createEmail = ({ name, title, intro, details = [], footer }) => `
  <div style="display:none;max-height:0;overflow:hidden;color:#e8f4ed;">${escapeHtml(intro)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#e8f4ed;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;color:#173b2b;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(20,80,52,0.12);">
          <tr>
            <td style="background-color:#198754;padding:22px 28px;color:#ffffff;">
              <div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;opacity:0.9;">Piscina UCSD</div>
              <div style="font-size:23px;font-weight:bold;margin-top:8px;">${escapeHtml(title)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="font-size:16px;line-height:1.6;margin:0 0 12px;">Hola ${escapeHtml(name)},</p>
              <p style="font-size:15px;line-height:1.7;color:#416252;margin:0 0 22px;">${escapeHtml(intro)}</p>
              ${details.length ? `
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background-color:#f5faf7;border-radius:8px;">
                  ${details.map(({ label, value }) => `
                    <tr>
                      <td style="padding:12px 14px;border-bottom:1px solid #e1eee6;color:#557363;font-size:13px;">${escapeHtml(label)}</td>
                      <td align="right" style="padding:12px 14px;border-bottom:1px solid #e1eee6;color:#173b2b;font-size:14px;font-weight:bold;">${escapeHtml(value)}</td>
                    </tr>
                  `).join("")}
                </table>
              ` : ""}
              <p style="font-size:13px;line-height:1.6;color:#6b8275;margin:22px 0 0;">${escapeHtml(footer)}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f5faf7;padding:15px 28px;color:#71877a;font-size:12px;text-align:center;">
              Piscina UCSD · Este mensaje fue enviado automáticamente.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const enviarCorreo = ({ Correo, Nombre, asunto, titulo, mensaje, detalles = [], texto, pie }) =>
  transporter.sendMail({
    from: `"Piscina UCSD" <${process.env.MAIL_FROM}>`,
    to: Correo,
    subject: asunto,
    text: texto,
    html: createEmail({
      name: Nombre,
      title: titulo,
      intro: mensaje,
      details: detalles,
      footer: pie,
    }),
  });

export const enviarCorreoBienvenida = ({ Nombre, Correo }) =>
  enviarCorreo({
    Correo,
    Nombre,
    asunto: "¡Bienvenido a Piscina UCSD!",
    titulo: "¡Te damos la bienvenida!",
    mensaje: "Tu registro se realizó correctamente. Ya puedes iniciar sesión y gestionar tus horarios y pagos.",
    texto: `Hola ${Nombre}, tu registro se realizó correctamente. Ya puedes iniciar sesión.`,
    pie: "Si no creaste esta cuenta, puedes ignorar este mensaje.",
  });

export const enviarCorreoInscripcion = ({
  Nombre,
  Correo,
  ID_Inscripcion,
  Fecha,
  Dias,
  Hora_Inicio,
  Hora_Fin,
  Monto,
  Metodo_Pago,
}) =>
  enviarCorreo({
    Correo,
    Nombre,
    asunto: "Confirmación de inscripción · Piscina UCSD",
    titulo: "Inscripción confirmada",
    mensaje: "Tu inscripción fue registrada correctamente. Aquí tienes el resumen de tu horario y pago.",
    detalles: [
      { label: "Inscripción", value: `#${ID_Inscripcion}` },
      { label: "Fecha", value: Fecha },
      { label: "Días de clase", value: Dias },
      { label: "Horario", value: `${Hora_Inicio} - ${Hora_Fin}` },
      { label: "Pago de inscripción", value: Monto },
      { label: "Método de pago", value: Metodo_Pago },
    ],
    texto: `Hola ${Nombre}, tu inscripción #${ID_Inscripcion} fue confirmada. Clases: ${Dias}, ${Hora_Inicio} - ${Hora_Fin}. Pago: ${Monto} (${Metodo_Pago}).`,
    pie: "Conserva este correo como comprobante de tu inscripción.",
  });

export const enviarCorreoPago = ({
  Nombre,
  Correo,
  ID_Pago,
  ID_Inscripcion,
  Fecha_Pago,
  Motivo_Pago,
  Monto,
  Metodo_Pago,
  Estado,
}) =>
  enviarCorreo({
    Correo,
    Nombre,
    asunto: "Confirmación de pago · Piscina UCSD",
    titulo: "Pago confirmado",
    mensaje: "Recibimos tu pago correctamente. Este es el resumen de la transacción.",
    detalles: [
      { label: "Pago", value: `#${ID_Pago}` },
      { label: "Inscripción", value: `#${ID_Inscripcion}` },
      { label: "Concepto", value: Motivo_Pago },
      { label: "Fecha", value: Fecha_Pago },
      { label: "Monto", value: Monto },
      { label: "Método de pago", value: Metodo_Pago },
      { label: "Estado", value: Estado },
    ],
    texto: `Hola ${Nombre}, tu pago #${ID_Pago} de ${Monto} fue procesado correctamente. Concepto: ${Motivo_Pago}. Método: ${Metodo_Pago}.`,
    pie: "Conserva este correo como comprobante de pago.",
  });
