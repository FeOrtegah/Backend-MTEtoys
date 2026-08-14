import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";


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
  if (typeof rut !== "string") {
    return false;
  }

  const rutLimpio = rut
    .replace(/\./g, "")
    .replace(/-/g, "")
    .replace(/\s/g, "")
    .toUpperCase();

  if (!/^\d{7,8}[0-9K]$/.test(rutLimpio)) {
    return false;
  }

  const cuerpo = rutLimpio.slice(0, -1);
  const digitoVerificador = rutLimpio.slice(-1);

  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;

    multiplicador++;

    if (multiplicador > 7) {
      multiplicador = 2;
    }
  }

  const resto = suma % 11;
  const resultado = 11 - resto;

  let dvEsperado;

  if (resultado === 11) {
    dvEsperado = "0";
  } else if (resultado === 10) {
    dvEsperado = "K";
  } else {
    dvEsperado = String(resultado);
  }

  return dvEsperado === digitoVerificador;
};


// =====================================================
// NORMALIZAR RUT
// =====================================================

const normalizarRut = (rut) => {
  return limpiarTexto(rut)
    .replace(/\./g, "")
    .replace(/\s/g, "")
    .toUpperCase();
};


// =====================================================
// VALIDAR TELÉFONO CHILENO
// =====================================================

const validarTelefono = (telefono) => {
  if (typeof telefono !== "string") {
    return false;
  }

  const limpio = telefono.replace(/[\s()-]/g, "");

  // Formatos aceptados:
  //
  // +56912345678
  // 56912345678
  // 912345678
  //
  return /^(?:\+?56)?9\d{8}$/.test(limpio);
};


// =====================================================
// NORMALIZAR TELÉFONO
// =====================================================

const normalizarTelefono = (telefono) => {
  const limpio = limpiarTexto(telefono)
    .replace(/[\s()-]/g, "");

  if (limpio.startsWith("+56")) {
    return limpio;
  }

  if (limpio.startsWith("56")) {
    return `+${limpio}`;
  }

  if (/^9\d{8}$/.test(limpio)) {
    return `+56${limpio}`;
  }

  return limpio;
};


// =====================================================
// VALIDAR TEXTO OBLIGATORIO
// =====================================================

const validarTexto = (
  valor,
  nombreCampo,
  minimo = 2,
  maximo = 150
) => {
  if (typeof valor !== "string") {
    return `${nombreCampo} debe ser texto`;
  }

  const limpio = valor.trim();

  if (!limpio) {
    return `${nombreCampo} es obligatorio`;
  }

  if (limpio.length < minimo) {
    return `${nombreCampo} es demasiado corto`;
  }

  if (limpio.length > maximo) {
    return `${nombreCampo} es demasiado largo`;
  }

  return null;
};


// =====================================================
// VALIDAR DATOS DE FACTURACIÓN
// =====================================================

const validarFacturacion = (facturacion) => {
  if (!facturacion || typeof facturacion !== "object") {
    return "Faltan los datos de facturación";
  }

  const errorNombre = validarTexto(
    facturacion.nombre,
    "El nombre de facturación",
    2,
    100
  );

  if (errorNombre) {
    return errorNombre;
  }


  const rut = normalizarRut(facturacion.rut);

  if (!rut) {
    return "El RUT de facturación es obligatorio";
  }

  if (!validarRut(rut)) {
    return "El RUT de facturación no es válido";
  }


  const errorDireccion = validarTexto(
    facturacion.direccion,
    "La dirección de facturación",
    3,
    150
  );

  if (errorDireccion) {
    return errorDireccion;
  }


  const errorNumero = validarTexto(
    String(facturacion.numero ?? ""),
    "El número de la dirección de facturación",
    1,
    10
  );

  if (errorNumero) {
    return errorNumero;
  }


  const errorRegion = validarTexto(
    facturacion.region,
    "La región de facturación",
    2,
    100
  );

  if (errorRegion) {
    return errorRegion;
  }


  const errorComuna = validarTexto(
    facturacion.comuna,
    "La comuna de facturación",
    2,
    100
  );

  if (errorComuna) {
    return errorComuna;
  }


  if (
    facturacion.departamento !== undefined &&
    typeof facturacion.departamento !== "string"
  ) {
    return "El departamento de facturación no es válido";
  }


  return null;
};


// =====================================================
// VALIDAR DATOS DE ENVÍO
// =====================================================

const validarEnvio = (envio) => {
  if (!envio || typeof envio !== "object") {
    return "Faltan los datos de envío";
  }


  const errorNombre = validarTexto(
    envio.nombreReceptor,
    "El nombre del receptor",
    2,
    100
  );

  if (errorNombre) {
    return errorNombre;
  }


  const telefono = normalizarTelefono(envio.telefono);

  if (!validarTelefono(telefono)) {
    return "El teléfono de envío no es válido";
  }


  const errorDireccion = validarTexto(
    envio.direccion,
    "La dirección de envío",
    3,
    150
  );

  if (errorDireccion) {
    return errorDireccion;
  }


  const errorNumero = validarTexto(
    String(envio.numero ?? ""),
    "El número de la dirección de envío",
    1,
    10
  );

  if (errorNumero) {
    return errorNumero;
  }


  const errorRegion = validarTexto(
    envio.region,
    "La región de envío",
    2,
    100
  );

  if (errorRegion) {
    return errorRegion;
  }


  const errorComuna = validarTexto(
    envio.comuna,
    "La comuna de envío",
    2,
    100
  );

  if (errorComuna) {
    return errorComuna;
  }


  if (
    envio.departamento !== undefined &&
    typeof envio.departamento !== "string"
  ) {
    return "El departamento de envío no es válido";
  }


  if (
    envio.indicaciones !== undefined &&
    typeof envio.indicaciones !== "string"
  ) {
    return "Las indicaciones de envío no son válidas";
  }


  return null;
};


// =====================================================
// CREAR PEDIDO
// =====================================================
// Público.
// Permite comprar con o sin cuenta.
//
// IMPORTANTE:
// El frontend NO controla:
// - precio
// - stock
// - total
//
// Todo se vuelve a comprobar aquí.

export const createOrder = async (req, res) => {
  try {
    const { cliente, items } = req.body;


    // =================================================
    // VALIDAR CLIENTE
    // =================================================

    if (
      !cliente ||
      typeof cliente !== "object"
    ) {
      return res.status(400).json({
        message: "Faltan los datos del cliente",
      });
    }


    // =================================================
    // DATOS PRINCIPALES
    // =================================================

    const nombre = limpiarTexto(
      cliente.nombre
    );

    const email = limpiarTexto(
      cliente.email
    ).toLowerCase();

    const rut = normalizarRut(
      cliente.rut
    );

    const telefono = normalizarTelefono(
      cliente.telefono
    );


    // -------------------------------------------------
    // NOMBRE
    // -------------------------------------------------

    const errorNombre = validarTexto(
      nombre,
      "El nombre",
      2,
      100
    );

    if (errorNombre) {
      return res.status(400).json({
        message: errorNombre,
      });
    }


    // -------------------------------------------------
    // EMAIL
    // -------------------------------------------------

    if (!email || !validarEmail(email)) {
      return res.status(400).json({
        message:
          "El correo electrónico no es válido",
      });
    }


    if (email.length > 150) {
      return res.status(400).json({
        message:
          "El correo electrónico es demasiado largo",
      });
    }


    // -------------------------------------------------
    // RUT
    // -------------------------------------------------

    if (!rut || !validarRut(rut)) {
      return res.status(400).json({
        message: "El RUT no es válido",
      });
    }


    // -------------------------------------------------
    // TELÉFONO
    // -------------------------------------------------

    if (!validarTelefono(telefono)) {
      return res.status(400).json({
        message:
          "El número de teléfono no es válido",
      });
    }


    // =================================================
    // FACTURACIÓN
    // =================================================

    const errorFacturacion =
      validarFacturacion(
        cliente.facturacion
      );

    if (errorFacturacion) {
      return res.status(400).json({
        message: errorFacturacion,
      });
    }


    // =================================================
    // ENVÍO
    // =================================================

    const errorEnvio =
      validarEnvio(
        cliente.envio
      );

    if (errorEnvio) {
      return res.status(400).json({
        message: errorEnvio,
      });
    }


    // =================================================
    // LIMPIAR FACTURACIÓN
    // =================================================

    const facturacion = {
      nombre:
        limpiarTexto(
          cliente.facturacion.nombre
        ),

      rut:
        normalizarRut(
          cliente.facturacion.rut
        ),

      direccion:
        limpiarTexto(
          cliente.facturacion.direccion
        ),

      numero:
        limpiarTexto(
          String(
            cliente.facturacion.numero
          )
        ),

      departamento:
        limpiarTexto(
          cliente.facturacion.departamento || ""
        ),

      region:
        limpiarTexto(
          cliente.facturacion.region
        ),

      comuna:
        limpiarTexto(
          cliente.facturacion.comuna
        ),
    };


    // =================================================
    // LIMPIAR ENVÍO
    // =================================================

    const envio = {
      nombreReceptor:
        limpiarTexto(
          cliente.envio.nombreReceptor
        ),

      telefono:
        normalizarTelefono(
          cliente.envio.telefono
        ),

      direccion:
        limpiarTexto(
          cliente.envio.direccion
        ),

      numero:
        limpiarTexto(
          String(
            cliente.envio.numero
          )
        ),

      departamento:
        limpiarTexto(
          cliente.envio.departamento || ""
        ),

      region:
        limpiarTexto(
          cliente.envio.region
        ),

      comuna:
        limpiarTexto(
          cliente.envio.comuna
        ),

      indicaciones:
        limpiarTexto(
          cliente.envio.indicaciones || ""
        ),
    };


    // =================================================
    // ITEMS
    // =================================================

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message:
          "El pedido debe contener al menos un producto",
      });
    }


    // Evita pedidos gigantes enviados
    // artificialmente al backend.

    if (items.length > 100) {
      return res.status(400).json({
        message:
          "El pedido contiene demasiados productos",
      });
    }


    // =================================================
    // CONSTRUIR ITEMS
    // =================================================

    const itemsPedido = [];

    let total = 0;


    for (const item of items) {

      // ------------------------------------------------
      // PRODUCTO
      // ------------------------------------------------

      if (!item || !item.producto) {
        return res.status(400).json({
          message:
            "Falta el ID de un producto",
        });
      }


      // ------------------------------------------------
      // ID
      // ------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          item.producto
        )
      ) {
        return res.status(400).json({
          message:
            `ID de producto inválido: ${item.producto}`,
        });
      }


      // ------------------------------------------------
      // CANTIDAD
      // ------------------------------------------------

      const cantidad =
        Number(item.cantidad);


      if (
        !Number.isInteger(cantidad) ||
        cantidad <= 0 ||
        cantidad > 10000
      ) {
        return res.status(400).json({
          message:
            "La cantidad de los productos no es válida",
        });
      }


      // ------------------------------------------------
      // BUSCAR PRODUCTO
      // ------------------------------------------------

      const producto =
        await Product.findById(
          item.producto
        );


      if (!producto) {
        return res.status(404).json({
          message:
            `Producto no encontrado: ${item.producto}`,
        });
      }


      // ------------------------------------------------
      // PRODUCTO ACTIVO
      // ------------------------------------------------

      if (!producto.activo) {
        return res.status(400).json({
          message:
            `El producto "${producto.nombre}" ya no está disponible`,
        });
      }


      // ------------------------------------------------
      // STOCK
      // ------------------------------------------------

      if (
        !Number.isInteger(
          Number(producto.stock)
        ) ||
        producto.stock < cantidad
      ) {
        return res.status(400).json({
          message:
            `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
        });
      }


      // ------------------------------------------------
      // PRECIO REAL
      // ------------------------------------------------

      const precioUnitario =
        getPrecioVenta(producto);


      if (
        !Number.isFinite(
          precioUnitario
        ) ||
        precioUnitario < 0
      ) {
        return res.status(400).json({
          message:
            `El precio del producto "${producto.nombre}" no es válido`,
        });
      }


      // ------------------------------------------------
      // SUBTOTAL
      // ------------------------------------------------

      const subtotal =
        precioUnitario *
        cantidad;


      if (
        !Number.isFinite(subtotal) ||
        subtotal < 0
      ) {
        return res.status(400).json({
          message:
            "No se pudo calcular el subtotal del pedido",
        });
      }


      total += subtotal;


      // ------------------------------------------------
      // GUARDAR ITEM
      // ------------------------------------------------

      itemsPedido.push({
        producto:
          producto._id,

        nombre:
          producto.nombre,

        cantidad,

        precioUnitario,
      });
    }


    // =================================================
    // TOTAL
    // =================================================

    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      return res.status(400).json({
        message:
          "El total del pedido no es válido",
      });
    }


    // =================================================
    // CREAR PEDIDO
    // =================================================

    const pedido =
      new Order({
        cliente: {
          nombre,
          email,
          rut,
          telefono,

          facturacion,

          envio,

          // Compatibilidad:
          // guardamos también una dirección
          // legible de envío.

          direccion:
            `${envio.direccion} ${envio.numero}`.trim(),
        },

        items:
          itemsPedido,

        total:
          Math.round(total),

        estado:
          "pendiente",

        metodoPago:
          "webpay",
      });


    // =================================================
    // GUARDAR
    // =================================================

    const nuevoPedido =
      await pedido.save();


    return res.status(201).json(
      nuevoPedido
    );


  } catch (error) {

    console.error(
      "Error creando pedido:",
      error
    );

    return res.status(500).json({
      message:
        "Error al crear el pedido",
    });
  }
};


// =====================================================
// OBTENER TODOS LOS PEDIDOS
// SOLO ADMIN
// =====================================================

export const getOrders = async (req, res) => {
  try {

    const pedidos =
      await Order
        .find()
        .sort({
          createdAt: -1,
        });


    return res.json(
      pedidos
    );


  } catch (error) {

    console.error(
      "Error obteniendo pedidos:",
      error
    );

    return res.status(500).json({
      message:
        "Error al obtener los pedidos",
    });
  }
};


// =====================================================
// OBTENER MIS PEDIDOS
// SOLO USUARIOS CON CUENTA
// =====================================================

export const getMyOrders = async (req, res) => {
  try {

    if (!req.usuario) {
      return res.status(401).json({
        message:
          "Usuario no autenticado",
      });
    }


    if (!req.usuario.email) {
      return res.status(400).json({
        message:
          "El token no contiene un email de usuario",
      });
    }


    const emailUsuario =
      req.usuario.email
        .trim()
        .toLowerCase();


    const pedidos =
      await Order
        .find({
          "cliente.email":
            emailUsuario,
        })
        .sort({
          createdAt: -1,
        });


    return res.json(
      pedidos
    );


  } catch (error) {

    console.error(
      "Error obteniendo pedidos del usuario:",
      error
    );

    return res.status(500).json({
      message:
        "Error al obtener tus pedidos",
    });
  }
};


// =====================================================
// OBTENER PEDIDO POR ID
// =====================================================

export const getOrderById = async (req, res) => {
  try {

    const { id } =
      req.params;


    // -------------------------------------------------
    // VALIDAR ID
    // -------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message:
          "ID de pedido inválido",
      });
    }


    // -------------------------------------------------
    // BUSCAR
    // -------------------------------------------------

    const pedido =
      await Order.findById(id);


    if (!pedido) {
      return res.status(404).json({
        message:
          "Pedido no encontrado",
      });
    }


    // -------------------------------------------------
    // USUARIO
    // -------------------------------------------------

    if (!req.usuario) {
      return res.status(401).json({
        message:
          "Usuario no autenticado",
      });
    }


    // -------------------------------------------------
    // ADMIN
    // -------------------------------------------------

    if (
      req.usuario.rol === "admin"
    ) {
      return res.json(
        pedido
      );
    }


    // -------------------------------------------------
    // USUARIO NORMAL
    // -------------------------------------------------

    if (!req.usuario.email) {
      return res.status(403).json({
        message:
          "No tienes permiso para ver este pedido",
      });
    }


    const emailUsuario =
      req.usuario.email
        .trim()
        .toLowerCase();


    const emailPedido =
      pedido.cliente.email
        .trim()
        .toLowerCase();


    if (
      emailUsuario !== emailPedido
    ) {
      return res.status(403).json({
        message:
          "No tienes permiso para ver este pedido",
      });
    }


    return res.json(
      pedido
    );


  } catch (error) {

    console.error(
      "Error obteniendo pedido:",
      error
    );

    return res.status(500).json({
      message:
        "Error al obtener el pedido",
    });
  }
};


// =====================================================
// CONFIRMAR PAGO MANUAL
// SOLO ADMIN
// =====================================================

export const confirmPayment = async (req, res) => {
  try {

    const {
      codigoTransaccion,
    } = req.body;


    const pedido =
      await Order.findById(
        req.params.id
      );


    if (!pedido) {
      return res.status(404).json({
        message:
          "Pedido no encontrado",
      });
    }


    // -------------------------------------------------
    // YA PAGADO
    // -------------------------------------------------

    if (
      pedido.estado === "pagado"
    ) {
      return res.status(400).json({
        message:
          "Este pedido ya fue pagado",
      });
    }


    // -------------------------------------------------
    // CANCELADO
    // -------------------------------------------------

    if (
      pedido.estado === "cancelado"
    ) {
      return res.status(400).json({
        message:
          "No se puede pagar un pedido cancelado",
      });
    }


    // -------------------------------------------------
    // DESCONTAR STOCK
    // -------------------------------------------------

    for (
      const item of pedido.items
    ) {

      const producto =
        await Product.findById(
          item.producto
        );


      if (!producto) {
        return res.status(404).json({
          message:
            `Producto no encontrado: ${item.nombre}`,
        });
      }


      if (
        producto.stock <
        item.cantidad
      ) {
        return res.status(400).json({
          message:
            `Stock insuficiente para ${producto.nombre}`,
        });
      }
    }


    // -------------------------------------------------
    // SEGUNDA PASADA
    // -------------------------------------------------
    // Recién después de comprobar TODO
    // modificamos el stock.

    for (
      const item of pedido.items
    ) {

      const producto =
        await Product.findById(
          item.producto
        );


      producto.stock -=
        item.cantidad;


      await producto.save();
    }


    // -------------------------------------------------
    // MARCAR PAGADO
    // -------------------------------------------------

    pedido.estado =
      "pagado";


    pedido.codigoTransaccion =
      limpiarTexto(
        codigoTransaccion || ""
      );


    await pedido.save();


    return res.json(
      pedido
    );


  } catch (error) {

    console.error(
      "Error confirmando pago:",
      error
    );

    return res.status(500).json({
      message:
        "Error al confirmar el pago",
    });
  }
};


// =====================================================
// CANCELAR PEDIDO
// SOLO ADMIN
// =====================================================

export const cancelOrder = async (req, res) => {
  try {

    const pedido =
      await Order.findById(
        req.params.id
      );


    if (!pedido) {
      return res.status(404).json({
        message:
          "Pedido no encontrado",
      });
    }


    if (
      pedido.estado === "pagado"
    ) {
      return res.status(400).json({
        message:
          "No se puede cancelar un pedido ya pagado",
      });
    }


    if (
      pedido.estado === "cancelado"
    ) {
      return res.status(400).json({
        message:
          "Este pedido ya está cancelado",
      });
    }


    pedido.estado =
      "cancelado";


    await pedido.save();


    return res.json(
      pedido
    );


  } catch (error) {

    console.error(
      "Error cancelando pedido:",
      error
    );

    return res.status(500).json({
      message:
        "Error al cancelar el pedido",
    });
  }
};