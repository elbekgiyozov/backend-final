/**
 * middleware/logger.js — har bir so'rovni konsolga yozadi.
 *
 * Natija ko'rinishi:
 *   [2026-08-07T09:12:44.512Z] POST /api/auth/login → 200 (43ms)
 *
 * Bu debug qilishda juda qo'l keladi: qaysi so'rov kelgani, qanday javob
 * qaytgani va qancha vaqt ketgani ko'rinib turadi.
 */
export const logger = (req, res, next) => {
  const start = Date.now(); // so'rov boshlangan payt

  // res.on("finish") — javob to'liq yuborib bo'lingach ishlaydigan hodisa.
  // Aynan shu paytda statusCode allaqachon ma'lum bo'ladi.
  res.on("finish", () => {
    const ms = Date.now() - start; // qancha vaqt ketdi
    const time = new Date().toISOString();
    console.log(`[${time}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
  });

  // next() chaqirilmasa — so'rov shu yerda "osilib" qoladi va javob qaytmaydi
  next();
};
