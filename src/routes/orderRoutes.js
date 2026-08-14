import { Router } from "express";
import {
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  confirmPayment,
  cancelOrder,
} from "../controllers/orderController.js";
import { protegerRuta, soloAdmin } from "../middleware/auth.js";

const router = Router();

// 1. Rutas específicas primero
router.post("/", createOrder);
router.get("/mine", protegerRuta, getMyOrders);
router.get("/", protegerRuta, soloAdmin, getOrders);

// 2. Rutas dinámicas con :id al final para evitar conflictos
router.get("/:id", protegerRuta, getOrderById);
router.patch("/:id/confirm-payment", protegerRuta, soloAdmin, confirmPayment);
router.patch("/:id/cancel", protegerRuta, soloAdmin, cancelOrder); // Asegúrate de incluir protegerRuta y soloAdmin

export default router;