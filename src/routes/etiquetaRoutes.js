import { Router } from "express";
import {
  getEtiquetas,
  createEtiqueta,
  updateEtiqueta,
  deleteEtiqueta,
} from "../controllers/etiquetaController.js";
import { protegerRuta, soloAdmin } from "../middleware/auth.js";

const router = Router();

// Pública: el frontend calcula cuál está vigente hoy
router.get("/", getEtiquetas);

// Admin: crear, editar, eliminar
router.post("/", protegerRuta, soloAdmin, createEtiqueta);
router.put("/:id", protegerRuta, soloAdmin, updateEtiqueta);
router.delete("/:id", protegerRuta, soloAdmin, deleteEtiqueta);

export default router;
