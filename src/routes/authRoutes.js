import { Router } from "express";
import { registerAdmin, login } from "../controllers/authController.js";

const router = Router();

router.post("/register", registerAdmin);
router.post("/login", login);

export default router;