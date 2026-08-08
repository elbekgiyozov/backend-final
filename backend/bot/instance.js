/**
 * bot/instance.js — Telegraf bot obyektini yaratadi.
 *
 * NEGA ALOHIDA FAYL?
 * Bu "circular import" (aylanma import) muammosini oldini oladi:
 *   bot/index.js → handlers → notify.js → bot kerak
 *   agar bot index.js da yaratilsa: notify.js → index.js → handlers → notify.js ... halqa
 * Bot alohida faylda bo'lsa, ikkala tomon ham shu yerdan oladi va halqa yo'q.
 */
import { Telegraf } from "telegraf";

// Token @BotFather dan olinadi va .env da saqlanadi.
// U parol bilan barobar: qo'lga tushsa, botni boshqa odam boshqara oladi.
const token = process.env.BOT_TOKEN;

// Token bo'lmasa bot yaratilmaydi (null). Shu tufayli botsiz ham
// backend'ni ishga tushirish mumkin — kod har joyda `if (!bot) return` bilan tekshiradi.
export const bot = token ? new Telegraf(token) : null;

if (!token) {
  console.warn(" BOT_TOKEN topilmadi — Telegram bot o'chirilgan holatda ishga tushdi");
}
