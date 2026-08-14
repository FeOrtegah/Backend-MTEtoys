import { Router } from "express";
import {
  initTransaction,
  confirmTransaction,
  getTransactionStatus,
} from "../controllers/webpayController.js";

const router = Router();

router.post("/init", initTransaction);

// Transbank redirige aquí con POST tras el pago; dejamos GET también por si acaso.
router.post("/confirm", confirmTransaction);
router.get("/confirm", confirmTransaction);

router.get("/status/:token", getTransactionStatus);

export default router;