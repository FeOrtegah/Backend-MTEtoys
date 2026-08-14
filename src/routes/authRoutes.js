import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  register,
  registerAdmin,
  login,
  bootstrapAdmin,
  getMe,
  updateMe,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/authController.js";

import {
  protegerRuta,
  soloAdmin,
} from "../middleware/auth.js";


const router = Router();


// =====================================================
// RATE LIMIT LOGIN
// =====================================================

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 10,

  message: {
    message:
      "Demasiados intentos de login, intenta más tarde",
  },

  standardHeaders: true,
  legacyHeaders: false,
});


// =====================================================
// AUTENTICACIÓN
// =====================================================

router.post(
  "/register",
  register
);


router.post(
  "/login",
  loginLimiter,
  login
);


// =====================================================
// ADMIN
// =====================================================

router.post(
  "/register-admin",
  protegerRuta,
  soloAdmin,
  registerAdmin
);


router.post(
  "/bootstrap-admin",
  bootstrapAdmin
);


// =====================================================
// PERFIL
// =====================================================

router.get(
  "/me",
  protegerRuta,
  getMe
);


router.put(
  "/me",
  protegerRuta,
  updateMe
);


// =====================================================
// DIRECCIONES DEL USUARIO
// =====================================================

router.get(
  "/me/addresses",
  protegerRuta,
  getAddresses
);


router.post(
  "/me/addresses",
  protegerRuta,
  addAddress
);


router.put(
  "/me/addresses/:id",
  protegerRuta,
  updateAddress
);


router.delete(
  "/me/addresses/:id",
  protegerRuta,
  deleteAddress
);


router.patch(
  "/me/addresses/:id/default",
  protegerRuta,
  setDefaultAddress
);


export default router;