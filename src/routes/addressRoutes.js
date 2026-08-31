import { Router } from "express";
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import { protegerRuta } from "../middleware/auth.js";

const router = Router();

router.use(protegerRuta);

router.get("/", getMyAddresses);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

export default router;