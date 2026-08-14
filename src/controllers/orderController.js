import Order from "../models/Order.js";
import Product from "../models/Product.js";

/**
 * Obtiene el precio real de venta de un producto.
 *
 * Si el producto está en oferta y tiene un precio de oferta válido,
 * se utiliza ese precio.
 *
 * Si no, se utiliza el precio normal.
 */
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


/**
 * Crear pedido
 */
export const createOrder = async (req, res) => {
  try {
    const { cliente, items } = req.body;

    // -----------------------------
    // VALIDACIONES BÁSICAS
    // -----------------------------

    if (!cliente) {
      return res.status(400).json({
        message: "Faltan los datos del cliente",
      });
    }

    if (!cliente.nombre || !cliente.email || !cliente.telefono || !cliente.direccion) {
      return res.status(400).json({
        message: "Faltan datos obligatorios del cliente",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "El pedido debe contener al menos un producto",
      });
    }


    // -----------------------------
    // VALIDAR Y CONSTRUIR ITEMS
    // -----------------------------

    const itemsPedido = [];
    let total = 0;

    for (const item of items) {

      if (!item.producto) {
        return res.status(400).json({
          message: "Falta el ID de un producto",
        });
      }

      const cantidad = Number(item.cantidad);

      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        return res.status(400).json({
          message: "La cantidad de los productos debe ser un número entero mayor a 0",
        });
      }


      // Buscar producto directamente en MongoDB
      const producto = await Product.findById(item.producto);

      if (!producto) {
        return res.status(404).json({
          message: `Producto no encontrado: ${item.producto}`,
        });
      }


      // Producto desactivado
      if (!producto.activo) {
        return res.status(400).json({
          message: `El producto "${producto.nombre}" ya no está disponible`,
        });
      }


      // Stock
      if (producto.stock < cantidad) {
        return res.status(400).json({
          message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
        });
      }


      // Precio REAL determinado por el backend
      const precioUnitario = getPrecioVenta(producto);

      const subtotal = precioUnitario * cantidad;

      total += subtotal;


      // IMPORTANTE:
      // No usamos nombre ni precio enviados por React.
      // Usamos los datos actuales de MongoDB.
      itemsPedido.push({
        producto: producto._id,
        nombre: producto.nombre,
        cantidad,
        precioUnitario,
      });
    }


    // -----------------------------
    // CREAR PEDIDO
    // -----------------------------

    const pedido = new Order({
      cliente: {
        nombre: cliente.nombre.trim(),
        email: cliente.email.trim().toLowerCase(),
        telefono: cliente.telefono.trim(),
        direccion: cliente.direccion.trim(),
      },

      items: itemsPedido,

      total: Math.round(total),

      estado: "pendiente",

      metodoPago: "webpay",
    });


    const nuevoPedido = await pedido.save();


    return res.status(201).json(nuevoPedido);

  } catch (error) {

    console.error("Error creando pedido:", error);

    return res.status(500).json({
      message: "Error al crear el pedido",
      error: error.message,
    });
  }
};


/**
 * Obtener todos los pedidos
 * Solo administradores deberían acceder a esta función.
 */
export const getOrders = async (req, res) => {
  try {

    const pedidos = await Order
      .find()
      .sort({ createdAt: -1 });

    res.json(pedidos);

  } catch (error) {

    console.error("Error obteniendo pedidos:", error);

    res.status(500).json({
      message: "Error al obtener los pedidos",
    });
  }
};


/**
 * Obtener pedidos del usuario autenticado
 */
export const getMyOrders = async (req, res) => {
  try {

    const pedidos = await Order
      .find({
        "cliente.email": req.usuario.email,
      })
      .sort({
        createdAt: -1,
      });

    res.json(pedidos);

  } catch (error) {

    console.error("Error obteniendo pedidos del usuario:", error);

    res.status(500).json({
      message: "Error al obtener tus pedidos",
    });
  }
};


/**
 * Obtener pedido por ID
 */
export const getOrderById = async (req, res) => {
  try {

    const pedido = await Order.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido no encontrado",
      });
    }

    res.json(pedido);

  } catch (error) {

    console.error("Error obteniendo pedido:", error);

    res.status(500).json({
      message: "Error al obtener el pedido",
    });
  }
};


/**
 * Confirmar pago manualmente desde administración.
 *
 * Esta función la dejamos por ahora,
 * pero posteriormente vamos a hacer que Webpay
 * sea quien controle completamente esta parte.
 */
export const confirmPayment = async (req, res) => {
  try {

    const { codigoTransaccion } = req.body;

    const pedido = await Order.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido no encontrado",
      });
    }


    if (pedido.estado === "pagado") {
      return res.status(400).json({
        message: "Este pedido ya fue pagado",
      });
    }


    for (const item of pedido.items) {

      const producto = await Product.findById(item.producto);

      if (!producto) {
        continue;
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({
          message: `Stock insuficiente para ${producto.nombre}`,
        });
      }

      producto.stock -= item.cantidad;

      await producto.save();
    }


    pedido.estado = "pagado";

    pedido.codigoTransaccion =
      codigoTransaccion || "";


    await pedido.save();


    res.json(pedido);

  } catch (error) {

    console.error("Error confirmando pago:", error);

    res.status(500).json({
      message: "Error al confirmar el pago",
    });
  }
};


/**
 * Cancelar pedido
 */
export const cancelOrder = async (req, res) => {
  try {

    const pedido = await Order.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido no encontrado",
      });
    }


    if (pedido.estado === "pagado") {
      return res.status(400).json({
        message: "No se puede cancelar un pedido ya pagado",
      });
    }


    pedido.estado = "cancelado";

    await pedido.save();


    res.json(pedido);

  } catch (error) {

    console.error("Error cancelando pedido:", error);

    res.status(500).json({
      message: "Error al cancelar el pedido",
    });
  }
};