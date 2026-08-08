/**
 * bot/scenes/broadcast.js — admin ommaviy xabar yuborish wizard'i.
 *
 * Oqim: matnni so'rash → oldindan ko'rsatish → tasdiqlash → yuborish.
 *
 * NEGA TASDIQLASH BOSQICHI BOR?
 * Broadcast — qaytarib bo'lmaydigan amal: yuborilgan xabarni minglab
 * odamdan qaytarib ololmaysiz. Shuning uchun oldin ko'rsatib, so'ng so'raymiz.
 */
import { Scenes } from "telegraf";
import { broadcast } from "../notify.js";
import { confirmKeyboard, mainMenu } from "../keyboards.js";

export const broadcastScene = new Scenes.WizardScene(
  "broadcast",

  /* ------------------------ 1-qadam: matnni so'rash ---------------------- */
  (ctx) => {
    ctx.reply("Yubormoqchi bo'lgan xabar matnini kiriting (/cancel — bekor):");
    return ctx.wizard.next();
  },

  /* ------------------- 2-qadam: ko'rsatish va tasdiq so'rash ------------- */
  (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text) {
      ctx.reply("Matn yuboring yoki /cancel:");
      return; // shu qadamda qolamiz
    }

    // Matnni saqlaymiz — tugma bosilganda kerak bo'ladi
    ctx.wizard.state.text = text;

    ctx.reply(
      `Xabar oldindan ko'rinishi:\n\n${text}\n\nYuborilsinmi?`,
      confirmKeyboard("bcast:yes", "bcast:no")
    );
    return ctx.wizard.next();
  },

  /* ----------------- 3-qadam: faqat tugma bosilishini kutish ------------- */
  (ctx) => {
    // Bu qadamda matnli xabar kutilmaydi — ish quyidagi action'larda bajariladi.
    // Foydalanuvchi baribir matn yozsa, eslatib qo'yamiz.
    if (ctx.message) ctx.reply("Tugmalardan birini tanlang yoki /cancel.");
  }
);

/**
 * "Ha, yuborish" tugmasi.
 * Scene ichida ro'yxatga olingan action — faqat shu wizard'dagi
 * foydalanuvchi uchun ishlaydi va ctx.wizard.state ga kirish imkoni bor.
 */
broadcastScene.action("bcast:yes", async (ctx) => {
  await ctx.answerCbQuery();

  // Tugmalarni olib tashlaymiz — ikki marta bosib, ikki marta yuborilmasin
  await ctx.editMessageReplyMarkup(undefined).catch(() => {});

  // Yuborish uzoq davom etishi mumkin (har xabar orasida 40 ms tanaffus),
  // shuning uchun avval "kutib turing" xabarini beramiz
  await ctx.reply("Yuborilmoqda...");

  const res = await broadcast(ctx.wizard.state.text);

  await ctx.reply(
    `Yuborildi: ${res.sent} ta\nYetib bormadi: ${res.failed} ta\nJami: ${res.total} ta`,
    mainMenu(ctx.state.isAdmin)
  );
  return ctx.scene.leave();
});

/** "Bekor" tugmasi */
broadcastScene.action("bcast:no", async (ctx) => {
  // answerCbQuery ga matn berilsa — ekran tepasida qisqa bildirishnoma chiqadi
  await ctx.answerCbQuery("Bekor qilindi");
  await ctx.editMessageReplyMarkup(undefined).catch(() => {});
  await ctx.reply("Bekor qilindi.", mainMenu(ctx.state.isAdmin));
  return ctx.scene.leave();
});

/** /cancel — istalgan qadamda chiqish */
broadcastScene.command("cancel", async (ctx) => {
  await ctx.reply("Bekor qilindi.", mainMenu(ctx.state.isAdmin));
  return ctx.scene.leave();
});
