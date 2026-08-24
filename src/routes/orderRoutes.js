import { Router } from "express";

import {
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  confirmPayment,
  cancelOrder,
  markAsShipped,
  hardDeleteOrder,
  marcarAvisoWhatsapp,
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
// MARCAR AVISO DE TRANSFERENCIA POR WHATSAPP
// =====================================================
// Público: lo llama el cliente sin sesión, desde la
// página de transferencia bancaria.

router.patch(
  "/:id/aviso-whatsapp",
  marcarAvisoWhatsapp
);


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


// =====================================================
// MARCAR COMO ENVIADO
// SOLO ADMIN
// =====================================================

router.patch(
  "/:id/marcar-enviado",
  protegerRuta,
  soloAdmin,
  markAsShipped
);


// =====================================================
// ELIMINAR PEDIDO PERMANENTEMENTE
// SOLO ADMIN
// =====================================================

router.delete(
  "/:id",
  protegerRuta,
  soloAdmin,
  hardDeleteOrder
);

export default router;