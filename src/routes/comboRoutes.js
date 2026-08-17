import { Router } from "express";

import {
  getCombos,
  getAllCombosAdmin,
  createCombo,
  updateCombo,
  deleteCombo,
  activateCombo,
  hardDeleteCombo,
} from "../controllers/comboController.js";

import {
  protegerRuta,
  soloAdmin,
} from "../middleware/auth.js";

const router = Router();

// ========================================
// TIENDA
// ========================================

router.get(
  "/",
  getCombos
);

// ========================================
// ADMINISTRACIÓN
// ========================================

// Obtener todos, activos e inactivos
router.get(
  "/admin/all",
  protegerRuta,
  soloAdmin,
  getAllCombosAdmin
);

// Crear
router.post(
  "/",
  protegerRuta,
  soloAdmin,
  createCombo
);

// Editar
router.put(
  "/:id",
  protegerRuta,
  soloAdmin,
  updateCombo
);

// Desactivar
router.delete(
  "/:id",
  protegerRuta,
  soloAdmin,
  deleteCombo
);

// Activar
router.patch(
  "/:id/activar",
  protegerRuta,
  soloAdmin,
  activateCombo
);

// Eliminar permanentemente
router.delete(
  "/:id/permanente",
  protegerRuta,
  soloAdmin,
  hardDeleteCombo
);

export default router;