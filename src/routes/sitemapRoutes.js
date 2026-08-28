import { Router } from "express";
import { getSitemap } from "../controllers/sitemapController.js";

const router = Router();

// Pública, sin auth: la consume Googlebot / Search Console
router.get("/", getSitemap);

export default router;