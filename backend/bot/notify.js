/**
 * bot/notify.js — bot orqali xabar yuborish funksiyalari.
 *
 * Bu fayl "botdan tashqariga" xizmat qiladi: controller'lar (masalan
 * authController) shu funksiyalarni chaqirib, Telegram'ga xabar yuboradi.
 * Ya'ni bog'lanish ikki tomonlama:
 *   Telegram → bot handlers → baza
 *   HTTP API → controller → notify.js → Telegram
 */
import { bot } from "./instance.js";
import BotUser from "../models/BotUser.js";
import { envAdminIds, isAdmin } from "./middleware.js";

/**
 * Bitta chatga xabar yuborish — barcha quyidagi funksiyalar shundan foydalanadi.
 * Xatolikni "yutadi" (throw qilmaydi), chunki bitta odam botni bloklagani
 * uchun butun ro'yxatga yuborish to'xtab qolmasligi kerak.
 *
 * @returns true — yetkazildi, false — yetkazilmadi
 */
const send = async (telegramId, text, extra = {}) => {
  if (!bot) return false; // BOT_TOKEN yo'q — bot o'chirilgan

  try {
    await bot.telegram.sendMessage(telegramId, text, {
      // parse_mode: "HTML" — matndagi <b>, <i>, <code> teglari formatlanadi.
      // Shuning uchun xabar matnida < va > belgilarini ehtiyot bo'lib ishlating.
      parse_mode: "HTML",
      ...extra,
    });
    return true;
  } catch (err) {
    // 403 Forbidden — foydalanuvchi botni bloklagan yoki chatni o'chirgan.
    // Belgilab qo'yamiz, keyingi broadcast'da uni o'tkazib yuboramiz.
    if (err?.response?.error_code === 403) {
      await BotUser.updateOne({ telegramId }, { $set: { isBlocked: true } });
    }
    return false;
  }
};

// Boshqa modullar ham bitta chatga yuborishi mumkin bo'lsin
export const sendToTelegram = send;

/**
 * Barcha adminlarga xabar (yangi ro'yxatdan o'tish, yangi dars va h.k.).
 * Adminlar 3 xil manbadan yig'iladi, shuning uchun Set bilan takrorlanishni yo'qotamiz.
 */
export const notifyAdmins = async (text) => {
  if (!bot) return;

  const admins = await BotUser.find({ isBlocked: false }).populate("user", "role");
  // Set — takrorlanmas qiymatlar to'plami. Bir odam ham .env da, ham
  // isAdmin=true bo'lsa, xabarni ikki marta olmaydi.
  const ids = new Set([...envAdminIds(), ...admins.filter(isAdmin).map((a) => a.telegramId)]);

  for (const id of ids) await send(id, text);
};

/**
 * Sayt akkaunti bog'langan aniq bir foydalanuvchiga shaxsiy xabar.
 * @param userId — User modelidagi _id
 */
export const notifyUser = async (userId, text) => {
  const botUser = await BotUser.findOne({ user: userId, isBlocked: false });
  if (botUser) await send(botUser.telegramId, text);
};

/**
 * Ommaviy xabar — botga /start bergan hamma odamga.
 *
 * Nega for-loop va setTimeout? Telegram sekundiga ~30 ta xabar cheklovi qo'yadi.
 * Hammasini bir yo'la yuborsak (Promise.all) — 429 "Too Many Requests" xatosi keladi.
 * 40 ms tanaffus ≈ sekundiga 25 ta xabar, ya'ni xavfsiz tezlik.
 *
 * @returns { sent, failed, total } — admin ko'radigan hisobot
 */
export const broadcast = async (text) => {
  const users = await BotUser.find({ isBlocked: false }).select("telegramId");

  let sent = 0;
  let failed = 0;

  for (const u of users) {
    const ok = await send(u.telegramId, text);
    ok ? sent++ : failed++;
    // "uxlash" — Promise'ni belgilangan vaqtdan keyin bajarilgan deb e'lon qilamiz
    await new Promise((r) => setTimeout(r, 40));
  }

  return { sent, failed, total: users.length };
};
