/**
 * models/Word.js — so'z modeli.
 *
 * Ierarxiya: User → Lesson → Word.
 * Ya'ni har bir so'z bitta darsga tegishli va uni kimdir yaratgan.
 */
import mongoose from "mongoose";

const wordSchema = new mongoose.Schema(
  {
    term: { type: String, required: [true, "So'z majburiy"], trim: true }, // masalan "apple"
    translation: {
      type: String,
      required: [true, "Tarjima majburiy"],
      trim: true,
    }, // masalan "olma"

    example: { type: String, default: "" }, // ixtiyoriy misol gap

    // Qaysi darsga tegishli (ref orqali Lesson bilan bog'langan)
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: [true, "Dars (lesson) majburiy"],
    },

    // Egasi — CRUD ruxsatini tekshirishda ishlatiladi (faqat egasi yoki admin o'zgartira oladi)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Word", wordSchema);
