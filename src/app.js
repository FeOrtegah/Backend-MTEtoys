import express from "express";
import cors from "cors";

import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import comboRoutes from "./routes/comboRoutes.js";
import webpayRoutes from "./routes/webpayRoutes.js";

const app = express();

const allowedOrigins = [
  "https://mtetoys.cl",
  "https://www.mtetoys.cl",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir peticiones sin Origin
      // (por ejemplo Postman o algunas peticiones del servidor)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("No permitido por CORS")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "HEAD",
      "PUT",
      "PATCH",
      "POST",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);


// =====================================================
// RUTA PRINCIPAL
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "API MTE Toys funcionando",
  });
});


// =====================================================
// RUTAS
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/upload",
  uploadRoutes
);

app.use(
  "/api/combos",
  comboRoutes
);

app.use(
  "/api/webpay",
  webpayRoutes
);


// =====================================================
// MANEJO DE ERRORES
// =====================================================

app.use(
  (err, req, res, next) => {
    console.error(
      "Error del servidor:",
      err
    );

    if (
      err.message ===
      "No permitido por CORS"
    ) {
      return res.status(403).json({
        message: "Origen no permitido",
      });
    }

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
);


export default app;