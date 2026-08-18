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
// FORMATO DE PESOS CHILENOS
// =====================================================

const formatearCLP = (valor) =>
  `$${Math.round(Number(valor) || 0).toLocaleString("es-CL")}`;

// =====================================================
// PLANTILLA HTML: CONFIRMACIÓN DE COMPRA
// =====================================================
// No es una boleta tributaria (SII). Es solo un correo
// informativo para el cliente.

function construirHtmlConfirmacion(pedido) {
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

    <div style="margin-top:20px; padding:20px; background:#fff; border:1px solid #eee; border-radius:8px;">
      <h3 style="font-size:14px; margin:0 0 8px; color:#111;">Datos de envío</h3>
      <p style="margin:0; color:#555; line-height:1.5; font-size:14px;">
        ${envio.nombreReceptor || pedido.cliente.nombre}<br/>
        ${direccionCompleta}<br/>
        ${envio.comuna || ""}, ${envio.region || ""}<br/>
        ${envio.telefono || pedido.cliente.telefono || ""}
      </p>
    </div>

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

export async function enviarCorreoConfirmacionCompra(pedido) {
  try {
    if (!transporter) {
      console.warn(
        "SMTP no configurado (faltan SMTP_HOST/SMTP_USER/SMTP_PASS): se omite el correo de confirmación"
      );
      return;
    }

    if (!pedido?.cliente?.email) {
      console.warn(
        "Pedido sin email de cliente, se omite el correo de confirmación"
      );
      return;
    }

    const numeroPedido = pedido._id
      .toString()
      .slice(-8)
      .toUpperCase();

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: pedido.cliente.email,
      subject: `Confirmación de tu compra #${numeroPedido} - MTE Toys`,
      html: construirHtmlConfirmacion(pedido),
    });

    console.log(
      `Correo de confirmación enviado a ${pedido.cliente.email} (pedido ${pedido._id}, messageId: ${info.messageId})`
    );
  } catch (error) {
    // Nunca se relanza: un correo fallido no debe afectar el pago ya procesado.
    console.error(
      `Error inesperado enviando correo de confirmación (pedido ${pedido?._id}):`,
      error
    );
  }
}