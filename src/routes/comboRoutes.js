import { Router } from "express";
import {
  getCombos,
  getAllCombosAdmin,
  createCombo,
  updateCombo,
  deleteCombo,
} from "../controllers/comboController.js";
import { protegerRuta, soloAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getCombos);
router.get("/admin/all", protegerRuta, soloAdmin, getAllCombosAdmin);
router.post("/", protegerRuta, soloAdmin, createCombo);
router.put("/:id", protegerRuta, soloAdmin, updateCombo);
router.delete("/:id", protegerRuta, soloAdmin, deleteCombo);

export default router;