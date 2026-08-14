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

// Publica: el cliente crea su pedido al comprar 
router.post("/", createOrder);

// Cliente con sesion : sus propios pedidos
router.get("/mine", protegerRuta, getMyOrders);

// Admin
router.get("/", protegerRuta, soloAdmin, getOrders);
router.get("/:id", protegerRuta, getOrderById);
router.patch("/:id/confirm-payment", protegerRuta, soloAdmin, confirmPayment);
router.patch("/:id/cancel", protegerRuta, cancelOrder);

export default router;