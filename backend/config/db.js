/**
 * config/db.js — MongoDB bazasiga ulanish.
 *
 * Mongoose — MongoDB uchun ODM (Object Document Mapper) kutubxonasi.
 * U bazadagi hujjatlar (document) bilan JS obyektlari kabi ishlash imkonini beradi
 * va schema orqali ma'lumot tuzilishini nazorat qiladi.
 */
import mongoose from "mongoose";

export const connectDB = async () => {
  // Ulanish manzili .env faylda saqlanadi (kodga yozilmaydi — bu maxfiy ma'lumot).
  // Lokal: mongodb://127.0.0.1:27017/tilim
  // Cloud: mongodb+srv://user:parol@cluster.mongodb.net/tilim
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI .env faylida ko'rsatilmagan");
    // process.exit(1) — dasturni xatolik kodi bilan to'xtatadi.
    // Bazasiz server ishlay olmaydi, shuning uchun darhol to'xtaymiz.
    process.exit(1);
  }

  try {
    // mongoose.connect — asinxron amal, ulanish tugashini kutamiz.
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB ulandi: ${conn.connection.host}`);
  } catch (err) {
    // Noto'g'ri parol, internet yo'qligi, IP whitelist'da yo'qligi va h.k.
    console.error(`❌ MongoDB ulanish xatosi: ${err.message}`);
    process.exit(1);
  }
};
