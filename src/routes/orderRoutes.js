import { Router } from "express";
import {
  getProducts,
  getAllProductsAdmin,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  hardDeleteProduct,
  decreaseStock,
  bulkCreateProducts,
} from "../controllers/productController.js";
import { protegerRuta, soloAdmin } from "../middleware/auth.js";

const router = Router();

// Públicas
router.get("/", getProducts);
router.get("/admin/all", protegerRuta, soloAdmin, getAllProductsAdmin);
router.get("/:id", getProductById);

// Admin
router.post("/", protegerRuta, soloAdmin, createProduct);
router.post("/bulk", protegerRuta, soloAdmin, bulkCreateProducts);
router.put("/:id", protegerRuta, soloAdmin, updateProduct);
router.delete("/:id", protegerRuta, soloAdmin, deleteProduct);
router.delete("/:id/permanent", protegerRuta, soloAdmin, hardDeleteProduct);
router.patch("/:id/decrease-stock", protegerRuta, soloAdmin, decreaseStock);

export default router;