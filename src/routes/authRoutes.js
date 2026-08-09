import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, registerAdmin, login } from "../controllers/authController.js";
import { protegerRuta, soloAdmin } from "../middleware/auth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Demasiados intentos de login, intenta más tarde" },
});

// publica
router.post("/register", register);

// login admin y cliente
router.post("/login", loginLimiter, login);

// crar admin, solo admin puede 
router.post("/register-admin", protegerRuta, soloAdmin, registerAdmin);

export default router;