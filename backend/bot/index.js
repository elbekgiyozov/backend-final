/**
 * bot/index.js — Telegram botni yig'ish va ishga tushirish.
 *
 * Bu fayl bot qismining "server.js" i: barcha bo'laklarni to'g'ri tartibda ulaydi.
 *
 * BOT TELEGRAM'DAN XABARLARNI QANDAY OLADI? Ikki usul bor:
 *
 *  1) POLLING (lokal ishlash uchun) — bot o'zi Telegram serveriga muntazam
 *     murojaat qilib "menga yangi xabar bormi?" deb so'rab turadi.
 *     Kompyuteringizda internet bo'lsa yetarli, hech qanday domen kerak emas.
 *
 *  2) WEBHOOK (produksiya uchun) — teskarisi: Telegram O'ZI bizning serverga
 *     HTTP so'rov yuboradi. Tezroq va resurs tejaydi, lekin ochiq HTTPS
 *     domen talab qiladi (Render, Railway va h.k.).
 *
 * Kod .env dagi BOT_WEBHOOK_DOMAIN bor-yo'qligiga qarab o'zi tanlaydi.
 */
import { Scenes, session } from "telegraf";
import { bot } from "./instance.js";
import { attachBotUser } from "./middleware.js";
import { registerUserHandlers } from "./handlers/user.js";
import { registerAdminHandlers } from "./handlers/admin.js";
import { linkScene } from "./scenes/link.js";
import { broadcastScene } from "./scenes/broadcast.js";
import { promoteScene } from "./scenes/promote.js";
import { mainMenu } from "./keyboards.js";

/**
 * Telegram menyusidagi buyruqlar ro'yxati (chatdagi "/" tugmasi bosilganda chiqadi).
 * Bu shunchaki ko'rsatma — buyruqning o'zi handler'da ishlaydi.
 * Admin buyruqlari ham ro'yxatda turadi, lekin ularni adminOnly himoya qiladi.
 */
const commands = [
  { command: "start", description: "Botni ishga tushirish" },
  { command: "help", description: "Buyruqlar ro'yxati" },
  { command: "info", description: "Profilim" },
  { command: "lessons", description: "Darslar ro'yxati" },
  { command: "link", description: "Sayt akkauntini bog'lash" },
  { command: "admin", description: "Admin panel (adminlar uchun)" },
  { command: "stats", description: "Statistika (adminlar uchun)" },
  { command: "users", description: "Foydalanuvchilar (adminlar uchun)" },
  { command: "broadcast", description: "Ommaviy xabar (adminlar uchun)" },
];

/**
 * Handlerlarni botga ulaydi (launch qilmaydi).
 * Alohida eksport qilingan — shu tufayli testlarda botni haqiqiy
 * Telegram'ga ulanmasdan sinab ko'rish mumkin.
 *
 * TARTIB JUDA MUHIM: update yuqoridan pastga qarab o'tadi.
 */
export const buildBot = () => {
  // Stage — barcha wizard'larni (scene) boshqaruvchi
  const stage = new Scenes.Stage([linkScene, broadcastScene, promoteScene]);

  // 1) session — foydalanuvchi qaysi wizard'ning qaysi qadamida ekanini eslab qoladi.
  //    Diqqat: bu xotirada saqlanadi, server qayta ishga tushsa yo'qoladi
  //    (yarim qolgan wizard uziladi, boshqa ma'lumot yo'qolmaydi).
  bot.use(session());

  // 2) attachBotUser — foydalanuvchini bazaga yozadi, ctx.state ni to'ldiradi.
  //    Scene'lardan OLDIN turishi kerak, chunki wizard'lar ham ctx.state.isAdmin dan foydalanadi.
  bot.use(attachBotUser);

  // 3) stage — foydalanuvchi wizard ichida bo'lsa, xabarni o'sha wizard qayta ishlaydi
  bot.use(stage.middleware());

  // 4) Oddiy handler'lar (wizard'da bo'lmaganlar uchun)
  registerUserHandlers(bot);
  registerAdminHandlers(bot);

  // 5) Eng oxirgi "to'r" — yuqoridagilardan birortasi ushlamagan matnli xabar.
  //    Bu express.js dagi notFound middleware'ining bot versiyasi.
  bot.on("text", (ctx) => {
    if (ctx.message.text.startsWith("/")) {
      return ctx.reply("❓ Noma'lum buyruq. /help ni ko'ring.", mainMenu(ctx.state.isAdmin));
    }
    return ctx.reply("Pastdagi menyudan foydalaning yoki /help.", mainMenu(ctx.state.isAdmin));
  });

  // Global xatolik ushlovchi — bitta handler'dagi xato butun botni to'xtatmasligi uchun
  bot.catch((err, ctx) => {
    console.error(`❌ Bot xatosi (${ctx.updateType}):`, err.message);
  });
};

/**
 * Botni ishga tushiradi.
 * @param app — Express ilovasi (webhook rejimida bot unga o'z route'ini qo'shadi)
 */
export const startBot = async (app) => {
  // BOT_TOKEN yo'q bo'lsa bot null — backend botsiz ishlayveradi
  if (!bot) return null;

  buildBot();

  // Buyruqlar menyusini Telegram'ga yozib qo'yamiz.
  // .catch — internet yo'q bo'lsa ham server ko'tarilaversin.
  await bot.telegram.setMyCommands(commands).catch(() => {});

  const domain = process.env.BOT_WEBHOOK_DOMAIN;
  const path = process.env.BOT_WEBHOOK_PATH || "/api/telegram/webhook";

  if (domain) {
    /* ------------------------- WEBHOOK (produksiya) ---------------------- */
    // secret_token — Telegram har so'rovda shu maxfiy satrni header'da yuboradi.
    // Shu tufayli bizning webhook manzilimizga begona odam soxta so'rov yubora olmaydi.
    const secretToken = process.env.BOT_WEBHOOK_SECRET || undefined;

    // createWebhook: Telegram'da webhook'ni ro'yxatga oladi VA
    // express uchun tayyor middleware qaytaradi
    app.use(await bot.createWebhook({ domain, path, secret_token: secretToken }));
    console.log(`🤖 Telegram bot webhook rejimida: ${domain}${path}`);
  } else {
    /* --------------------------- POLLING (lokal) ------------------------- */
    // DIQQAT: bot.launch() ni `await` QILIB BO'LMAYDI — u polling to'xtaguncha
    // (ya'ni hech qachon) tugamaydi. Await qilinsa, server.js shu yerda qotib qoladi.
    bot.launch().catch((err) => console.error("❌ Bot launch xatosi:", err.message));
    console.log("🤖 Telegram bot polling rejimida ishga tushdi");
  }

  // Server to'xtatilganda (Ctrl+C yoki deploy platformasi to'xtatganda)
  // botni ham tartibli yopamiz — yarim qolgan so'rovlar to'g'ri yakunlansin.
  // process.once — hodisa faqat bir marta ishlaydi.
  process.once("SIGINT", () => bot.stop("SIGINT")); // Ctrl+C
  process.once("SIGTERM", () => bot.stop("SIGTERM")); // tizim to'xtatish signali

  return bot;
};
