import nodemailer from "nodemailer";

// =====================================================
// TRANSPORTE SMTP (cPanel)
// =====================================================
// Variables de entorno necesarias:
//   SMTP_HOST     ej: mail.mtetoys.cl
//   SMTP_PORT     465 (SSL) o 587 (STARTTLS)
//   SMTP_SECURE   "true" si el puerto es 465, "false" si es 587
//   SMTP_USER     ej: no-reply@mtetoys.cl (cuenta creada en cPanel)
//   SMTP_PASS     contraseña de esa cuenta de correo
//   EMAIL_FROM    ej: "MTE Toys <no-reply@mtetoys.cl>"

const smtpConfigurado =
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

const transporter = smtpConfigurado
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE
        ? process.env.SMTP_SECURE === "true"
        : true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const EMAIL_FROM =
  process.env.EMAIL_FROM || process.env.SMTP_USER;

// =====================================================
// DIAGNÓSTICO AL ARRANCAR
// =====================================================
// Escribe en el log (stderr.log) qué variables faltan y si el servidor
// de correo acepta la conexión, así se ve el estado apenas se hace
// Stop/Start de la app, sin esperar una compra. Nunca muestra la contraseña.

const faltantes = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter(
  (nombre) => !process.env[nombre]
);

if (faltantes.length > 0) {
  console.warn(
    `[correo] Faltan variables: ${faltantes.join(", ")}. No se enviarán correos hasta agregarlas y reiniciar la app.`
  );
} else {
  // console.warn (no console.log): en cPanel solo stderr.log queda guardado
  console.warn(
    `[correo] Variables cargadas (host ${process.env.SMTP_HOST}, puerto ${
      Number(process.env.SMTP_PORT) || 465
    }, secure ${process.env.SMTP_SECURE ?? "true (por defecto)"}, usuario ${process.env.SMTP_USER}). Probando conexión...`
  );

  transporter
    .verify()
    .then(() => console.warn("[correo] Conexión SMTP OK: los correos se pueden enviar."))
    .catch((error) =>
      console.error(
        `[correo] No se pudo conectar o autenticar con el servidor de correo: ${error.message}`
      )
    );
}

// =====================================================
// DIRECCIÓN DE LA SEDE (retiro en persona)
// =====================================================

export const DIRECCION_SEDE = "Heraldo Latorre 974, Pudahuel";

// =====================================================
// FORMATO DE PESOS CHILENOS
// =====================================================

const formatearCLP = (valor) =>
  `$${Math.round(Number(valor) || 0).toLocaleString("es-CL")}`;

// =====================================================
// PLANTILLA HTML: CONFIRMACIÓN DE COMPRA
// =====================================================
// No es una boleta tributaria (SII). Es solo un correo
// informativo para el cliente.

const urlMapaSede = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  DIRECCION_SEDE
)}`;

export function construirHtmlConfirmacion(pedido) {
  const numeroPedido = pedido._id
    .toString()
    .slice(-8)
    .toUpperCase();

  const filasItems = pedido.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #eee; color:#333;">
            ${item.nombre} <span style="color:#888;">× ${item.cantidad}</span>
          </td>
          <td style="padding:10px 0; border-bottom:1px solid #eee; text-align:right; color:#333;">
            ${formatearCLP(item.precioUnitario * item.cantidad)}
          </td>
        </tr>`
    )
    .join("");

  const envio = pedido.cliente?.envio || {};
  const direccionCompleta = [
    envio.direccion,
    envio.numero,
    envio.departamento,
  ]
    .filter(Boolean)
    .join(" ");

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
    <div style="text-align:center; padding: 24px 0;">
      <h1 style="font-size:20px; margin:0; color:#111;">MTE Toys</h1>
    </div>

    <div style="background:#f7f7f7; border-radius:8px; padding:24px;">
      <h2 style="font-size:18px; margin-top:0;">¡Gracias por tu compra, ${pedido.cliente.nombre}!</h2>
      <p style="color:#555; line-height:1.5;">
        Confirmamos que recibimos el pago de tu pedido
        <strong>#${numeroPedido}</strong>. Este correo es solo un
        comprobante informativo de tu compra, no reemplaza la boleta
        electrónica que te haremos llegar por separado.
      </p>

      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        ${filasItems}
      </table>

      <table style="width:100%; margin-top:16px;">
        <tr>
          <td style="padding:4px 0; color:#555;">Subtotal productos</td>
          <td style="padding:4px 0; text-align:right; color:#555;">${formatearCLP(pedido.totalProductos)}</td>
        </tr>
        ${pedido.descuento > 0 ? `<tr>
          <td style="padding:4px 0; color:#2e7d32;">Descuento (cupón ${pedido.cuponCodigo})</td>
          <td style="padding:4px 0; text-align:right; color:#2e7d32;">-${formatearCLP(pedido.descuento)}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:4px 0; color:#555;">Envío (${pedido.metodoEnvio || "-"})</td>
          <td style="padding:4px 0; text-align:right; color:#555;">${formatearCLP(pedido.costoEnvio)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; font-weight:bold; border-top:1px solid #ddd;">Total</td>
          <td style="padding:8px 0; text-align:right; font-weight:bold; border-top:1px solid #ddd;">${formatearCLP(pedido.total)}</td>
        </tr>
      </table>
    </div>

    ${
      pedido.metodoEnvio === "Retiro en sede"
        ? `
    <div style="margin-top:20px; padding:20px; background:#f0f7ff; border:2px solid #9ec5f5; border-radius:8px;">
      <h3 style="font-size:16px; margin:0 0 10px; color:#111;">📍 Dónde retirar tu pedido</h3>
      <p style="margin:0 0 12px; color:#333; line-height:1.6; font-size:15px;">
        Retira tu pedido en:<br/>
        <strong style="font-size:17px;">${DIRECCION_SEDE}</strong>
      </p>
      <p style="margin:0 0 14px;">
        <a href="${urlMapaSede}" style="display:inline-block; background:#1a73e8; color:#fff; text-decoration:none; padding:10px 18px; border-radius:6px; font-size:14px; font-weight:bold;">Ver en Google Maps</a>
      </p>
      <p style="margin:0; color:#555; line-height:1.5; font-size:13px;">
        Cuando vengas, menciona tu número de pedido <strong>#${numeroPedido}</strong> y el nombre de quien compró.
        Si tienes dudas sobre el horario, escríbenos por WhatsApp antes de venir.
      </p>
    </div>

    <div style="margin-top:16px; padding:20px; background:#fff; border:1px solid #eee; border-radius:8px;">
      <h3 style="font-size:14px; margin:0 0 8px; color:#111;">Datos de contacto</h3>
      <p style="margin:0; color:#555; line-height:1.5; font-size:14px;">
        ${envio.nombreReceptor || pedido.cliente.nombre}<br/>
        ${envio.telefono || pedido.cliente.telefono || ""}
      </p>
    </div>`
        : `
    <div style="margin-top:20px; padding:20px; background:#fff; border:1px solid #eee; border-radius:8px;">
      <h3 style="font-size:14px; margin:0 0 8px; color:#111;">Datos de envío</h3>
      <p style="margin:0; color:#555; line-height:1.5; font-size:14px;">
        ${envio.nombreReceptor || pedido.cliente.nombre}<br/>
        ${direccionCompleta}<br/>
        ${envio.comuna || ""}, ${envio.region || ""}<br/>
        ${envio.telefono || pedido.cliente.telefono || ""}
      </p>
    </div>`
    }

    <p style="text-align:center; color:#999; font-size:12px; margin-top:24px;">
      MTE Toys · mtetoys.cl<br/>
      Este correo se envió porque realizaste una compra en mtetoys.cl
    </p>
  </div>`;
}

// =====================================================
// ENVIAR CORREO DE CONFIRMACIÓN DE COMPRA
// =====================================================
// No es tributario. Si falla el envío, NUNCA debe romper
// el flujo de pago: el pedido ya quedó pagado en la BD.

// Devuelve { ok, motivo }: el flujo de pago lo ignora, pero el botón
// "Reenviar correo" del admin lo usa para avisar qué falló.
export async function enviarCorreoConfirmacionCompra(pedido) {
  try {
    if (!transporter) {
      console.warn(
        "SMTP no configurado (faltan SMTP_HOST/SMTP_USER/SMTP_PASS): se omite el correo de confirmación"
      );
      return {
        ok: false,
        motivo:
          "El correo no está configurado en el servidor (faltan SMTP_HOST, SMTP_USER o SMTP_PASS)",
      };
    }

    if (!pedido?.cliente?.email) {
      console.warn(
        "Pedido sin email de cliente, se omite el correo de confirmación"
      );
      return { ok: false, motivo: "El pedido no tiene correo del cliente" };
    }

    const numeroPedido = pedido._id
      .toString()
      .slice(-8)
      .toUpperCase();

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: pedido.cliente.email,
      bcc: "ventas@mtetoys.cl",
      subject: `Confirmación de tu compra #${numeroPedido} - MTE Toys`,
      html: construirHtmlConfirmacion(pedido),
    });

    console.log(
      `Correo de confirmación enviado a ${pedido.cliente.email} (pedido ${pedido._id}, messageId: ${info.messageId})`
    );

    return { ok: true };
  } catch (error) {
    // Nunca se relanza: un correo fallido no debe afectar el pago ya procesado.
    console.error(
      `Error inesperado enviando correo de confirmación (pedido ${pedido?._id}):`,
      error
    );

    return {
      ok: false,
      motivo: error?.message || "No se pudo enviar el correo",
    };
  }
}