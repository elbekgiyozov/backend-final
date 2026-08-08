/**
 * bot/handlers/user.js — oddiy foydalanuvchi uchun buyruqlar va tugmalar.
 *
 * HANDLER TURLARI (Telegraf):
 *   bot.start(fn)          — /start buyrug'i
 *   bot.help(fn)           — /help buyrug'i
 *   bot.command("x", fn)   — /x buyrug'i (massiv berilsa — bir nechta nom)
 *   bot.hears("matn", fn)  — aynan shu matnli xabar (reply keyboard tugmalari uchun)
 *   bot.action(/regex/, fn)— inline tugma bosilishi (callback_data bo'yicha)
 *
 * Handler'lar ro'yxatga olingan TARTIBDA tekshiriladi: qaysi biri birinchi
 * mos kelsa, o'sha ishlaydi.
 */
import Lesson from "../../models/Lesson.js";
import Word from "../../models/Word.js";
import { mainMenu, lessonsKeyboard, lessonKeyboard } from "../keyboards.js";

// Bitta sahifada nechta dars ko'rsatiladi
const PAGE_SIZE = 5;

/**
 * Yordam matni. Admin bo'lsa — qo'shimcha buyruqlar ham qo'shiladi,
 * shunda oddiy foydalanuvchi mavjud emas buyruqlarni ko'rmaydi.
 */
const helpText = (isAdmin) => {
  const base = [
    "<b>📋 Mavjud buyruqlar</b>",
    "",
    "/start — botni ishga tushirish",
    "/help — shu ro'yxat",
    "/info — o'z profilingiz",
    "/lessons (yoki /items) — darslar ro'yxati",
    "/link — sayt akkauntini bog'lash",
    "/unlink — bog'lanishni bekor qilish",
  ];

  if (isAdmin) {
    base.push(
      "",
      "<b>🛠 Admin buyruqlari</b>",
      "/admin — admin panel",
      "/stats — statistika",
      "/users — foydalanuvchilar ro'yxati",
      "/broadcast — ommaviy xabar"
    );
  }

  // Massivni qatorlarga birlashtiramiz ("\n" — yangi qator)
  return base.join("\n");
};

/**
 * Darslar sahifasini tayyorlaydi: matn + inline tugmalar.
 * Alohida funksiyaga chiqarilgan, chunki u ikki joyda kerak:
 * /lessons buyrug'ida (yangi xabar) va ⬅️➡️ tugmalarida (mavjud xabarni tahrirlash).
 */
const lessonsPage = async (page) => {
  const total = await Lesson.countDocuments();
  // Math.max(1, ...) — darslar umuman bo'lmasa ham totalPages 1 bo'lsin
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Sahifa raqamini chegaradan chiqib ketmasligi uchun "qisamiz"
  const safePage = Math.min(Math.max(1, page), totalPages);

  const lessons = await Lesson.find()
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * PAGE_SIZE) // oldingi sahifalarni o'tkazib yuborish
    .limit(PAGE_SIZE);

  const text = total
    ? `📚 <b>Darslar</b> (jami ${total} ta)\nKerakli darsni tanlang:`
    : "📭 Hozircha darslar yo'q.";

  return { text, keyboard: lessonsKeyboard(lessons, safePage, totalPages) };
};

/**
 * Barcha foydalanuvchi handler'larini botga ulaydi.
 * bot obyekti argument sifatida uzatiladi (import qilinmaydi) — shunda
 * bu fayl mustaqil bo'lib qoladi va testda ham oson ishlatiladi.
 */
export const registerUserHandlers = (bot) => {
  /* ------------------------------- /start -------------------------------- */
  bot.start(async (ctx) => {
    const name = ctx.from.first_name || "do'stim";
    // replyWithHTML — reply(text, { parse_mode: "HTML" }) ning qisqa shakli
    await ctx.replyWithHTML(
      `👋 Assalomu alaykum, <b>${name}</b>!\n\n` +
        "Bu — <b>Tilim</b> platformasining rasmiy boti. Bu yerda darslar va so'zlar bilan tanishishingiz, " +
        "sayt akkauntingizni bog'lab profilingizni ko'rishingiz mumkin.\n\n" +
        "Boshlash uchun pastdagi menyudan foydalaning yoki /help ni bosing.",
      // Uchinchi argument — pastdagi doimiy menyu (reply keyboard)
      mainMenu(ctx.state.isAdmin)
    );
  });

  /* -------------------------------- /help -------------------------------- */
  bot.help((ctx) => ctx.replyWithHTML(helpText(ctx.state.isAdmin), mainMenu(ctx.state.isAdmin)));
  // Xuddi shu ish reply keyboard tugmasi bosilganda ham bajarilsin
  bot.hears("ℹ️ Yordam", (ctx) => ctx.replyWithHTML(helpText(ctx.state.isAdmin)));

  /* -------------------------------- /info -------------------------------- */
  // Funksiyani o'zgaruvchiga olamiz, chunki u ham buyruq, ham tugma uchun kerak
  const info = async (ctx) => {
    // botUser'ni attachBotUser middleware'i oldindan bazadan olib qo'ygan
    const bu = ctx.state.botUser;

    const lines = [
      "<b>👤 Profil</b>",
      `Telegram: ${bu.firstName} ${bu.lastName}`.trim(),
      `Username: ${bu.username ? "@" + bu.username : "—"}`,
      // <code> — bosilganda nusxa oladigan format (ID ni ko'chirish qulay bo'lsin)
      `Telegram ID: <code>${bu.telegramId}</code>`,
      `Rol: ${ctx.state.isAdmin ? "admin 🛡" : "foydalanuvchi"}`,
    ];

    if (bu.user) {
      // Sayt akkaunti bog'langan bo'lsa — uning statistikasini ham ko'rsatamiz.
      // Ikkala hisobni parallel bajaramiz.
      const [lessons, words] = await Promise.all([
        Lesson.countDocuments({ createdBy: bu.user._id }),
        Word.countDocuments({ createdBy: bu.user._id }),
      ]);
      lines.push(
        "",
        "<b>🔗 Sayt akkaunti</b>",
        `Ism: ${bu.user.name}`,
        `Email: ${bu.user.email}`,
        `Darslari: ${lessons} ta | So'zlari: ${words} ta`
      );
    } else {
      lines.push("", "🔗 Sayt akkaunti bog'lanmagan — /link");
    }

    return ctx.replyWithHTML(lines.join("\n"));
  };

  bot.command("info", info);
  bot.hears("👤 Profil", info);

  /* ------------------------ /lessons (darslar ro'yxati) ------------------ */
  const lessons = async (ctx) => {
    const { text, keyboard } = await lessonsPage(1);
    return ctx.replyWithHTML(text, keyboard);
  };

  // Massiv — bitta handler bir nechta buyruq nomiga javob beradi.
  // TZ da "/products yoki /items" talab qilingan, biz ikkalasini ham qo'shdik.
  bot.command(["lessons", "items", "products"], lessons);
  bot.hears("📚 Darslar", lessons);

  /**
   * Sahifalash tugmalari: callback_data "lessons:2" ko'rinishida keladi.
   * Regex ichidagi (\d+) — "ushlab qolinadigan guruh", uning qiymati ctx.match[1] da.
   */
  bot.action(/^lessons:(\d+)$/, async (ctx) => {
    // answerCbQuery — Telegram'ga "tugma qabul qilindi" deb javob berish.
    // Chaqirilmasa, tugmada aylanma yuklanish belgisi qotib qoladi.
    await ctx.answerCbQuery();

    const { text, keyboard } = await lessonsPage(Number(ctx.match[1]));
    // editMessageText — yangi xabar yubormasdan, mavjudini o'zgartiradi.
    // .catch(() => {}) — matn aynan bir xil bo'lsa Telegram xato beradi ("message is not modified"),
    // bu bizga muhim emas, shuning uchun e'tiborsiz qoldiramiz.
    await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard }).catch(() => {});
  });

  /* --------------------------- Bitta dars tafsiloti ---------------------- */
  // [a-f\d]{24} — MongoDB ObjectId formati (24 ta hex belgi).
  // Bu regex bir vaqtning o'zida validatsiya vazifasini ham bajaradi.
  bot.action(/^lesson:([a-f\d]{24})$/, async (ctx) => {
    await ctx.answerCbQuery();

    const lesson = await Lesson.findById(ctx.match[1]).populate("createdBy", "name");
    if (!lesson) return ctx.editMessageText("❌ Dars topilmadi.");

    const count = await Word.countDocuments({ lesson: lesson._id });
    const text =
      `📖 <b>${lesson.title}</b>\n\n` +
      `${lesson.description || "Tavsif yo'q"}\n\n` +
      `Daraja: <b>${lesson.level}</b>\n` +
      `So'zlar: <b>${count}</b> ta\n` +
      `Muallif: ${lesson.createdBy?.name || "—"}`;

    await ctx
      .editMessageText(text, { parse_mode: "HTML", ...lessonKeyboard(lesson._id) })
      .catch(() => {});
  });

  /* ---------------------------- Dars so'zlari ---------------------------- */
  bot.action(/^words:([a-f\d]{24})$/, async (ctx) => {
    await ctx.answerCbQuery();

    // limit(30) — Telegram xabari 4096 belgidan oshmasligi kerak
    const words = await Word.find({ lesson: ctx.match[1] }).limit(30);

    const text = words.length
      ? "🔤 <b>So'zlar</b>\n\n" +
        words
          // map ikkinchi argumenti — indeks (0 dan), shuning uchun i + 1
          .map((w, i) => `${i + 1}. <b>${w.term}</b> — ${w.translation}` + (w.example ? `\n   <i>${w.example}</i>` : ""))
          .join("\n")
      : "📭 Bu darsda hali so'zlar yo'q.";

    await ctx
      .editMessageText(text, { parse_mode: "HTML", ...lessonKeyboard(ctx.match[1]) })
      .catch(() => {});
  });

  // "noop" — sahifa raqamini ko'rsatuvchi tugma. Hech narsa qilmaydi,
  // faqat Telegram'ga javob qaytaradi.
  bot.action("noop", (ctx) => ctx.answerCbQuery());

  /* ------------------------- Akkaunt bog'lash / uzish -------------------- */
  // scene.enter("link") — foydalanuvchini "link" wizard'iga kiritadi.
  // Undan keyingi xabarlari shu scene ichida qayta ishlanadi (scenes/link.js ga qarang).
  bot.command("link", (ctx) => ctx.scene.enter("link"));
  bot.hears("🔗 Akkaunt bog'lash", (ctx) => ctx.scene.enter("link"));

  bot.command("unlink", async (ctx) => {
    ctx.state.botUser.user = null; // bog'lanishni uzamiz
    await ctx.state.botUser.save(); // va bazaga yozamiz
    await ctx.reply("🔓 Sayt akkaunti bog'lanmadi qilindi.", mainMenu(ctx.state.isAdmin));
  });
};
