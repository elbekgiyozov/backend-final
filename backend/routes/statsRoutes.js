/**
 * routes/statsRoutes.js — admin dashboard statistikasi.
 * server.js: app.use("/api/stats", statsRoutes)
 */
import express from "express";
import { getStats } from "../controllers/statsController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// GET /api/stats — faqat admin roli uchun
router.get("/", protect, adminOnly, getStats);

export default router;
