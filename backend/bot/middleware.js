/**
 * bot/middleware.js — bot uchun oraliq qatlamlar.
 *
 * Telegraf'da middleware xuddi Express'dagidek ishlaydi: har bir update
 * (xabar, tugma bosilishi va h.k.) shu funksiyalardan ketma-ket o'tadi.
 *
 * ctx (context) — bitta update haqidagi hamma narsa:
 *   ctx.from     — kim yubordi (Telegram foydalanuvchisi)
 *   ctx.message  — xabar matni va h.k.
 *   ctx.reply()  — javob yuborish
 *   ctx.state    — o'zimiz qo'yadigan ma'lumotlar (middleware'lar orasida uzatiladi)
 */
import BotUser from "../models/BotUser.js";

/**
 * .env dagi doimiy adminlar ro'yxati.
 * Format: BOT_ADMIN_IDS=12345678,87654321
 * Bularni bot ichidan olib tashlab bo'lmaydi — "asosiy egasi" himoyasi.
 */
export const envAdminIds = () =>
  (process.env.BOT_ADMIN_IDS || "")
    .split(",") // "111,222" → ["111", "222"]
    .map((s) => parseInt(s.trim(), 10)) // satrlarni songa
    .filter(Boolean); // bo'sh/NaN qiymatlarni tashlab yuborish

/**
 * Admin ekanini aniqlash — UCHTA yo'ldan biri yetarli:
 *   1. BotUser.isAdmin = true (admin panel orqali berilgan)
 *   2. Bog'langan sayt akkauntida role = "admin"
 *   3. Telegram ID .env dagi BOT_ADMIN_IDS ro'yxatida
 *
 * Diqqat: 2-shart ishlashi uchun `user` maydoni populate qilingan bo'lishi kerak.
 */
export const isAdmin = (botUser) =>
  Boolean(botUser?.isAdmin) ||
  botUser?.user?.role === "admin" ||
  envAdminIds().includes(botUser?.telegramId);

/**
 * attachBotUser — HAR BIR update'da foydalanuvchini bazaga yozadi/yangilaydi
 * va uni ctx.state ga qo'yadi.
 *
 * Shu tufayli:
 *   - hech kimni "ro'yxatga olish" kerak emas, /start bosgan odam avtomatik bazada
 *   - /broadcast kimlarga yuborishni biladi
 *   - handler'larda ctx.state.botUser va ctx.state.isAdmin tayyor turadi
 */
export const attachBotUser = async (ctx, next) => {
  const from = ctx.from;
  // Ba'zi update'larda `from` bo'lmaydi (kanal postlari) — ularni o'tkazib yuboramiz
  if (!from || from.is_bot) return next();

  // findOneAndUpdate + upsert — "topsang yangila, topmasang yarat".
  // Bu ikki alohida so'rov (find, keyin create) o'rniga bitta atomar amal.
  const botUser = await BotUser.findOneAndUpdate(
    { telegramId: from.id }, // qidiruv sharti
    {
      // $set — har safar yangilanadigan maydonlar (ism/username o'zgargan bo'lishi mumkin)
      $set: {
        username: from.username || "",
        firstName: from.first_name || "",
        lastName: from.last_name || "",
        isBlocked: false, // yozayotgan ekan, demak bloklamagan
        lastSeenAt: new Date(),
      },
      // $setOnInsert — FAQAT yangi yaratilganda qo'llaniladi.
      // Aks holda admin panel orqali berilgan isAdmin har safar o'chib ketardi.
      $setOnInsert: { isAdmin: envAdminIds().includes(from.id) },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
    // upsert: yo'q bo'lsa yarat | new: yangilangan holatni qaytar | setDefaultsOnInsert: schema default'larini qo'lla
  ).populate("user", "name email role"); // sayt akkaunti bo'lsa — birga olib kelamiz

  ctx.state.botUser = botUser;
  ctx.state.isAdmin = isAdmin(botUser);

  return next(); // keyingi middleware/handler'ga o'tish
};

/**
 * adminOnly — admin buyruqlarini himoyalash uchun.
 * Ishlatilishi: bot.command("stats", adminOnly, handler)
 */
export const adminOnly = async (ctx, next) => {
  if (!ctx.state.isAdmin) {
    const msg = "⛔️ Bu buyruq faqat adminlar uchun.";
    // Agar inline tugma bosilgan bo'lsa — qalqib chiquvchi ogohlantirish ko'rsatamiz.
    // answerCbQuery chaqirilmasa, tugmada aylanma yuklanish belgisi qotib qoladi.
    if (ctx.callbackQuery) return ctx.answerCbQuery(msg, { show_alert: true });
    return ctx.reply(msg);
  }
  return next();
};
