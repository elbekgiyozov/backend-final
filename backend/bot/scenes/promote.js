/**
 * bot/scenes/promote.js — yangi admin qo'shish wizard'i.
 *
 * TZ ning "bir nechta admin foydalanuvchilarni boshqarish" talabini bajaradi.
 * Admin panel → Adminlar → Admin qo'shish orqali chaqiriladi.
 *
 * MUHIM cheklov: odam avval botga /start bergan bo'lishi kerak.
 * Sabab — Telegram botlarga o'zi yozmagan odamga xabar yuborishga ruxsat bermaydi,
 * shuning uchun u bazada (BotUser) bo'lmasa, uni admin qilishning ma'nosi yo'q.
 */
import { Scenes } from "telegraf";
import BotUser from "../../models/BotUser.js";
import { adminsKeyboard, mainMenu } from "../keyboards.js";

export const promoteScene = new Scenes.WizardScene(
  "promote",

  /* ---------------------- 1-qadam: ID yoki username so'rash -------------- */
  (ctx) => {
    ctx.reply(
      "Yangi adminning Telegram ID raqamini yoki @username'ini yuboring (/cancel — bekor).\n" +
        "Eslatma: foydalanuvchi avval botga /start bergan bo'lishi kerak."
    );
    return ctx.wizard.next();
  },

  /* --------------------------- 2-qadam: admin qilish --------------------- */
  async (ctx) => {
    const input = ctx.message?.text?.trim();
    if (!input) {
      ctx.reply("ID yoki @username yuboring:");
      return;
    }

    // Kiritilgan qiymat raqammi yoki username'mi — shunga qarab qidiruv sharti tuziladi.
    // /^\d+$/ — boshidan oxirigacha faqat raqamlardan iborat bo'lsa.
    const query = /^\d+$/.test(input)
      ? { telegramId: Number(input) }
      : { username: input.replace(/^@/, "") }; // bazada @ belgisisiz saqlanadi

    const target = await BotUser.findOne(query);
    if (!target) {
      await ctx.reply("Bunday foydalanuvchi topilmadi (botga /start berganmi?).");
      return ctx.scene.leave();
    }

    target.isAdmin = true;
    await target.save();

    // Yangilangan adminlar ro'yxatini darhol ko'rsatamiz
    const admins = await BotUser.find({ isAdmin: true });
    await ctx.reply(
      `${target.firstName || target.username || target.telegramId} admin qilindi.`,
      adminsKeyboard(admins)
    );
    return ctx.scene.leave();
  }
);

promoteScene.command("cancel", async (ctx) => {
  await ctx.reply("Bekor qilindi.", mainMenu(ctx.state.isAdmin));
  return ctx.scene.leave();
});
