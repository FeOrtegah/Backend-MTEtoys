import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, registerAdmin, login, bootstrapAdmin } from "../controllers/authController.js";
import { protegerRuta, soloAdmin } from "../middleware/auth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Demasiados intentos de login, intenta más tarde" },
});

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/register-admin", protegerRuta, soloAdmin, registerAdmin);
router.post("/bootstrap-admin", bootstrapAdmin);

export default router;