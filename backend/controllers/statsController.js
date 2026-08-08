/**
 * controllers/statsController.js — admin dashboard uchun statistika.
 *
 * Bitta endpoint bir nechta hisobni qaytaradi, shunda frontend
 * 5 ta alohida so'rov yubormaydi (kamroq so'rov = tezroq sahifa).
 */
import User from "../models/User.js";
import Lesson from "../models/Lesson.js";
import Word from "../models/Word.js";
import BotUser from "../models/BotUser.js";

/**
 * GET /api/stats — umumiy ko'rsatkichlar (faqat admin).
 */
export const getStats = async (req, res) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Barcha hisoblar parallel — eng sekinigacha ketgan vaqt sarflanadi
    const [
      users,
      lessons,
      words,
      botUsers,
      botLinked,
      newUsersDay,
      newUsersWeek,
      byLevel,
      recentUsers,
      recentLessons,
    ] = await Promise.all([
      User.countDocuments(),
      Lesson.countDocuments(),
      Word.countDocuments(),
      BotUser.countDocuments(),
      BotUser.countDocuments({ user: { $ne: null } }),
      User.countDocuments({ createdAt: { $gte: dayAgo } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      // Aggregation: darslarni daraja bo'yicha guruhlab sanaydi
      Lesson.aggregate([{ $group: { _id: "$level", count: { $sum: 1 } } }]),
      User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt"),
      Lesson.find().sort({ createdAt: -1 }).limit(5).populate("createdBy", "name"),
    ]);

    // Aggregation natijasini qulay obyektga aylantiramiz:
    // [{_id:"beginner",count:3}] -> {beginner:3, intermediate:0, advanced:0}
    const levels = { beginner: 0, intermediate: 0, advanced: 0 };
    for (const row of byLevel) levels[row._id] = row.count;

    res.json({
      totals: { users, lessons, words, botUsers, botLinked },
      growth: { newUsersDay, newUsersWeek },
      levels,
      recentUsers,
      recentLessons,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
