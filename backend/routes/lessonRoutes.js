/**
 * routes/lessonRoutes.js — darslar manzillari.
 * server.js: app.use("/api/lessons", lessonRoutes)
 *
 * router.route("/") — bitta manzilga bir nechta HTTP metodini zanjir
 * ko'rinishida bog'lash usuli. Quyidagi ikki yozuv bir xil ma'noda:
 *   router.get("/", getLessons); router.post("/", protect, createLesson);
 *   router.route("/").get(getLessons).post(protect, createLesson);
 */
import express from "express";
import {
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
} from "../controllers/lessonController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET  /api/lessons  — ro'yxat (ochiq)
// POST /api/lessons  — yaratish (token kerak, shuning uchun `protect` oldinda)
router.route("/").get(getLessons).post(protect, createLesson);

// ":id" — dinamik qism, controller ichida req.params.id orqali olinadi.
// GET    /api/lessons/:id — bitta dars (ochiq)
// PUT    /api/lessons/:id — yangilash (token + egalik tekshiruvi controllerda)
// DELETE /api/lessons/:id — o'chirish (token + egalik tekshiruvi controllerda)
router
  .route("/:id")
  .get(getLesson)
  .put(protect, updateLesson)
  .delete(protect, deleteLesson);

export default router;
