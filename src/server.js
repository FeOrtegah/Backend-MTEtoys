import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import { cancelExpiredOrders } from "./jobs/cancelExpiredOrders.js";

const PORT = process.env.PORT || 3000;

const iniciarServidor = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Servidor ejecutándose en el puerto ${PORT}`
      );
    });

    // Revisar pedidos pendientes cada 10 minutos
    setInterval(
      cancelExpiredOrders,
      10 * 60 * 1000
    );

    // Ejecutar una revisión al iniciar
    cancelExpiredOrders();

  } catch (error) {
    console.error(
      "Error iniciando servidor:",
      error
    );

    process.exit(1);
  }
};

iniciarServidor();