import { Router } from "express";

import {
  getCombos,
  getAllCombosAdmin,
  createCombo,
  updateCombo,
  deleteCombo,
  activateCombo,
} from "../controllers/comboController.js";

import {
  protegerRuta,
  soloAdmin,
} from "../middleware/auth.js";

const router = Router();


// Tienda
router.get("/", getCombos);


// Administración
router.get(
  "/admin/all",
  protegerRuta,
  soloAdmin,
  getAllCombosAdmin
);

router.post(
  "/",
  protegerRuta,
  soloAdmin,
  createCombo
);

router.put(
  "/:id",
  protegerRuta,
  soloAdmin,
  updateCombo
);

router.delete(
  "/:id",
  protegerRuta,
  soloAdmin,
  deleteCombo
);

router.patch(
  "/:id/activate",
  protegerRuta,
  soloAdmin,
  activateCombo
);

export default router;