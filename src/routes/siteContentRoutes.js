import { Router } from "express";
import {
  getContentBySection,
  createContent,
  updateContent,
  deleteContent,
} from "../controllers/siteContentController.js";
import { protegerRuta, soloAdmin } from "../middleware/auth.js";

const router = Router();

// Pública: cualquiera puede ver el contenido de una sección
router.get("/:seccion", getContentBySection);

// Admin: crear, editar, eliminar
router.post("/", protegerRuta, soloAdmin, createContent);
router.put("/:id", protegerRuta, soloAdmin, updateContent);
router.delete("/:id", protegerRuta, soloAdmin, deleteContent);

export default router;