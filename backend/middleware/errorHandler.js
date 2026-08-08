/**
 * middleware/errorHandler.js — xatoliklarni bir joyda ushlash.
 *
 * Ikkalasi ham server.js da ENG OXIRIDA ulanadi, chunki Express
 * middleware'larni yozilish tartibida ishga tushiradi: agar yuqoridagi
 * route'lardan birortasi javob qaytarmasa, navbat shularga keladi.
 */

/**
 * notFound — mavjud bo'lmagan manzilga so'rov kelganda (404).
 * Masalan: GET /api/foo — bunday route yo'q.
 */
export const notFound = (req, res, next) => {
  res.status(404).json({ message: `Topilmadi: ${req.originalUrl}` });
};

/**
 * errorHandler — kutilmagan xatoliklarni ushlaydi.
 *
 * MUHIM: Express bu funksiyani "xatolik ushlovchi" deb tanishi uchun u aynan
 * 4 ta argumentga ega bo'lishi kerak (err, req, res, next) — `next` ishlatilmasa ham.
 */
export const errorHandler = (err, req, res, next) => {
  // Agar oldinroq status o'rnatilgan bo'lsa (masalan 400) — o'shani saqlaymiz,
  // aks holda 500 (Internal Server Error).
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  console.error("", err.message);

  res.status(status).json({
    message: err.message || "Server xatosi",
    // Stack trace (xatolik izi) faqat development'da yuboriladi —
    // produksiyada uni ko'rsatish xavfsizlik nuqtai nazaridan noto'g'ri,
    // chunki kod tuzilishi haqida ma'lumot oshkor bo'ladi.
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
