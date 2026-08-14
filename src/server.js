import app from "./app.js";
import connectDB from "./config/db.js";
import { cancelExpiredOrders } from "./jobs/cancelExpiredOrders.js";

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  });

  // Revisa cada 10 minutos si hay pedidos pendientes vencidos (más de 30 min sin pagar)
  setInterval(cancelExpiredOrders, 10 * 60 * 1000);
  cancelExpiredOrders(); // corre una vez también al arrancar
});