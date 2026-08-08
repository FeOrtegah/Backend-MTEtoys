import { Router } from "express";
import upload from "../middleware/upload.js";
import { uploadImages } from "../controllers/uploadController.js";
import { protegerRuta, soloAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/", protegerRuta, soloAdmin, upload.array("imagenes", 6), uploadImages);

export default router;