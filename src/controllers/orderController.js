import Order from "../models/Order.js";
import Product from "../models/Product.js";

export const createOrder = async (req, res) => {
  try {
    const { cliente, items } = req.body;
    let total = 0;

    for (const item of items) {
      const producto = await Product.findById(item.producto);
      if (!producto) return res.status(404).json({ message: `Producto no encontrado: ${item.producto}` });
      if (producto.stock < item.cantidad) {
        return res.status(400).json({
          message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
        });
      }
      total += producto.precio * item.cantidad;
      item.nombre = producto.nombre;
      item.precioUnitario = producto.precio;
    }

    const pedido = new Order({ cliente, items, total, estado: "pendiente" });
    const nuevoPedido = await pedido.save();
    res.status(201).json(nuevoPedido);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const pedidos = await Order.find().sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const pedido = await Order.findById(req.params.id);
    if (!pedido) return res.status(404).json({ message: "Pedido no encontrado" });
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { codigoTransaccion } = req.body;
    const pedido = await Order.findById(req.params.id);
    if (!pedido) return res.status(404).json({ message: "Pedido no encontrado" });
    if (pedido.estado === "pagado") return res.status(400).json({ message: "Este pedido ya fue pagado" });

    for (const item of pedido.items) {
      const producto = await Product.findById(item.producto);
      if (producto) {
        producto.stock -= item.cantidad;
        await producto.save();
      }
    }

    pedido.estado = "pagado";
    pedido.codigoTransaccion = codigoTransaccion || "";
    await pedido.save();
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const pedido = await Order.findByIdAndUpdate(req.params.id, { estado: "cancelado" }, { new: true });
    if (!pedido) return res.status(404).json({ message: "Pedido no encontrado" });
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};