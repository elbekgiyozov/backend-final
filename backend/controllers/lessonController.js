/**
 * controllers/lessonController.js — darslar uchun CRUD logikasi.
 *
 * CRUD = Create (yaratish), Read (o'qish), Update (yangilash), Delete (o'chirish).
 * Har biri o'z HTTP metodiga mos keladi: POST, GET, PUT, DELETE.
 */
import Lesson from "../models/Lesson.js";
import { notifyAdmins } from "../bot/notify.js";

/**
 * GET /api/lessons?page=1&limit=10&search=&level=
 * Barcha darslar — sahifalash (pagination), qidiruv va filtr bilan.
 *
 * PAGINATION nega kerak? 10 000 ta dars bo'lsa, hammasini bir yo'la yuborish
 * serverni ham, brauzerni ham qiynaydi. Shuning uchun bo'lib-bo'lib beramiz.
 */
export const getLessons = async (req, res) => {
  try {
    // req.query — URL dagi "?page=2&limit=5" qismi. Ular HAR DOIM satr ("2"),
    // shuning uchun parseInt bilan songa aylantiramiz.
    // Math.max(1, ...) — manfiy yoki 0 sahifa bo'lmasligi uchun.
    const page = Math.max(1, parseInt(req.query.page) || 1);
    // Math.min(50, ...) — kimdir limit=100000 deb so'ramasligi uchun yuqori chegara.
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    // skip — nechta hujjatni o'tkazib yuborish. 2-sahifa, limit 10 → 10 tani o'tkazamiz.
    const skip = (page - 1) * limit;

    // Filtr obyekti — bo'sh {} bo'lsa hamma hujjat qaytadi
    const filter = {};
    if (req.query.search) {
      // $regex — matn ichidan qidiradi, $options: "i" — katta/kichik harf farqsiz
      filter.title = { $regex: req.query.search, $options: "i" };
    }
    if (req.query.level) filter.level = req.query.level;

    // Promise.all — ikkala so'rovni PARALLEL bajaradi (ketma-ket emas),
    // shuning uchun umumiy kutish vaqti qisqaradi.
    const [items, total] = await Promise.all([
      Lesson.find(filter)
        // populate — createdBy ichidagi ID ni haqiqiy User ma'lumotiga almashtiradi,
        // ikkinchi argument — faqat kerakli maydonlar ("name email")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 }) // -1 → yangilari birinchi
        .skip(skip)
        .limit(limit),
      Lesson.countDocuments(filter), // jami nechta (sahifalar sonini hisoblash uchun)
    ]);

    res.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit), // yuqoriga yaxlitlash: 25/10 → 3
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/lessons/:id — bitta dars.
 * ":id" — route parametri, qiymati req.params.id da bo'ladi.
 */
export const getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate("createdBy", "name email");
    // findById topmasa null qaytaradi (xatolik tashlamaydi) — o'zimiz tekshiramiz
    if (!lesson) return res.status(404).json({ message: "Dars topilmadi" });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/lessons — yangi dars (protect middleware'i talab qilinadi).
 * Body: { title, description, level }
 */
export const createLesson = async (req, res) => {
  try {
    const { title, description, level } = req.body;

    const lesson = await Lesson.create({
      title,
      description,
      level,
      // Egasini body'dan OLMAYMIZ, tokendan olamiz (req.user).
      // Aks holda kimdir boshqa odam nomidan dars yarata olardi.
      createdBy: req.user._id,
    });

    // Adminlarga bot orqali xabar (javobni kutmasdan)
    notifyAdmins(
      `📚 <b>Yangi dars</b>\n\nNomi: ${lesson.title}\nDaraja: ${lesson.level}\nMuallif: ${req.user.name}`
    ).catch(() => {});

    res.status(201).json(lesson);
  } catch (err) {
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)[0].message;
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/lessons/:id — darsni yangilash (faqat egasi yoki admin).
 */
export const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Dars topilmadi" });

    // EGALIK TEKSHIRUVI — eng muhim xavfsizlik qadami.
    // ObjectId'larni to'g'ridan-to'g'ri === bilan solishtirib bo'lmaydi
    // (ular obyekt), shuning uchun ikkalasini ham toString() qilamiz.
    if (lesson.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bu darsni tahrirlashga ruxsat yo'q" });
    }

    const { title, description, level } = req.body;
    // "!== undefined" tekshiruvi: faqat YUBORILGAN maydonlar yangilanadi.
    // Agar shunchaki `if (title)` yozsak, bo'sh satr ("") yuborilganda ishlamay qolardi.
    if (title !== undefined) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (level !== undefined) lesson.level = level;

    // save() — pre("save") hook'larini va validatsiyani ishga tushiradi
    const updated = await lesson.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/lessons/:id — darsni o'chirish (faqat egasi yoki admin).
 */
export const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Dars topilmadi" });

    if (lesson.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bu darsni o'chirishga ruxsat yo'q" });
    }

    await lesson.deleteOne();
    // Frontend qaysi elementni ro'yxatdan olib tashlashni bilishi uchun id ni qaytaramiz
    res.json({ message: "Dars o'chirildi", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
