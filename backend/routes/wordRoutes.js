/**
 * routes/wordRoutes.js — so'zlar manzillari.
 * server.js: app.use("/api/words", wordRoutes)
 *
 * Tuzilishi lessonRoutes bilan bir xil — yangi resurs qo'shmoqchi bo'lsangiz
 * shu shablonni nusxalab, model/controller nomini almashtirish kifoya.
 */
import express from "express";
import {
  getWords,
  getWord,
  createWord,
  updateWord,
  deleteWord,
} from "../controllers/wordController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET  /api/words        — ro'yxat (?lesson=<id> bilan filtrlash mumkin)
// POST /api/words        — yaratish (token kerak)
router.route("/").get(getWords).post(protect, createWord);

// GET/PUT/DELETE /api/words/:id — bitta so'z bilan ishlash
router
  .route("/:id")
  .get(getWord)
  .put(protect, updateWord)
  .delete(protect, deleteWord);

export default router;
