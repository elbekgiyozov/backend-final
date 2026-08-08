/**
 * utils/generateToken.js — JWT token yasovchi yordamchi funksiya.
 *
 * Token 3 qismdan iborat (nuqta bilan ajratilgan): header.payload.signature
 *   - payload — bizning ma'lumot, bu yerda { id: "..." }
 *   - signature — JWT_SECRET bilan yasalgan imzo
 *
 * DIQQAT: payload SHIFRLANMAYDI, faqat base64 bilan kodlanadi — uni istalgan
 * odam o'qiy oladi. Shuning uchun tokenga parol kabi maxfiy ma'lumot yozilmaydi.
 * Imzo esa tokenni O'ZGARTIRIB bo'lmasligini kafolatlaydi.
 */
import jwt from "jsonwebtoken";

export const generateToken = (id) =>
  jwt.sign(
    { id }, // payload — foydalanuvchi ID si
    process.env.JWT_SECRET, // maxfiy kalit (.env da, hech qachon commit qilinmaydi)
    {
      // Amal qilish muddati: masalan "7d" (7 kun), "1h" (1 soat).
      expiresIn: process.env.JWT_EXPIRE || "7d",
    }
  );
