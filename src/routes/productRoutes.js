import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  decreaseStock,
  bulkCreateProducts,
} from "../controllers/productController.js";
import { protegerRuta } from "../middleware/auth.js";

const router = Router();

// Rutas públicas (el frontend de la tienda las necesita sin login)
router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/bulk", protegerRuta, bulkCreateProducts);

// Rutas protegidas (solo tú, como admin)
router.post("/", protegerRuta, createProduct);
router.put("/:id", protegerRuta, updateProduct);
router.delete("/:id", protegerRuta, deleteProduct);
router.patch("/:id/decrease-stock", protegerRuta, decreaseStock);

export default router;