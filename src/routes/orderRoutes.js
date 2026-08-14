import { Router } from "express";

import {
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  confirmPayment,
  cancelOrder,
} from "../controllers/orderController.js";

import {
  protegerRuta,
  soloAdmin,
} from "../middleware/auth.js";

const router = Router();


// =====================================================
// CREAR PEDIDO
// =====================================================
// Público para permitir compras como invitado.

router.post("/", createOrder);


// =====================================================
// PEDIDOS DEL USUARIO AUTENTICADO
// =====================================================

router.get(
  "/mine",
  protegerRuta,
  getMyOrders
);


// =====================================================
// TODOS LOS PEDIDOS
// SOLO ADMIN
// =====================================================

router.get(
  "/",
  protegerRuta,
  soloAdmin,
  getOrders
);


// =====================================================
// PEDIDO INDIVIDUAL
// =====================================================
// Usuario:
//   Solo puede ver sus propios pedidos.
//
// Admin:
//   Puede ver cualquier pedido.

router.get(
  "/:id",
  protegerRuta,
  getOrderById
);


// =====================================================
// CONFIRMAR PAGO MANUAL
// SOLO ADMIN
// =====================================================

router.patch(
  "/:id/confirm-payment",
  protegerRuta,
  soloAdmin,
  confirmPayment
);


// =====================================================
// CANCELAR PEDIDO
// SOLO ADMIN
// =====================================================

router.patch(
  "/:id/cancel",
  protegerRuta,
  soloAdmin,
  cancelOrder
);

export default router;