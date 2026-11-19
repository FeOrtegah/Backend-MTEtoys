import crypto from "crypto";
import Cupon from "../models/Cupon.js";
import CuponUso from "../models/CuponUso.js";
import Order from "../models/Order.js";

// =====================================================
// ERROR CONTROLADO (se devuelve tal cual al cliente)
// =====================================================

export class CuponError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "CuponError";
    this.status = status;
  }
}

// Un pedido pendiente de Webpay que lleva más de este tiempo
// sin pagarse se considera abandonado: se cancela y libera
// el cupón para que la persona pueda volver a intentarlo.
const MINUTOS_RESERVA_WEBPAY = 60;

const MSG_NO_VALIDO = "El código no es válido o ya no está disponible";
const MSG_YA_USADO = "Este cupón ya fue utilizado con tus datos";

// =====================================================
// NORMALIZACIÓN (para comparar personas de forma robusta)
// =====================================================

export const normalizarCodigo = (codigo) =>
  String(codigo || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

// 12.345.678-5 / 12345678-5 / 123456785 -> 123456785
export const rutCanonico = (rut) =>
  String(rut || "")
    .replace(/[^0-9kK]/g, "")
    .toUpperCase();

// f.el+tienda@gmail.com -> fel@gmail.com
export const emailCanonico = (email) => {
  const e = String(email || "").trim().toLowerCase();
  const [local, dominio] = e.split("@");

  if (!local || !dominio) return e;

  let l = local.split("+")[0];
  let d = dominio;

  if (d === "googlemail.com") d = "gmail.com";
  if (d === "gmail.com") l = l.replace(/\./g, "");

  return `${l}@${d}`;
};

// +56 9 1234 5678 -> 912345678 (últimos 9 dígitos)
export const telefonoCanonico = (tel) => {
  const digitos = String(tel || "").replace(/\D/g, "");
  return digitos.slice(-9);
};

const textoCanonico = (t) =>
  String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// Huella de una dirección: calle + número + depto + comuna
export const direccionCanonica = (dir) => {
  if (!dir) return "";

  const base = [dir.direccion, dir.numero, dir.departamento, dir.comuna]
    .map(textoCanonico)
    .join("|");

  if (!textoCanonico(dir.direccion) || !textoCanonico(dir.numero)) {
    return "";
  }

  return crypto.createHash("sha1").update(base).digest("hex");
};

// Junta todos los datos que identifican a la persona
export const identidadDeCliente = ({ rut, email, telefono, facturacion, envio }) => {
  const telefonos = [
    ...new Set(
      [telefono, envio?.telefono].map(telefonoCanonico).filter((t) => t.length === 9)
    ),
  ];

  const direcciones = [
    ...new Set(
      [facturacion, envio].map(direccionCanonica).filter(Boolean)
    ),
  ];

  return {
    rut: rutCanonico(rut),
    email: emailCanonico(email),
    telefonos,
    direcciones,
  };
};

// =====================================================
// DESCUENTO
// =====================================================

export const calcularDescuento = (cupon, subtotal) => {
  const base = Math.max(0, Math.round(Number(subtotal) || 0));

  let descuento =
    cupon.tipo === "porcentaje"
      ? Math.round((base * cupon.valor) / 100)
      : Math.round(cupon.valor);

  // El pedido nunca puede quedar en $0 (Webpay no lo acepta)
  descuento = Math.min(descuento, Math.max(0, base - 1));

  return Math.max(0, descuento);
};

// =====================================================
// VALIDAR CUPÓN (solo lectura, no gasta nada)
// =====================================================

const cargarCuponValido = async (codigo, subtotal, emailCanon) => {
  const codigoNorm = normalizarCodigo(codigo);

  if (!codigoNorm) throw new CuponError("Ingresa un código de descuento");

  const cupon = await Cupon.findOne({ codigo: codigoNorm });

  if (!cupon || !cupon.activo) throw new CuponError(MSG_NO_VALIDO);

  const ahora = new Date();

  if (cupon.fechaInicio && ahora < cupon.fechaInicio) {
    throw new CuponError(MSG_NO_VALIDO);
  }

  // El día de término se considera completo (hasta el final
  // de ese día en UTC, igual que las etiquetas)
  if (cupon.fechaFin) {
    const fin = new Date(cupon.fechaFin);
    fin.setUTCHours(23, 59, 59, 999);
    if (ahora > fin) throw new CuponError("Este cupón ya venció");
  }

  if (cupon.emailAsignado && cupon.emailAsignado !== emailCanon) {
    throw new CuponError("Este cupón fue emitido para otro correo electrónico");
  }

  if (cupon.montoMinimo > 0 && Number(subtotal) < cupon.montoMinimo) {
    throw new CuponError(
      `Este cupón requiere una compra mínima de $${cupon.montoMinimo.toLocaleString("es-CL")}`
    );
  }

  return cupon;
};

const filtroIdentidad = (campania, id) => ({
  campania,
  $or: [
    { rut: id.rut },
    { email: id.email },
    ...(id.telefonos.length ? [{ telefonos: { $in: id.telefonos } }] : []),
    ...(id.direcciones.length ? [{ direcciones: { $in: id.direcciones } }] : []),
  ],
});

// =====================================================
// LIBERAR RESERVAS ABANDONADAS
// =====================================================

const liberarUso = async (uso) => {
  // findOneAndDelete asegura que solo UNA llamada descuenta el
  // contador, aunque dos procesos intenten liberar a la vez.
  const borrado = await CuponUso.findOneAndDelete({ _id: uso._id });

  if (borrado) {
    await Cupon.updateOne(
      { _id: borrado.cupon, usosActuales: { $gt: 0 } },
      { $inc: { usosActuales: -1 } }
    );
  }

  return Boolean(borrado);
};

const liberarObsoletas = async (filtro) => {
  const usos = await CuponUso.find({ ...filtro, estado: "reservado" });
  let liberadas = 0;

  const limite = Date.now() - MINUTOS_RESERVA_WEBPAY * 60 * 1000;

  for (const uso of usos) {
    const pedido = await Order.findById(uso.pedido);

    const obsoleta =
      !pedido ||
      pedido.estado === "cancelado" ||
      (pedido.estado === "pendiente" &&
        pedido.metodoPago === "webpay" &&
        pedido.createdAt.getTime() < limite);

    if (!obsoleta) continue;

    if (pedido && pedido.estado === "pendiente") {
      // El hook de Order libera el cupón al cancelar
      pedido.estado = "cancelado";
      await pedido.save();
      liberadas += 1;
      continue;
    }

    if (await liberarUso(uso)) liberadas += 1;
  }

  return liberadas;
};

// =====================================================
// PREVISUALIZAR (para el botón "Aplicar" del checkout)
// =====================================================

export const previsualizarCupon = async ({ codigo, subtotal, cliente }) => {
  const id = identidadDeCliente(cliente);
  const cupon = await cargarCuponValido(codigo, subtotal, id.email);

  if (cupon.usosMaximos && cupon.usosActuales >= cupon.usosMaximos) {
    await liberarObsoletas({ cupon: cupon._id });
    const actual = await Cupon.findById(cupon._id);
    if (actual.usosActuales >= actual.usosMaximos) {
      throw new CuponError(MSG_NO_VALIDO);
    }
  }

  if (id.rut && id.email) {
    const filtro = filtroIdentidad(cupon.campania, id);
    await liberarObsoletas(filtro);

    if (await CuponUso.exists(filtro)) throw new CuponError(MSG_YA_USADO);
  }

  return { cupon, descuento: calcularDescuento(cupon, subtotal) };
};

// =====================================================
// RESERVAR (al crear el pedido, de forma atómica)
// =====================================================

export const reservarCupon = async ({ codigo, subtotal, cliente, pedidoId }) => {
  const id = identidadDeCliente(cliente);
  const cupon = await cargarCuponValido(codigo, subtotal, id.email);
  const descuento = calcularDescuento(cupon, subtotal);

  if (descuento <= 0) throw new CuponError(MSG_NO_VALIDO);

  const hayCupoFiltro = {
    _id: cupon._id,
    activo: true,
    $or: [
      { usosMaximos: null },
      { $expr: { $lt: ["$usosActuales", "$usosMaximos"] } },
    ],
  };

  for (let intento = 0; intento < 2; intento += 1) {
    // 1) Tomar un cupo (atómico: nadie puede pasarse del máximo)
    const reservado = await Cupon.findOneAndUpdate(
      hayCupoFiltro,
      { $inc: { usosActuales: 1 } },
      { new: true }
    );

    if (!reservado) {
      if (intento === 0 && (await liberarObsoletas({ cupon: cupon._id })) > 0) continue;
      throw new CuponError(MSG_NO_VALIDO);
    }

    // 2) Registrar a la persona (los índices únicos deciden)
    try {
      await CuponUso.create({
        cupon: cupon._id,
        codigo: cupon.codigo,
        campania: cupon.campania,
        pedido: pedidoId,
        rut: id.rut,
        email: id.email,
        telefonos: id.telefonos,
        direcciones: id.direcciones,
        descuento,
        estado: "reservado",
      });

      return { cupon, descuento };
    } catch (error) {
      await Cupon.updateOne(
        { _id: cupon._id, usosActuales: { $gt: 0 } },
        { $inc: { usosActuales: -1 } }
      );

      if (error?.code === 11000) {
        // Quizá el "uso previo" es un pedido abandonado: se libera y se reintenta
        if (
          intento === 0 &&
          (await liberarObsoletas(filtroIdentidad(cupon.campania, id))) > 0
        ) {
          continue;
        }

        throw new CuponError(MSG_YA_USADO);
      }

      throw error;
    }
  }

  throw new CuponError(MSG_YA_USADO);
};

// =====================================================
// ESTADO DEL CUPÓN SEGÚN EL PEDIDO
// =====================================================

// Pedido cancelado / eliminado: se libera el cupón
export const liberarCuponDePedido = async (pedidoId) => {
  const uso = await CuponUso.findOne({ pedido: pedidoId });
  if (uso) await liberarUso(uso);
};

// Pedido pagado: la reserva pasa a "usado"
export const confirmarCuponDePedido = async (pedidoId) => {
  await CuponUso.updateOne(
    { pedido: pedidoId, estado: "reservado" },
    { $set: { estado: "usado" } }
  );
};

// =====================================================
// GENERAR CÓDIGOS ÚNICOS
// =====================================================

// Sin 0/O/1/I/L para que no se confundan al leerlos o dictarlos
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const generarCodigoAleatorio = (prefijo = "", largo = 8) => {
  let sufijo = "";

  for (let i = 0; i < largo; i += 1) {
    sufijo += ALFABETO[crypto.randomInt(ALFABETO.length)];
  }

  return `${normalizarCodigo(prefijo)}${sufijo}`;
};
