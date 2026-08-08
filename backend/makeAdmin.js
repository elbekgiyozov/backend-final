/**
 * makeAdmin.js — Telegram foydalanuvchisiga admin huquqini berish.
 *
 * Ishlatilishi (avval botga /start bergan bo'lish shart):
 *   npm run make-admin -- 123456789     # Telegram ID bo'yicha
 *   npm run make-admin -- @username     # username bo'yicha
 *   npm run make-admin                  # argumentsiz — bot foydalanuvchilari ro'yxati
 *
 * Telegram ID ni bilish uchun botga /info yuboring.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import BotUser from "./models/BotUser.js";

// process.argv — komanda qatori argumentlari.
// [0] node yo'li, [1] skript yo'li, [2] dan boshlab bizning argumentlar.
const input = process.argv[2];

const run = async () => {
  await connectDB();

  // Argument berilmasa — mavjud foydalanuvchilarni ko'rsatamiz va chiqamiz
  if (!input) {
    const users = await BotUser.find().sort({ createdAt: -1 }).limit(20);
    if (!users.length) {
      console.log("Bot foydalanuvchilari yo'q. Avval @backccbot ga /start yuboring.");
    } else {
      console.log("Bot foydalanuvchilari:\n");
      for (const u of users) {
        const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
        const tag = u.username ? `@${u.username}` : "—";
        console.log(`  ${u.telegramId}\t${name}\t${tag}\t${u.isAdmin ? "admin" : ""}`);
      }
      console.log("\nAdmin qilish: npm run make-admin -- <ID>");
    }
    await mongoose.connection.close();
    return;
  }

  // Raqam bo'lsa telegramId, aks holda username bo'yicha qidiramiz
  const query = /^\d+$/.test(input)
    ? { telegramId: Number(input) }
    : { username: input.replace(/^@/, "") };

  const user = await BotUser.findOne(query);
  if (!user) {
    console.error(`"${input}" topilmadi. Avval botga /start yuborilganini tekshiring.`);
    await mongoose.connection.close();
    process.exit(1);
  }

  user.isAdmin = true;
  await user.save();

  console.log(`${user.firstName || user.username || user.telegramId} endi admin.`);
  console.log("   Botda /admin buyrug'ini sinab ko'ring (serverni qayta ishga tushirish shart emas).");

  await mongoose.connection.close();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
