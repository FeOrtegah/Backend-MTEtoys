import mongoose from "mongoose";
import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { enviarCorreoConfirmacionCompra } from "../config/email.js";

// =====================================================
// ZONAS DE ENVÍO
// =====================================================

const COMUNAS_VERDES = [
  "Quilicura",
  "Huechuraba",
  "Conchalí",
  "Independencia",
  "Renca",
  "Cerro Navia",
  "Quinta Normal",
  "Pudahuel",
  "Lo Prado",
  "Santiago",
  "Estación Central",
  "Cerrillos",
  "Maipú",
  "Pedro Aguirre Cerda",
  "San Miguel",
  "Lo Espejo",
  "La Cisterna",
];

const COMUNAS_AZULES = [
  "Lo Barnechea",
  "Vitacura",
  "Las Condes",
  "Recoleta",
  "Providencia",
  "La Reina",
  "Ñuñoa",
  "Macul",
  "Peñalolén",
  "San Joaquín",
  "La Granja",
  "San Ramón",
  "El Bosque",
  "La Pintana",
  "La Florida",
  "San Bernardo",
  "Puente Alto",
];

const COSTO_LOGISTICA_360 = 3490;
// Chilexpress ahora es "por pagar" al recibir, no se cobra en checkout.
// Se deja este valor documentado por si en el futuro se vuelve a cobrar en línea.
const COSTO_CHILEXPRESS_REGIONES = 4990; // eslint-disable-line no-unused-vars

const obtenerZonaEnvio = (comuna) => {
  if (!comuna) {
    return null;
  }

  if (COMUNAS_VERDES.includes(comuna)) {
    return "verde";
  }

  if (COMUNAS_AZULES.includes(comuna)) {
    return "azul";
  }

  return "fuera";
};

// =====================================================
// OBTENER PRECIO REAL DE VENTA
// =====================================================

const getPrecioVenta = (producto) => {
  if (
    producto.enOferta === true &&
    producto.precioOferta !== null &&
    producto.precioOferta !== undefined &&
    Number.isFinite(Number(producto.precioOferta)) &&
    Number(producto.precioOferta) >= 0
  ) {
    return Number(producto.precioOferta);
  }

  return Number(producto.precio);
};

// =====================================================
// LIMPIAR TEXTO
// =====================================================

const limpiarTexto = (valor) => {
  if (typeof valor !== "string") {
    return "";
  }
  return valor.trim();
};

// =====================================================
// VALIDAR EMAIL
// =====================================================

const validarEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// =====================================================
// VALIDAR RUT CHILENO
// =====================================================

const validarRut = (rut) => {
  if (typeof rut !== "string") return false;
  const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "").replace(/\s/g, "").toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(rutLimpio)) return false;

  const cuerpo = rutLimpio.slice(0, -1);
  const digitoVerificador = rutLimpio.slice(-1);
  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = (multiplicador + 1) > 7 ? 2 : (multiplicador + 1);
  }

  const resto = suma % 11;
  const resultado = 11 - resto;
  let dvEsperado = resultado === 11 ? "0" : resultado === 10 ? "K" : String(resultado);

  return dvEsperado === digitoVerificador;
};

const normalizarRut = (rut) => limpiarTexto(rut).replace(/\./g, "").replace(/\s/g, "").toUpperCase();

// =====================================================
// VALIDAR TELÉFONO CHILENO
// =====================================================

const validarTelefono = (telefono) => {
  if (typeof telefono !== "string") return false;
  const limpio = telefono.replace(/[\s()-]/g, "");
  return /^(?:\+?56)?9\d{8}$/.test(limpio);
};

const normalizarTelefono = (telefono) => {
  const limpio = limpiarTexto(telefono).replace(/[\s()-]/g, "");
  if (limpio.startsWith("+56")) return limpio;
  if (limpio.startsWith("56")) return `+${limpio}`;
  if (/^9\d{8}$/.test(limpio)) return `+56${limpio}`;
  return limpio;
};

// =====================================================
// VALIDAR TEXTO OBLIGATORIO
// =====================================================

const validarTexto = (valor, nombreCampo, minimo = 2, maximo = 150) => {
  if (typeof valor !== "string") return `${nombreCampo} debe ser texto`;
  const limpio = valor.trim();
  if (!limpio) return `${nombreCampo} es obligatorio`;
  if (limpio.length < minimo) return `${nombreCampo} es demasiado corto`;
  if (limpio.length > maximo) return `${nombreCampo} es demasiado largo`;
  return null;
};

// =====================================================
// VALIDAR DATOS DE FACTURACIÓN Y ENVÍO
// =====================================================

const validarFacturacion = (facturacion) => {
  if (!facturacion || typeof facturacion !== "object") return "Faltan los datos de facturación";
  const errorNombre = validarTexto(facturacion.nombre, "El nombre de facturación", 2, 100);
  if (errorNombre) return errorNombre;
  const rut = normalizarRut(facturacion.rut);
  if (!rut || !validarRut(rut)) return "El RUT de facturación no es válido";
  const errorDireccion = validarTexto(facturacion.direccion, "La dirección de facturación", 3, 150);
  if (errorDireccion) return errorDireccion;
  const errorNumero = validarTexto(String(facturacion.numero ?? ""), "El número de la dirección de facturación", 1, 10);
  if (errorNumero) return errorNumero;
  const errorRegion = validarTexto(facturacion.region, "La región de facturación", 2, 100);
  if (errorRegion) return errorRegion;
  const errorComuna = validarTexto(facturacion.comuna, "La comuna de facturación", 2, 100);
  if (errorComuna) return errorComuna;
  return null;
};

const validarEnvio = (envio) => {
  if (!envio || typeof envio !== "object") return "Faltan los datos de envío";
  const errorNombre = validarTexto(envio.nombreReceptor, "El nombre del receptor", 2, 100);
  if (errorNombre) return errorNombre;
  if (!validarTelefono(normalizarTelefono(envio.telefono))) return "El teléfono de envío no es válido";
  const errorDireccion = validarTexto(envio.direccion, "La dirección de envío", 3, 150);
  if (errorDireccion) return errorDireccion;
  const errorNumero = validarTexto(String(envio.numero ?? ""), "El número de la dirección de envío", 1, 10);
  if (errorNumero) return errorNumero;
  const errorRegion = validarTexto(envio.region, "La región de envío", 2, 100);
  if (errorRegion) return errorRegion;
  const errorComuna = validarTexto(envio.comuna, "La comuna de envío", 2, 100);
  if (errorComuna) return errorComuna;
  return null;
};

// =====================================================
// CREAR PEDIDO
// =====================================================

export const createOrder = async (req, res) => {
  try {
    const { cliente, items } = req.body;

    if (!cliente || typeof cliente !== "object") {
      return res.status(400).json({ message: "Faltan los datos del cliente" });
    }

    const nombre = limpiarTexto(cliente.nombre);
    const email = limpiarTexto(cliente.email).toLowerCase();
    const rut = normalizarRut(cliente.rut);
    const telefono = normalizarTelefono(cliente.telefono);

    if (validarTexto(nombre, "El nombre", 2, 100)) return res.status(400).json({ message: "Nombre inválido" });
    if (!email || !validarEmail(email)) return res.status(400).json({ message: "El correo electrónico no es válido" });
    if (!rut || !validarRut(rut)) return res.status(400).json({ message: "El RUT no es válido" });
    if (!validarTelefono(telefono)) return res.status(400).json({ message: "El número de teléfono no es válido" });

    const errorFacturacion = validarFacturacion(cliente.facturacion);
    if (errorFacturacion) return res.status(400).json({ message: errorFacturacion });

    const errorEnvio = validarEnvio(cliente.envio);
    if (errorEnvio) return res.status(400).json({ message: errorEnvio });

    const facturacion = {
      nombre: limpiarTexto(cliente.facturacion.nombre),
      rut: normalizarRut(cliente.facturacion.rut),
      direccion: limpiarTexto(cliente.facturacion.direccion),
      numero: limpiarTexto(String(cliente.facturacion.numero)),
      departamento: limpiarTexto(cliente.facturacion.departamento || ""),
      region: limpiarTexto(cliente.facturacion.region),
      comuna: limpiarTexto(cliente.facturacion.comuna),
    };

    const envio = {
      nombreReceptor: limpiarTexto(cliente.envio.nombreReceptor),
      telefono: normalizarTelefono(cliente.envio.telefono),
      direccion: limpiarTexto(cliente.envio.direccion),
      numero: limpiarTexto(String(cliente.envio.numero)),
      departamento: limpiarTexto(cliente.envio.departamento || ""),
      region: limpiarTexto(cliente.envio.region),
      comuna: limpiarTexto(cliente.envio.comuna),
      indicaciones: limpiarTexto(cliente.envio.indicaciones || ""),
    };

    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      return res.status(400).json({ message: "Items del pedido inválidos" });
    }

    const itemsPedido = [];
    let total = 0;

    for (const item of items) {
      if (!item || !item.producto || !mongoose.Types.ObjectId.isValid(item.producto)) {
        return res.status(400).json({ message: "Producto inválido" });
      }

      const cantidad = Number(item.cantidad);
      if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 10000) {
        return res.status(400).json({ message: "Cantidad inválida" });
      }

      const producto = await Product.findById(item.producto);
      if (!producto || !producto.activo) {
        return res.status(404).json({ message: "Producto no disponible" });
      }

      if (producto.stock < cantidad) {
        return res.status(400).json({ message: `Stock insuficiente para ${producto.nombre}` });
      }

      const precioUnitario = getPrecioVenta(producto);
      total += precioUnitario * cantidad;

      itemsPedido.push({
        producto: producto._id,
        nombre: producto.nombre,
        cantidad,
        precioUnitario,
      });
    }

    const totalProductos = Math.round(total);
    const zonaEnvio = obtenerZonaEnvio(envio.comuna);
    const metodoEnvioRecibido = typeof req.body.metodoEnvio === "string" ? req.body.metodoEnvio.trim() : null;

    let metodoEnvio = null;
    let costoEnvio = 0;

    if (zonaEnvio === "verde") {
      if (metodoEnvioRecibido === "Logística 360") {
        metodoEnvio = "Logística 360";
        costoEnvio = COSTO_LOGISTICA_360;
      } else if (metodoEnvioRecibido === "Bluexpress") {
        metodoEnvio = "Bluexpress";
        costoEnvio = 0;
      } else {
        return res.status(400).json({ message: "Debes seleccionar un método de envío" });
      }
    } else if (zonaEnvio === "azul") {
      if (metodoEnvioRecibido === "Bluexpress") {
        metodoEnvio = "Bluexpress";
        costoEnvio = 0;
      } else {
        return res.status(400).json({ message: "Para tu comuna el único método de envío disponible es Bluexpress" });
      }
    } else {
      if (metodoEnvioRecibido === "Chilexpress") {
        metodoEnvio = "Chilexpress";
        // Chilexpress es "por pagar": el cliente paga el envío
        // directamente al recibir, no se cobra en el checkout.
        costoEnvio = 0;
      } else {
        return res.status(400).json({ message: "Debes seleccionar un método de envío" });
      }
    }

    const totalFinal = totalProductos + costoEnvio;
    const accessToken = crypto.randomBytes(24).toString("hex");

    const pedido = new Order({
      cliente: { nombre, email, rut, telefono, facturacion, envio, direccion: `${envio.direccion} ${envio.numero}`.trim() },
      items: itemsPedido,
      totalProductos,
      metodoEnvio,
      costoEnvio,
      total: totalFinal,
      estado: "pendiente",
      metodoPago: "webpay",
      accessToken,
    });

    const nuevoPedido = await pedido.save();

    // El documento recién guardado en memoria SÍ incluye accessToken
    // (select:false solo oculta el campo en consultas posteriores),
    // así que se entrega una única vez en esta respuesta.
    return res.status(201).json(nuevoPedido);
  } catch (error) {
    console.error("Error creando pedido:", error);
    return res.status(500).json({ message: "Error al crear el pedido" });
  }
};

// =====================================================
// RESTO DE LOS CONTROLADORES (GetOrders, GetMyOrders, etc.)
// =====================================================

export const getOrders = async (req, res) => {
  try {
    const pedidos = await Order.find().sort({ createdAt: -1 });
    return res.json(pedidos);
  } catch (error) {
    console.error("Error obteniendo pedidos:", error);
    return res.status(500).json({ message: "Error al obtener los pedidos" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ message: "Usuario no autenticado" });
    const emailUsuario = req.usuario.email.trim().toLowerCase();
    const pedidos = await Order.find({ "cliente.email": emailUsuario }).sort({ createdAt: -1 });
    return res.json(pedidos);
  } catch (error) {
    console.error("Error obteniendo pedidos del usuario:", error);
    return res.status(500).json({ message: "Error al obtener tus pedidos" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "ID inválido" });
    const pedido = await Order.findById(id);
    if (!pedido) return res.status(404).json({ message: "Pedido no encontrado" });
    if (!req.usuario) return res.status(401).json({ message: "Usuario no autenticado" });
    if (req.usuario.rol !== "admin" && req.usuario.email.toLowerCase() !== pedido.cliente.email.toLowerCase()) {
      return res.status(403).json({ message: "No tienes permiso" });
    }
    return res.json(pedido);
  } catch (error) {
    console.error("Error obteniendo pedido:", error);
    return res.status(500).json({ message: "Error al obtener el pedido" });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { codigoTransaccion } = req.body;
    const pedido = await Order.findById(req.params.id);
    if (!pedido) return res.status(404).json({ message: "Pedido no encontrado" });
    if (pedido.estado === "pagado") return res.status(400).json({ message: "Pedido ya pagado" });
    if (pedido.estado === "cancelado") return res.status(400).json({ message: "No se puede pagar un pedido cancelado" });

    for (const item of pedido.items) {
      const producto = await Product.findById(item.producto);
      if (!producto || producto.stock < item.cantidad) {
        return res.status(400).json({ message: `Stock insuficiente para ${item.nombre}` });
      }
    }
    for (const item of pedido.items) {
      const producto = await Product.findById(item.producto);
      producto.stock -= item.cantidad;
      await producto.save();
    }
    pedido.estado = "pagado";
    pedido.codigoTransaccion = limpiarTexto(codigoTransaccion || "");
    await pedido.save();

    // No se espera (await): no debe demorar la respuesta al admin
    // ni romper el flujo si el correo falla.
    enviarCorreoConfirmacionCompra(pedido);

    return res.json(pedido);
  } catch (error) {
    console.error("Error confirmando pago:", error);
    return res.status(500).json({ message: "Error al confirmar el pago" });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const pedido = await Order.findById(req.params.id);
    if (!pedido) return res.status(404).json({ message: "Pedido no encontrado" });
    if (pedido.estado === "pagado") return res.status(400).json({ message: "No se puede cancelar un pedido ya pagado" });
    pedido.estado = "cancelado";
    await pedido.save();
    return res.json(pedido);
  } catch (error) {
    console.error("Error cancelando pedido:", error);
    return res.status(500).json({ message: "Error al cancelar el pedido" });
  }
};

// =====================================================
// MARCAR PEDIDO COMO ENVIADO
// =====================================================
// Marca manual: el admin confirma que despachó el pedido
// físicamente. Solo aplica a pedidos ya pagados.

export const markAsShipped = async (req, res) => {
  try {
    const pedido = await Order.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    if (pedido.estado !== "pagado") {
      return res.status(400).json({
        message: "Solo se pueden marcar como enviados los pedidos pagados",
      });
    }

    pedido.estado = "enviado";
    await pedido.save();

    return res.json(pedido);
  } catch (error) {
    console.error("Error marcando pedido como enviado:", error);
    return res.status(500).json({ message: "Error al marcar el pedido como enviado" });
  }
};