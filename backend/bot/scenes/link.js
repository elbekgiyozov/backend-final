/**
 * bot/scenes/link.js — Telegram akkauntini sayt akkaunti bilan bog'lash wizard'i.
 *
 * SCENE / WIZARD nima?
 * Oddiy handler'lar "bir xabar → bir javob" tarzida ishlaydi va suhbatni ESLAB QOLMAYDI.
 * Wizard esa ko'p bosqichli suhbat yuritadi: bot savol beradi, javobni kutadi,
 * keyingi savolga o'tadi. Foydalanuvchi qaysi bosqichda ekani sessiyada saqlanadi.
 *
 * WizardScene("nom", qadam1, qadam2, qadam3) — qadamlar ketma-ketligi.
 *   ctx.wizard.next()      — keyingi qadamga o'tish
 *   ctx.wizard.state       — qadamlar orasida ma'lumot saqlash joyi
 *   ctx.scene.leave()      — wizard'dan chiqish
 *
 * Bu wizard 3 qadamdan iborat: savol → email → parol.
 */
import { Scenes } from "telegraf";
import User from "../../models/User.js";
import BotUser from "../../models/BotUser.js";
import { mainMenu } from "../keyboards.js";

export const linkScene = new Scenes.WizardScene(
  "link", // scene nomi — ctx.scene.enter("link") shu nom bilan chaqiradi

  /* --------------------------- 1-qadam: emailni so'rash ------------------ */
  (ctx) => {
    ctx.reply("Sayt akkauntingiz emailini yuboring (bekor qilish — /cancel):");
    return ctx.wizard.next(); // endi keyingi xabar 2-qadamga tushadi
  },

  /* -------------------- 2-qadam: emailni tekshirib, parolni so'rash ------ */
  (ctx) => {
    // ?. (optional chaining) — foydalanuvchi matn o'rniga rasm yuborsa,
    // ctx.message.text undefined bo'ladi va dastur yiqilmaydi
    const email = ctx.message?.text?.trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      ctx.reply("Email formati noto'g'ri. Qaytadan kiriting yoki /cancel:");
      // next() CHAQIRILMAYDI — shu qadamda qolamiz va qayta urinishga imkon beramiz
      return;
    }

    // Keyingi qadamda kerak bo'ladi — wizard.state ga saqlaymiz
    ctx.wizard.state.email = email;
    ctx.reply("Endi parolni yuboring (xabar darhol o'chiriladi):");
    return ctx.wizard.next();
  },

  /* ------------------ 3-qadam: parolni tekshirib, bog'lash --------------- */
  async (ctx) => {
    const password = ctx.message?.text;
    if (!password) {
      ctx.reply("Parolni matn ko'rinishida yuboring yoki /cancel:");
      return;
    }

    // XAVFSIZLIK: parol chat tarixida qolib ketmasligi uchun xabarni o'chiramiz.
    // .catch — bot xabarni o'chira olmasa ham (huquq yo'q bo'lsa) davom etamiz.
    await ctx.deleteMessage().catch(() => {});

    // Parol modelda select: false — shuning uchun uni ataylab so'raymiz
    const user = await User.findOne({ email: ctx.wizard.state.email }).select("+password");

    // Email va parolni ALOHIDA tekshirmaymiz — bitta umumiy xabar beramiz,
    // aks holda bot orqali qaysi emaillar mavjudligini aniqlash mumkin bo'lardi
    if (!user || !(await user.matchPassword(password))) {
      await ctx.reply("Email yoki parol noto'g'ri. Qaytadan urinish: /link");
      return ctx.scene.leave();
    }

    // Bitta sayt akkaunti bir nechta Telegram profiliga bog'lanmasligi kerak.
    // $ne — "not equal": o'zimizdan boshqa kimdir bog'lab qo'yganmi?
    const taken = await BotUser.findOne({ user: user._id, telegramId: { $ne: ctx.from.id } });
    if (taken) {
      await ctx.reply("Bu akkaunt boshqa Telegram profiliga bog'langan.");
      return ctx.scene.leave();
    }

    // Bog'lash — BotUser.user maydoniga sayt foydalanuvchisining ID sini yozamiz
    await BotUser.updateOne({ telegramId: ctx.from.id }, { $set: { user: user._id } });

    await ctx.reply(
      `Akkaunt bog'landi: *${user.name}* (${user.email})`,
      // Bu yerda Markdown ishlatilgan (*qalin*), HTML emas
      { parse_mode: "Markdown", ...mainMenu(user.role === "admin" || ctx.state.isAdmin) }
    );

    return ctx.scene.leave(); // wizard tugadi
  }
);

/**
 * /cancel — wizard'ning ISTALGAN qadamida ishlaydi.
 * Scene'ga bog'langan handler'lar global handler'lardan ustun turadi.
 */
linkScene.command("cancel", async (ctx) => {
  await ctx.reply("Bekor qilindi.", mainMenu(ctx.state.isAdmin));
  return ctx.scene.leave();
});
