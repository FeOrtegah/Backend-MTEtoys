import { Router } from "express";
import { register, registerAdmin, login } from "../controllers/authController.js";
import { protegerRuta, soloAdmin } from "../middleware/auth.js";

const router = Router();

// Pública: cualquier cliente puede crear su cuenta
router.post("/register", register);

// Login: sirve para admin y cliente
router.post("/login", login);

// Crear un admin nuevo — solo un admin ya logueado puede hacerlo
router.post("/register-admin", protegerRuta, soloAdmin, registerAdmin);

export default router;