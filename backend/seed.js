/**
 * seed.js — bazani test ma'lumotlari bilan to'ldirish: `npm run seed`
 *
 * SEED nima uchun? Bo'sh bazada ilovani sinab ko'rish noqulay.
 * Bu skript bir nechta namunaviy yozuv yaratadi va darhol ishlashni boshlash mumkin.
 *
 * OGOHLANTIRISH: skript avval MAVJUD ma'lumotlarni O'CHIRADI.
 * Shuning uchun uni faqat development bazasida ishlating.
 */
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import mongoose from "mongoose";
import User from "./models/User.js";
import Lesson from "./models/Lesson.js";
import Word from "./models/Word.js";

dotenv.config(); // .env dan MONGO_URI ni o'qish uchun

const run = async () => {
  await connectDB();

  // deleteMany({}) — filtr bo'sh, ya'ni collection'dagi HAMMA hujjatni o'chiradi.
  // Promise.all bilan uchalasi parallel bajariladi.
  await Promise.all([
    User.deleteMany({}),
    Lesson.deleteMany({}),
    Word.deleteMany({}),
  ]);

  // Parol modeldagi pre("save") hook'i tufayli avtomatik hash qilinadi
  const user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "123456",
  });

  // Dars foydalanuvchiga bog'lanadi (createdBy)
  const lesson = await Lesson.create({
    title: "Boshlang'ich inglizcha so'zlar",
    description: "Kundalik hayotda ishlatiladigan so'zlar",
    level: "beginner",
    createdBy: user._id,
  });

  // insertMany — bir nechta hujjatni bitta so'rovda qo'shadi (create'dan tezroq)
  await Word.insertMany([
    { term: "apple", translation: "olma", example: "I eat an apple.", lesson: lesson._id, createdBy: user._id },
    { term: "book", translation: "kitob", example: "This is my book.", lesson: lesson._id, createdBy: user._id },
    { term: "water", translation: "suv", example: "I drink water.", lesson: lesson._id, createdBy: user._id },
  ]);

  console.log("Seed tayyor. Login: test@example.com / 123456");

  // Ulanishni yopamiz, aks holda skript tugamay osilib turadi
  await mongoose.connection.close();
  process.exit(0); // 0 — muvaffaqiyatli yakun
};

// run() ichida kutilmagan xatolik chiqsa — konsolga yozib, xato kodi bilan chiqamiz
run().catch((e) => {
  console.error(e);
  process.exit(1); // 1 — xatolik bilan yakunlandi
});
