/**
 * middleware/auth.js — autentifikatsiya (kim ekanligini aniqlash) va
 * avtorizatsiya (nimaga ruxsati borligini tekshirish).
 *
 * JWT QANDAY ISHLAYDI?
 *   1. Foydalanuvchi login qiladi → server unga imzolangan token beradi
 *   2. Frontend tokenni saqlaydi va har so'rovda header'da yuboradi:
 *        Authorization: Bearer <token>
 *   3. Server tokenni maxfiy kalit (JWT_SECRET) bilan tekshiradi
 *
 * Token ichida faqat foydalanuvchi ID si bor; server hech narsa "eslab qolmaydi"
 * (session yo'q) — shuning uchun bu usul stateless deb ataladi.
 */
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * protect — himoyalangan route'lar uchun.
 * Route'da shunday ishlatiladi: router.post("/", protect, createLesson)
 * Muvaffaqiyatli o'tsa — keyingi funksiyada req.user mavjud bo'ladi.
 */
export const protect = async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  // Header formati: "Bearer eyJhbGciOi..." — "Bearer " dan keyingi qismi token
  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  }

  if (!token) {
    // 401 Unauthorized — kim ekanligingiz noma'lum
    return res.status(401).json({ message: "Avtorizatsiya talab qilinadi (token yo'q)" });
  }

  try {
    // verify — imzoni va muddatni tekshiradi. Token o'zgartirilgan bo'lsa xatolik beradi.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tokendagi ID bo'yicha foydalanuvchini bazadan olamiz.
    // Sabab: token berilgandan keyin foydalanuvchi o'chirilgan yoki roli
    // o'zgargan bo'lishi mumkin — eng yangi holatni bazadan olish ishonchli.
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Foydalanuvchi topilmadi" });
    }

    // Keyingi middleware/controller'lar shu orqali "kim so'rov yuborayotganini" biladi
    req.user = user;
    next();
  } catch (err) {
    // Token yaroqsiz yoki muddati tugagan (JWT_EXPIRE)
    return res.status(401).json({ message: "Token yaroqsiz yoki muddati tugagan" });
  }
};

/**
 * adminOnly — protect'dan KEYIN ishlatiladi: router.get("/", protect, adminOnly, handler)
 * 403 Forbidden — kim ekanligingiz ma'lum, lekin bunga ruxsatingiz yo'q.
 */
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Ruxsat yo'q (admin talab qilinadi)" });
  }
  next();
};
