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
    producto.precioOferta >= 0
  ) {
    return producto.precioOferta;
  }

  return producto.precio;
};


// =====================================================
// CREAR PEDIDO
// =====================================================
// Público.
// Permite comprar con o sin cuenta.

export const createOrder = async (req, res) => {
  try {
    const { cliente, items } = req.body;


    // -------------------------------------------------
    // VALIDAR CLIENTE
    // -------------------------------------------------

    if (!cliente) {
      return res.status(400).json({
        message: "Faltan los datos del cliente",
      });
    }


    if (
      !cliente.nombre ||
      !cliente.email ||
      !cliente.telefono ||
      !cliente.direccion
    ) {
      return res.status(400).json({
        message: "Faltan datos obligatorios del cliente",
      });
    }


    // -------------------------------------------------
    // LIMPIAR DATOS
    // -------------------------------------------------

    const nombre = cliente.nombre.trim();
    const email = cliente.email.trim().toLowerCase();
    const telefono = cliente.telefono.trim();
    const direccion = cliente.direccion.trim();


    if (!nombre || !email || !telefono || !direccion) {
      return res.status(400).json({
        message: "Los datos del cliente no pueden estar vacíos",
      });
    }


    // -------------------------------------------------
    // VALIDAR EMAIL
    // -------------------------------------------------

    const emailValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValido.test(email)) {
      return res.status(400).json({
        message: "El correo electrónico no es válido",
      });
    }


    // -------------------------------------------------
    // VALIDAR ITEMS
    // -------------------------------------------------

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "El pedido debe contener al menos un producto",
      });
    }


    // -------------------------------------------------
    // CONSTRUIR ITEMS DEL PEDIDO
    // -------------------------------------------------

    const itemsPedido = [];
    let total = 0;


    for (const item of items) {

      if (!item.producto) {
        return res.status(400).json({
          message: "Falta el ID de un producto",
        });
      }


      const cantidad = Number(item.cantidad);


      if (
        !Number.isInteger(cantidad) ||
        cantidad <= 0
      ) {
        return res.status(400).json({
          message:
            "La cantidad de los productos debe ser un número entero mayor a 0",
        });
      }


      // -------------------------------------------------
      // VALIDAR ID DEL PRODUCTO
      // -------------------------------------------------

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


      // -------------------------------------------------
      // BUSCAR PRODUCTO
      // -------------------------------------------------

      const producto =
        await Product.findById(item.producto);


      if (!producto) {
        return res.status(404).json({
          message:
            `Producto no encontrado: ${item.producto}`,
        });
      }


      // -------------------------------------------------
      // PRODUCTO ACTIVO
      // -------------------------------------------------

      if (!producto.activo) {
        return res.status(400).json({
          message:
            `El producto "${producto.nombre}" ya no está disponible`,
        });
      }


      // -------------------------------------------------
      // STOCK
      // -------------------------------------------------

      if (producto.stock < cantidad) {
        return res.status(400).json({
          message:
            `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
        });
      }


      // -------------------------------------------------
      // PRECIO REAL
      // -------------------------------------------------

      const precioUnitario =
        getPrecioVenta(producto);


      const subtotal =
        precioUnitario * cantidad;


      total += subtotal;


      // -------------------------------------------------
      // GUARDAR ITEM
      // -------------------------------------------------

      itemsPedido.push({
        producto: producto._id,
        nombre: producto.nombre,
        cantidad,
        precioUnitario,
      });
    }


    // -------------------------------------------------
    // VALIDAR TOTAL
    // -------------------------------------------------

    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      return res.status(400).json({
        message: "El total del pedido no es válido",
      });
    }


    // -------------------------------------------------
    // CREAR PEDIDO
    // -------------------------------------------------

    const pedido = new Order({
      cliente: {
        nombre,
        email,
        telefono,
        direccion,
      },

      items: itemsPedido,

      total: Math.round(total),

      estado: "pendiente",

      metodoPago: "webpay",
    });


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
      message: "Error al crear el pedido",
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


    return res.json(pedidos);


  } catch (error) {

    console.error(
      "Error obteniendo pedidos:",
      error
    );

    return res.status(500).json({
      message: "Error al obtener los pedidos",
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
        message: "Usuario no autenticado",
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
          "cliente.email": emailUsuario,
        })
        .sort({
          createdAt: -1,
        });


    return res.json(pedidos);


  } catch (error) {

    console.error(
      "Error obteniendo pedidos del usuario:",
      error
    );

    return res.status(500).json({
      message: "Error al obtener tus pedidos",
    });
  }
};


// =====================================================
// OBTENER PEDIDO POR ID
// =====================================================
// Admin:
//   Puede ver cualquier pedido.
//
// Usuario:
//   Solo puede ver pedidos de su propio email.
//
// Invitado:
//   No puede acceder a esta ruta porque requiere JWT.

export const getOrderById = async (req, res) => {
  try {

    const { id } = req.params;


    // -------------------------------------------------
    // VALIDAR ID
    // -------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message: "ID de pedido inválido",
      });
    }


    // -------------------------------------------------
    // BUSCAR PEDIDO
    // -------------------------------------------------

    const pedido =
      await Order.findById(id);


    if (!pedido) {
      return res.status(404).json({
        message: "Pedido no encontrado",
      });
    }


    // -------------------------------------------------
    // VERIFICAR USUARIO
    // -------------------------------------------------

    if (!req.usuario) {
      return res.status(401).json({
        message: "Usuario no autenticado",
      });
    }


    // -------------------------------------------------
    // ADMIN
    // -------------------------------------------------

    if (
      req.usuario.rol === "admin"
    ) {
      return res.json(pedido);
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


    return res.json(pedido);


  } catch (error) {

    console.error(
      "Error obteniendo pedido:",
      error
    );

    return res.status(500).json({
      message: "Error al obtener el pedido",
    });
  }
};


// =====================================================
// CONFIRMAR PAGO MANUAL
// SOLO ADMIN
// =====================================================

export const confirmPayment = async (req, res) => {
  try {

    const { codigoTransaccion } =
      req.body;


    const pedido =
      await Order.findById(
        req.params.id
      );


    if (!pedido) {
      return res.status(404).json({
        message: "Pedido no encontrado",
      });
    }


    if (
      pedido.estado === "pagado"
    ) {
      return res.status(400).json({
        message:
          "Este pedido ya fue pagado",
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


      producto.stock -=
        item.cantidad;


      await producto.save();
    }


    // -------------------------------------------------
    // MARCAR COMO PAGADO
    // -------------------------------------------------

    pedido.estado =
      "pagado";


    pedido.codigoTransaccion =
      codigoTransaccion || "";


    await pedido.save();


    return res.json(pedido);


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
        message: "Pedido no encontrado",
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


    return res.json(pedido);


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