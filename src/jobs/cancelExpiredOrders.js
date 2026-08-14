import Order from "../models/Order.js";

const MINUTOS_EXPIRACION = 30;

export async function cancelExpiredOrders() {
  const limite = new Date(Date.now() - MINUTOS_EXPIRACION * 60 * 1000);

  try {
    const resultado = await Order.updateMany(
      { estado: "pendiente", createdAt: { $lt: limite } },
      { $set: { estado: "cancelado" } }
    );

    if (resultado.modifiedCount > 0) {
      console.log(`Pedidos vencidos cancelados: ${resultado.modifiedCount}`);
    }
  } catch (error) {
    console.error("Error cancelando pedidos vencidos:", error.message);
  }
}