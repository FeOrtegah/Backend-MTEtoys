import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  validarCupon,
  listarCupones,
  crearCupon,
  crearLote,
  actualizarCupon,
  eliminarCupon,
  usosDeCupon,
} from "../controllers/cuponController.js";

import { protegerRuta, soloAdmin } from "../middleware/auth.js";

const router = Router();

// =====================================================
// RATE LIMIT: evita que alguien pruebe miles de códigos
// =====================================================

const validarLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: {
    message: "Demasiados intentos, espera unos minutos e inténtalo de nuevo",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Público: lo usa el checkout (también para invitados)
router.post("/validar", validarLimiter, validarCupon);

// Admin
router.get("/", protegerRuta, soloAdmin, listarCupones);
router.post("/", protegerRuta, soloAdmin, crearCupon);
router.post("/lote", protegerRuta, soloAdmin, crearLote);
router.get("/:id/usos", protegerRuta, soloAdmin, usosDeCupon);
router.patch("/:id", protegerRuta, soloAdmin, actualizarCupon);
router.delete("/:id", protegerRuta, soloAdmin, eliminarCupon);

export default router;
