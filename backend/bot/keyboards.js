/**
 * bot/keyboards.js — bot tugmalari bir joyda.
 *
 * TELEGRAM'DA IKKI XIL KLAVIATURA BOR:
 *
 * 1) Reply keyboard (Markup.keyboard) — chat pastida, klaviatura o'rnida chiqadi.
 *    Bosilganda oddiy MATNLI XABAR yuboradi. Shuning uchun kodda
 *    bot.hears("Darslar", ...) orqali ushlanadi. Doimiy menyu uchun qulay.
 *
 * 2) Inline keyboard (Markup.inlineKeyboard) — xabarning O'ZIGA yopishgan tugmalar.
 *    Bosilganda callback_data yuboradi (foydalanuvchiga ko'rinmaydi) va
 *    bot.action("...") orqali ushlanadi. Xabarni tahrirlash, sahifalash uchun qulay.
 *
 * Har bir tugmalar to'plami FUNKSIYA sifatida yozilgan, chunki ular
 * ma'lumotga bog'liq (masalan admin uchun qo'shimcha tugma, sahifa raqami va h.k.).
 */
import { Markup } from "telegraf";

/**
 * Asosiy menyu (reply keyboard).
 * Massiv ichidagi har bir massiv — bitta QATOR tugmalar.
 * .resize() — tugmalarni ixcham qiladi (aks holda ular ekranning yarmini egallaydi).
 */
export const mainMenu = (isAdmin = false) => {
  const rows = [
    ["Darslar", "Profil"],
    ["Akkaunt bog'lash", "Yordam"],
  ];
  // Admin panel tugmasi faqat adminlarga ko'rinadi
  if (isAdmin) rows.push(["Admin panel"]);
  return Markup.keyboard(rows).resize();
};

/**
 * Admin panel (inline keyboard).
 * callback.button.callback(matn, callback_data) — ikkinchi argument tugma
 * bosilganda botga yuboriladigan "kod". Uni bot.action() shu nom bilan ushlaydi.
 * Cheklov: callback_data 64 baytdan oshmasligi kerak.
 */
export const adminMenu = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback("Statistika", "admin:stats"),
      Markup.button.callback("Foydalanuvchilar", "admin:users:1"), // 1 — sahifa raqami
    ],
    [
      Markup.button.callback("Broadcast", "admin:broadcast"),
      Markup.button.callback("Adminlar", "admin:admins"),
    ],
    [Markup.button.callback("Yopish", "admin:close")],
  ]);

/**
 * Darslar ro'yxati: har bir dars — alohida tugma, pastda sahifalash.
 * @param lessons    joriy sahifadagi darslar
 * @param page       joriy sahifa raqami
 * @param totalPages jami sahifalar soni
 */
export const lessonsKeyboard = (lessons, page, totalPages) => {
  // Har bir dars alohida qatorda. .slice(0, 60) — juda uzun nom tugmani buzmasligi uchun.
  const rows = lessons.map((l) => [
    Markup.button.callback(`${l.title}`.slice(0, 60), `lesson:${l._id}`),
  ]);

  // Navigatsiya qatori:  2/5 
  const nav = [];
  if (page > 1) nav.push(Markup.button.callback("Oldingi", `lessons:${page - 1}`));
  // "noop" — hech narsa qilmaydigan tugma (faqat sahifa raqamini ko'rsatadi)
  if (totalPages > 1) nav.push(Markup.button.callback(`${page}/${totalPages}`, "noop"));
  if (page < totalPages) nav.push(Markup.button.callback("Keyingi", `lessons:${page + 1}`));
  if (nav.length) rows.push(nav);

  return Markup.inlineKeyboard(rows);
};

/** Bitta dars ichidagi tugmalar: so'zlarni ko'rish yoki ro'yxatga qaytish */
export const lessonKeyboard = (lessonId, page = 1) =>
  Markup.inlineKeyboard([
    [Markup.button.callback("So'zlar", `words:${lessonId}`)],
    [Markup.button.callback("Darslarga qaytish", `lessons:${page}`)],
  ]);

/**
 * Adminlar ro'yxati — har birining yonida "olib tashlash" tugmasi.
 * callback_data ichiga telegramId yoziladi, keyin action uni regex bilan ajratib oladi.
 */
export const adminsKeyboard = (admins) => {
  const rows = admins.map((a) => [
    Markup.button.callback(
      // Ism bo'lmasa username, u ham bo'lmasa ID ko'rsatiladi
      `Olib tashlash: ${a.firstName || a.username || a.telegramId}`,
      `admin:demote:${a.telegramId}`
    ),
  ]);
  rows.push([Markup.button.callback("Admin qo'shish", "admin:promote")]);
  rows.push([Markup.button.callback("Orqaga", "admin:panel")]);
  return Markup.inlineKeyboard(rows);
};

/**
 * Tasdiqlash tugmalari — qaytarib bo'lmaydigan amallar oldidan.
 * @param yes "ha" tugmasining callback_data si
 * @param no  "yo'q" tugmasiniki
 */
export const confirmKeyboard = (yes, no = "cancel") =>
  Markup.inlineKeyboard([
    [Markup.button.callback("Ha, yuborish", yes), Markup.button.callback("Bekor", no)],
  ]);
