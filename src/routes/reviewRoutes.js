import { Router } from "express";
import {
  getReviewsByProduct,
  createReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { protegerRuta, soloAdmin } from "../middleware/auth.js";

const router = Router();

// Pública: leer reseñas de un producto/combo
router.get("/:tipo/:producto", getReviewsByProduct);

// Requiere sesión iniciada: crear reseña
router.post("/", protegerRuta, createReview);

// Solo admin: eliminar cualquier reseña
router.delete("/:id", protegerRuta, soloAdmin, deleteReview);

export default router;