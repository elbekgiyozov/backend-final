/**
 * models/BotUser.js — Telegram bot foydalanuvchisi.
 *
 * NEGA alohida model kerak?
 * Botga yozgan har bir odam saytda ro'yxatdan o'tgan bo'lishi shart emas.
 * Shuning uchun Telegram foydalanuvchilarini alohida saqlaymiz, keyin
 * xohlasa /link buyrug'i orqali o'z sayt akkaunti (User) bilan bog'laydi.
 *
 * Bu model quyidagilar uchun ishlatiladi:
 *   - /broadcast — kimlarga xabar yuborishni bilish
 *   - /users, /stats — admin statistikasi
 *   - adminlarni belgilash (isAdmin)
 */
import mongoose from "mongoose";

const botUserSchema = new mongoose.Schema(
  {
    // Telegram beradigan takrorlanmas raqamli ID (chat ID sifatida ham ishlatiladi).
    // index: true — shu maydon bo'yicha qidiruvni tezlashtiradi (har update'da qidiramiz).
    telegramId: { type: Number, required: true, unique: true, index: true },

    username: { type: String, default: "" }, // @username (bo'lmasligi ham mumkin)
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },

    // Sayt akkauntiga havola. null — hali bog'lanmagan.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Bot admini (admin panel orqali yoki .env BOT_ADMIN_IDS orqali beriladi)
    isAdmin: { type: Boolean, default: false },

    // Foydalanuvchi botni bloklasa, Telegram 403 xatosi qaytaradi —
    // shunda bu bayroq true bo'ladi va keyingi broadcast'da o'tkazib yuboriladi.
    isBlocked: { type: Boolean, default: false },

    lastSeenAt: { type: Date, default: Date.now }, // oxirgi faollik vaqti
  },
  { timestamps: true }
);

export default mongoose.model("BotUser", botUserSchema);
