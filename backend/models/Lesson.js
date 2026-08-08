/**
 * models/Lesson.js — dars modeli.
 *
 * Bog'lanish (relation): har bir dars bitta foydalanuvchiga tegishli.
 * MongoDB'da bog'lanish ObjectId (boshqa hujjatning ID si) orqali saqlanadi —
 * bu SQL'dagi FOREIGN KEY ga o'xshaydi.
 */
import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Dars nomi majburiy"], trim: true },

    // default: "" — tavsif kiritilmasa bo'sh satr yoziladi (undefined emas)
    description: { type: String, default: "" },

    // enum — faqat ro'yxatdagi qiymatlar qabul qilinadi, boshqasi validatsiya xatosi beradi
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    // Darsni kim yaratgani. ref: "User" — Mongoose'ga qaysi modeldan
    // ma'lumot olishni aytadi. Shu tufayli .populate("createdBy") chaqirilganda
    // bu maydon ID o'rniga to'liq User obyektiga almashadi.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true } // createdAt / updatedAt avtomatik
);

export default mongoose.model("Lesson", lessonSchema);
