/**
 * server.js — butun backend'ning KIRISH NUQTASI (entry point).
 *
 * Bu fayl ishga tushganda quyidagilar ketma-ket bajariladi:
 *   1. .env fayldagi sozlamalar o'qiladi
 *   2. MongoDB'ga ulanadi
 *   3. Express ilovasi (app) yaratiladi
 *   4. Middleware'lar (oraliq qatlamlar) ulanadi
 *   5. Route'lar (API manzillari) ulanadi
 *   6. Telegram bot ishga tushadi
 *   7. Server portni tinglay boshlaydi
 *
 * MUHIM: middleware va route'lar ULANISH TARTIBI ahamiyatli —
 * so'rov (request) yuqoridan pastga qarab qatlamlardan o'tadi.
 */

// "dotenv/config" — import qilinishi bilanoq .env faylni o'qib,
// qiymatlarni process.env ga yozadi. Eng birinchi turishi SHART, chunki
// quyidagi bot/instance.js import paytidayoq process.env.BOT_TOKEN ni o'qiydi.
import "dotenv/config";
import express from "express"; // web-server framework
import cors from "cors"; // brauzerdan boshqa domenga so'rov yuborishga ruxsat
import helmet from "helmet"; // xavfsizlik HTTP header'larini qo'shadi
import rateLimit from "express-rate-limit"; // bir IP dan kelayotgan so'rovlar sonini cheklaydi

import { connectDB } from "./config/db.js";
import { logger } from "./middleware/logger.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import wordRoutes from "./routes/wordRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import { startBot } from "./bot/index.js";

// Bazaga ulanmasdan turib serverni ko'tarishning ma'nosi yo'q —
// shuning uchun `await` bilan kutamiz (ESM'da top-level await ishlaydi).
await connectDB();

// Express ilovasi — barcha middleware va route'lar shunga "yopishtiriladi".
const app = express();

/* ---------------------------- 1. Middleware'lar --------------------------- */
// Middleware = har bir so'rov o'tadigan oraliq funksiya.
// Ular `next()` ni chaqirsa — so'rov keyingi qatlamga o'tadi.

app.use(helmet()); // himoya header'lari (X-Frame-Options, CSP va h.k.)

// CORS: qaysi frontend domeni bu API ga murojaat qila oladi.
// CLIENT_URL da bir nechta domenni vergul bilan sanash mumkin, masalan:
//   CLIENT_URL=https://tilim.netlify.app,http://localhost:5173
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, "")) // oxiridagi "/" ni olib tashlaymiz
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // origin bo'lmasa — bu brauzer emas (Postman, curl, server-to-server).
      // CLIENT_URL berilmagan bo'lsa — development rejimi, hammaga ruxsat.
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: ${origin} domeniga ruxsat yo'q`));
    },
  })
);

// So'rov tanasidagi (body) JSON'ni avtomatik obyektga aylantiradi → req.body
app.use(express.json());

app.use(logger); // har bir so'rovni konsolga yozadi

// Rate limiting (bonus) — 15 daqiqada bitta IP dan maksimum 300 ta so'rov.
// Bu brute-force va DoS urinishlariga qarshi oddiy himoya.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // vaqt oynasi: 15 daqiqa
    max: 300, // shu oynada ruxsat etilgan so'rovlar soni
    standardHeaders: true, // limit haqidagi ma'lumot RateLimit-* header'larida
    legacyHeaders: false, // eskirgan X-RateLimit-* header'lari o'chirilgan
    message: { message: "Juda ko'p so'rov yuborildi, birozdan keyin urinib ko'ring" },
    // Telegram webhook'i limitga tushmasligi kerak — Telegram bir vaqtning o'zida
    // ko'p update yuborishi mumkin, ular bloklansa bot ishlamay qoladi.
    skip: (req) => req.path === (process.env.BOT_WEBHOOK_PATH || "/api/telegram/webhook"),
  })
);

/* ------------------------------ 2. Route'lar ------------------------------ */

// Health check — server tirikligini tekshirish uchun (deploy platformalari shuni so'raydi).
app.get("/", (req, res) => res.json({ status: "ok", service: "tilim API" }));

// Har bir resurs o'z prefiksi ostida. Masalan authRoutes ichidagi "/login"
// tashqaridan "/api/auth/login" bo'lib ko'rinadi.
app.use("/api/auth", authRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/words", wordRoutes);
app.use("/api/stats", statsRoutes);

// Telegram bot — server bilan bitta processda (webhook rejimida bot o'z
// route'ini shu `app` ga qo'shadi, shuning uchun notFound'dan OLDIN turadi).
await startBot(app);

/* ------------------------- 3. Xatoliklar (eng oxirda) --------------------- */
// Yuqoridagi route'lardan birortasi mos kelmasa — 404 qaytaradi.
app.use(notFound);
// 4 ta argumentli middleware — Express uni "xatolik ushlovchi" deb tanidi.
app.use(errorHandler);

/* ----------------------------- 4. Serverni ishga tushirish ---------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT}-portda ishga tushdi`));
