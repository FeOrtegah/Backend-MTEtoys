import { webpayTransaction } from "../config/webpay.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Inicia la transacción: el frontend ya creó el pedido (estado "pendiente")
// y nos manda su id. Devolvemos la url y token de Webpay para redirigir al cliente.
export const initTransaction = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "Falta orderId" });

    const pedido = await Order.findById(orderId);
    if (!pedido) return res.status(404).json({ message: "Pedido no encontrado" });

    if (pedido.estado !== "pendiente") {
      return res.status(400).json({ message: "Este pedido ya fue procesado" });
    }

    const buyOrder = pedido._id.toString(); // ObjectId (24 chars) cabe en el límite de 26 de Transbank
    const sessionId = pedido._id.toString();
    const amount = Math.round(pedido.total);
    const returnUrl = `${process.env.BACKEND_URL}/api/webpay/confirm`;

    const response = await webpayTransaction.create(buyOrder, sessionId, amount, returnUrl);

    res.json({ url: response.url, token: response.token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Transbank redirige aquí (POST) después de que el cliente paga, cancela o expira.
export const confirmTransaction = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL;
  const params = { ...req.query, ...req.body };

  const token = params.token_ws;
  const tokenAbortado = params.TBK_TOKEN;
  const ordenCompraAbortada = params.TBK_ORDEN_COMPRA;

  // El cliente canceló el pago o se le acabó el tiempo (10 min) en Webpay
  if (!token && tokenAbortado) {
    if (ordenCompraAbortada) {
      await Order.findByIdAndUpdate(ordenCompraAbortada, { estado: "cancelado" }).catch(() => {});
    }
    return res.redirect(`${frontendUrl}/pago-resultado?estado=cancelado`);
  }

  if (!token) {
    return res.redirect(`${frontendUrl}/pago-resultado?estado=error`);
  }

  try {
    const response = await webpayTransaction.commit(token);
    const pedido = await Order.findById(response.buy_order);

    if (!pedido) {
      return res.redirect(`${frontendUrl}/pago-resultado?estado=error`);
    }

    const pagoAprobado = response.status === "AUTHORIZED" && response.response_code === 0;

    if (pagoAprobado) {
      for (const item of pedido.items) {
        const producto = await Product.findById(item.producto);
        if (producto) {
          producto.stock -= item.cantidad;
          await producto.save();
        }
      }

      pedido.estado = "pagado";
      pedido.codigoTransaccion = response.authorization_code || token;
      await pedido.save();

      return res.redirect(`${frontendUrl}/pago-resultado?estado=exito&pedido=${pedido._id}`);
    }

    pedido.estado = "cancelado";
    await pedido.save();

    return res.redirect(`${frontendUrl}/pago-resultado?estado=rechazado&pedido=${pedido._id}`);
  } catch (error) {
    return res.redirect(`${frontendUrl}/pago-resultado?estado=error`);
  }
};

// Utilidad opcional para consultar el estado de una transacción por token
export const getTransactionStatus = async (req, res) => {
  try {
    const response = await webpayTransaction.status(req.params.token);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};