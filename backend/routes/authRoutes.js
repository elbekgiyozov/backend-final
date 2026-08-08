/**
 * routes/authRoutes.js — autentifikatsiya manzillari.
 *
 * ROUTER — bu "mini Express ilovasi". Unga bog'langan manzillar
 * server.js dagi prefiks ostida ishlaydi:
 *   app.use("/api/auth", authRoutes)  →  "/login" aslida "/api/auth/login"
 *
 * Route fayllari faqat MANZIL ↔ CONTROLLER bog'lanishini ko'rsatadi,
 * biznes-logika esa controller ichida bo'ladi. Shu tufayli kod tartibli qoladi.
 */
import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Ochiq manzillar — token talab qilinmaydi
router.post("/register", register);
router.post("/login", login);

// Himoyalangan — avval `protect` ishlaydi, u tokenni tekshiradi va
// faqat muvaffaqiyatli bo'lsa `getMe` ga navbat beradi.
router.get("/me", protect, getMe);

export default router;
