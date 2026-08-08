import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  confirmPayment,
  cancelOrder,
} from "../controllers/orderController.js";
import { protegerRuta, soloAdmin } from "../middleware/auth.js";

const router = Router();

// Crear pedido debe ser público (lo hace el cliente al comprar)
router.post("/", createOrder);

// Ver pedidos y confirmar pago son cosas de admin
router.get("/", protegerRuta, soloAdmin, getOrders);
router.get("/:id", protegerRuta, soloAdmin, getOrderById);
router.patch("/:id/confirm-payment", protegerRuta, soloAdmin, confirmPayment);
router.patch("/:id/cancel", protegerRuta, soloAdmin, cancelOrder);

export default router;