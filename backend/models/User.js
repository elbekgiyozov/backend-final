/**
 * models/User.js — foydalanuvchi modeli.
 *
 * MODEL nima? Bazadagi bitta "jadval" (MongoDB'da — collection) ning tuzilishi.
 * Schema orqali qaysi maydonlar bo'lishi, ular qanday turda bo'lishi va
 * qanday tekshirilishi (validatsiya) belgilanadi.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // parolni shifrlash (hash) kutubxonasi

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Ism majburiy"], // bo'sh bo'lsa — shu xabar bilan xatolik
      trim: true, // boshi/oxiridagi bo'shliqlarni olib tashlaydi
    },
    email: {
      type: String,
      required: [true, "Email majburiy"],
      unique: true, // bazada takrorlanmasligi uchun indeks yaratadi
      lowercase: true, // "Ali@Mail.com" → "ali@mail.com"
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email formati noto'g'ri"], // regex bilan tekshiruv
    },
    password: {
      type: String,
      required: [true, "Parol majburiy"],
      minlength: [6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"],
      // select: false — oddiy so'rovlarda parol QAYTARILMAYDI.
      // Kerak bo'lganda ataylab so'raymiz: User.findOne(...).select("+password")
      select: false,
    },
    // Rol — ruxsatlarni ajratish uchun. enum faqat shu ikki qiymatga ruxsat beradi.
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  // timestamps: true — Mongoose avtomatik createdAt va updatedAt maydonlarini qo'shadi
  { timestamps: true }
);

/**
 * pre("save") — HOOK (ilgak): hujjat bazaga saqlanishidan OLDIN ishlaydi.
 * Bu yerda parolni hash qilamiz, ya'ni bazada ochiq parol hech qachon saqlanmaydi.
 *
 * Diqqat: `function` ishlatilgan, arrow function EMAS — chunki `this` orqali
 * saqlanayotgan hujjatga murojaat qilishimiz kerak.
 */
userSchema.pre("save", async function (next) {
  // Agar parol o'zgarmagan bo'lsa (masalan faqat ism yangilandi) — qayta hash qilmaymiz,
  // aks holda allaqachon hash qilingan parol yana hash bo'lib, login buziladi.
  if (!this.isModified("password")) return next();

  // salt — hash'ni takrorlanmas qiladigan tasodifiy qo'shimcha.
  // 10 — murakkablik darajasi (qancha katta bo'lsa, shuncha sekin va xavfsiz).
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next(); // keyingi bosqichga o'tish (saqlash)
});

/**
 * Schema metodi — har bir User hujjatida chaqirsa bo'ladi: user.matchPassword("123456")
 * bcrypt.compare kiritilgan ochiq parolni bazadagi hash bilan solishtiradi.
 * Hash'ni "teskari ochib" bo'lmaydi, faqat shu yo'l bilan tekshiriladi.
 */
userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

// mongoose.model("User", ...) — "users" nomli collection bilan bog'langan model yaratadi
// (Mongoose nomni avtomatik kichik harf + ko'plikka aylantiradi).
export default mongoose.model("User", userSchema);
