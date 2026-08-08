/**
 * bot/handlers/admin.js — admin panel: statistika, foydalanuvchilar, adminlar boshqaruvi.
 *
 * Har bir admin handler `adminOnly` middleware bilan himoyalangan.
 * MUHIM: himoyani faqat tugmani yashirish bilan qilib bo'lmaydi — callback_data ni
 * qo'lda ham yuborish mumkin, shuning uchun HAR BIR action alohida tekshiriladi.
 */
import User from "../../models/User.js";
import Lesson from "../../models/Lesson.js";
import Word from "../../models/Word.js";
import BotUser from "../../models/BotUser.js";
import { adminOnly, envAdminIds, isAdmin } from "../middleware.js";
import { adminMenu, adminsKeyboard } from "../keyboards.js";
import { Markup } from "telegraf";

const PAGE_SIZE = 8; // bitta sahifada nechta foydalanuvchi

/**
 * Statistika matni — /stats buyrug'i va "📊 Statistika" tugmasi uchun.
 * Barcha hisoblar Promise.all bilan PARALLEL bajariladi: 7 ta so'rovni
 * ketma-ket kutish o'rniga, eng sekinigacha ketgan vaqt sarflanadi.
 */
const statsText = async () => {
  // Date.now() — millisekundlardagi hozirgi vaqt. 24 soat oldingi payt:
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [users, lessons, words, botUsers, linked, blocked, newUsers] = await Promise.all([
    User.countDocuments(),
    Lesson.countDocuments(),
    Word.countDocuments(),
    BotUser.countDocuments(),
    BotUser.countDocuments({ user: { $ne: null } }), // $ne — "not equal", ya'ni bog'langanlar
    BotUser.countDocuments({ isBlocked: true }),
    User.countDocuments({ createdAt: { $gte: dayAgo } }), // $gte — "greater than or equal"
  ]);

  return [
    "<b>📊 Umumiy statistika</b>",
    "",
    `👤 Sayt foydalanuvchilari: <b>${users}</b>`,
    `🆕 Oxirgi 24 soatda: <b>${newUsers}</b>`,
    `📚 Darslar: <b>${lessons}</b>`,
    `🔤 So'zlar: <b>${words}</b>`,
    "",
    `🤖 Bot foydalanuvchilari: <b>${botUsers}</b>`,
    `🔗 Akkaunti bog'langan: <b>${linked}</b>`,
    `🚫 Botni bloklaganlar: <b>${blocked}</b>`,
  ].join("\n");
};

/**
 * Foydalanuvchilar ro'yxatining bitta sahifasi (matn + navigatsiya tugmalari).
 */
const usersPage = async (page) => {
  const total = await BotUser.countDocuments();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const users = await BotUser.find()
    .populate("user", "name email role") // isAdmin tekshiruvi uchun role kerak
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE);

  const rows = users.map((u, i) => {
    // Umumiy tartib raqami: 2-sahifadagi 1-element aslida 9-chi
    const n = (safePage - 1) * PAGE_SIZE + i + 1;
    // filter(Boolean) — bo'sh qiymatlarni tashlaydi, keyin bo'shliq bilan qo'shadi
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
    const tag = u.username ? ` @${u.username}` : "";
    const link = u.user ? ` | 🔗 ${u.user.email}` : "";
    const flag = isAdmin(u) ? " 🛡" : "";
    return `${n}. <b>${name}</b>${tag}${flag}\n   <code>${u.telegramId}</code>${link}`;
  });

  const text = total
    ? `<b>👥 Foydalanuvchilar</b> (jami ${total} ta)\n\n${rows.join("\n")}`
    : "📭 Bot foydalanuvchilari yo'q.";

  // Navigatsiya tugmalari — faqat kerak bo'lganda qo'shiladi
  const nav = [];
  if (safePage > 1) nav.push(Markup.button.callback("⬅️", `admin:users:${safePage - 1}`));
  nav.push(Markup.button.callback(`${safePage}/${totalPages}`, "noop"));
  if (safePage < totalPages) nav.push(Markup.button.callback("➡️", `admin:users:${safePage + 1}`));

  return {
    text,
    keyboard: Markup.inlineKeyboard([nav, [Markup.button.callback("⬅️ Panel", "admin:panel")]]),
  };
};

export const registerAdminHandlers = (bot) => {
  /* ------------------------------ /admin panel --------------------------- */
  const panel = (ctx) =>
    ctx.replyWithHTML("<b>🛠 Admin panel</b>\nKerakli bo'limni tanlang:", adminMenu());

  // adminOnly middleware handler'dan OLDIN turadi — mos kelmasa, handler umuman ishlamaydi
  bot.command("admin", adminOnly, panel);
  bot.hears("🛠 Admin panel", adminOnly, panel);

  /* --------------------------- Matnli buyruqlar -------------------------- */
  bot.command("stats", adminOnly, async (ctx) => ctx.replyWithHTML(await statsText()));

  bot.command("users", adminOnly, async (ctx) => {
    const { text, keyboard } = await usersPage(1);
    await ctx.replyWithHTML(text, keyboard);
  });

  // Ommaviy xabar — wizard orqali (scenes/broadcast.js)
  bot.command("broadcast", adminOnly, (ctx) => ctx.scene.enter("broadcast"));

  /* -------------------------- Inline panel tugmalari --------------------- */

  // Panelga qaytish
  bot.action("admin:panel", adminOnly, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx
      .editMessageText("<b>🛠 Admin panel</b>\nKerakli bo'limni tanlang:", {
        parse_mode: "HTML",
        // ...adminMenu() — obyektni "yoyish" (spread): reply_markup maydonini
        // options obyektiga qo'shib yuboradi
        ...adminMenu(),
      })
      .catch(() => {});
  });

  // Statistika — yangi xabar yubormasdan, mavjud xabarni yangilaydi
  bot.action("admin:stats", adminOnly, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx
      .editMessageText(await statsText(), {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([[Markup.button.callback("⬅️ Panel", "admin:panel")]]),
      })
      .catch(() => {});
  });

  // Foydalanuvchilar ro'yxati + sahifalash ("admin:users:3" → ctx.match[1] = "3")
  bot.action(/^admin:users:(\d+)$/, adminOnly, async (ctx) => {
    await ctx.answerCbQuery();
    const { text, keyboard } = await usersPage(Number(ctx.match[1]));
    await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard }).catch(() => {});
  });

  /* --------------------------- Adminlar boshqaruvi ----------------------- */
  bot.action("admin:admins", adminOnly, async (ctx) => {
    await ctx.answerCbQuery();

    const admins = await BotUser.find({ isAdmin: true });
    const envIds = envAdminIds();

    const text =
      "<b>🛡 Adminlar</b>\n\n" +
      (admins.length
        ? admins.map((a) => `• ${a.firstName || a.username || a.telegramId} — <code>${a.telegramId}</code>`).join("\n")
        : "DB'da admin yo'q") +
      // .env dagilar alohida ko'rsatiladi — ular bot ichidan o'chirilmaydi
      (envIds.length ? `\n\n.env orqali doimiy adminlar: <code>${envIds.join(", ")}</code>` : "");

    await ctx.editMessageText(text, { parse_mode: "HTML", ...adminsKeyboard(admins) }).catch(() => {});
  });

  // Yangi admin qo'shish — wizard orqali (scenes/promote.js)
  bot.action("admin:promote", adminOnly, async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.scene.enter("promote");
  });

  // Adminlikdan olib tashlash
  bot.action(/^admin:demote:(\d+)$/, adminOnly, async (ctx) => {
    const targetId = Number(ctx.match[1]);

    // Himoya 1: .env dagi doimiy adminni bot ichidan olib tashlab bo'lmaydi
    if (envAdminIds().includes(targetId)) {
      return ctx.answerCbQuery(".env dagi adminni olib tashlab bo'lmaydi", { show_alert: true });
    }
    // Himoya 2: o'zini o'zi olib tashlab, panelsiz qolib ketmasligi uchun
    if (targetId === ctx.from.id) {
      return ctx.answerCbQuery("O'zingizni olib tashlay olmaysiz", { show_alert: true });
    }

    await BotUser.updateOne({ telegramId: targetId }, { $set: { isAdmin: false } });
    await ctx.answerCbQuery("Olib tashlandi");

    // Faqat tugmalarni yangilaymiz (matn o'zgarmagani uchun editMessageText shart emas).
    // .reply_markup — Telegraf obyektidan sof tugmalar tuzilishini olish.
    const admins = await BotUser.find({ isAdmin: true });
    await ctx.editMessageReplyMarkup(adminsKeyboard(admins).reply_markup).catch(() => {});
  });

  /* ------------------------------- Boshqalar ----------------------------- */
  bot.action("admin:broadcast", adminOnly, async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.scene.enter("broadcast");
  });

  // Panelni yopish — xabarni butunlay o'chiradi.
  // (Telegram 48 soatdan eski xabarlarni o'chirishga ruxsat bermaydi — shuning uchun .catch)
  bot.action("admin:close", adminOnly, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage().catch(() => {});
  });
};
