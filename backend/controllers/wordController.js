/**
 * controllers/wordController.js — so'zlar uchun CRUD logikasi.
 *
 * Tuzilishi lessonController bilan bir xil — bu ATAYLAB shunday:
 * bir xil pattern kodni o'qishni ham, yangi resurs qo'shishni ham osonlashtiradi.
 */
import Word from "../models/Word.js";

/**
 * GET /api/words?page=1&limit=10&lesson=&search=
 * So'zlar ro'yxati — sahifalash, dars bo'yicha filtr va qidiruv bilan.
 */
export const getWords = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = {};
    // ?lesson=<id> — faqat shu darsning so'zlari
    if (req.query.lesson) filter.lesson = req.query.lesson;

    if (req.query.search) {
      // $or — shartlardan KAMIDA BITTASI bajarilsa yetarli.
      // Ya'ni "olma" deb qidirilsa, ham inglizcha so'z, ham tarjima bo'yicha topadi.
      filter.$or = [
        { term: { $regex: req.query.search, $options: "i" } },
        { translation: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Word.find(filter)
        .populate("lesson", "title level") // so'z qaysi darsga tegishli ekanini ko'rsatish uchun
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Word.countDocuments(filter),
    ]);

    res.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** GET /api/words/:id — bitta so'z */
export const getWord = async (req, res) => {
  try {
    const word = await Word.findById(req.params.id).populate("lesson", "title level");
    if (!word) return res.status(404).json({ message: "So'z topilmadi" });
    res.json(word);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/words — yangi so'z (auth talab qilinadi).
 * Body: { term, translation, example, lesson }
 */
export const createWord = async (req, res) => {
  try {
    const { term, translation, example, lesson } = req.body;
    const word = await Word.create({
      term,
      translation,
      example,
      lesson, // qaysi darsga tegishli — bu ID body'da keladi
      createdBy: req.user._id, // egasi esa tokendan olinadi
    });
    res.status(201).json(word);
  } catch (err) {
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)[0].message;
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: err.message });
  }
};

/** PUT /api/words/:id — yangilash (faqat egasi yoki admin) */
export const updateWord = async (req, res) => {
  try {
    const word = await Word.findById(req.params.id);
    if (!word) return res.status(404).json({ message: "So'z topilmadi" });

    // Egalik tekshiruvi — begona hujjatni o'zgartirishning oldini oladi
    if (word.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bu so'zni tahrirlashga ruxsat yo'q" });
    }

    const { term, translation, example, lesson } = req.body;
    // Faqat yuborilgan maydonlarni yangilaymiz (qisman yangilash)
    if (term !== undefined) word.term = term;
    if (translation !== undefined) word.translation = translation;
    if (example !== undefined) word.example = example;
    if (lesson !== undefined) word.lesson = lesson;

    const updated = await word.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** DELETE /api/words/:id — o'chirish (faqat egasi yoki admin) */
export const deleteWord = async (req, res) => {
  try {
    const word = await Word.findById(req.params.id);
    if (!word) return res.status(404).json({ message: "So'z topilmadi" });

    if (word.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bu so'zni o'chirishga ruxsat yo'q" });
    }

    await word.deleteOne();
    res.json({ message: "So'z o'chirildi", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
