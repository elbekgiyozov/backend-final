/**
 * controllers/authController.js — autentifikatsiya biznes-logikasi.
 *
 * CONTROLLER nima? So'rov (req) kelganda bajariladigan asosiy ish:
 * ma'lumotni tekshirish, baza bilan ishlash va javob (res) qaytarish.
 * Route'lar faqat "qaysi manzil qaysi controllerga tegishli" ekanini belgilaydi.
 *
 * req — kirish (body, params, query, headers)
 * res — chiqish (res.status(...).json(...))
 */
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { notifyAdmins } from "../bot/notify.js";

/**
 * POST /api/auth/register — yangi foydalanuvchi ro'yxatdan o'tkazish.
 * Body: { name, email, password }
 */
export const register = async (req, res) => {
  try {
    // Frontend yuborgan JSON express.json() tufayli req.body ga tushadi
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      // 400 Bad Request — so'rov noto'g'ri tuzilgan
      return res.status(400).json({ message: "Barcha maydonlar to'ldirilishi kerak" });
    }

    // Email band emasligini tekshiramiz (modeldagi unique ham himoya qiladi,
    // lekin bu yerda tushunarli xabar qaytarish uchun oldindan tekshiramiz)
    const exists = await User.findOne({ email });
    if (exists) {
      // 409 Conflict — resurs allaqachon mavjud
      return res.status(409).json({ message: "Bu email allaqachon ro'yxatdan o'tgan" });
    }

    // User.create — hujjat yaratadi va saqlaydi.
    // Parol modeldagi pre("save") hook'ida avtomatik hash qilinadi.
    const user = await User.create({ name, email, password });

    // Yangi ro'yxatdan o'tish haqida adminlarga bot orqali xabar.
    // `await` QILINMAYDI — Telegram sekin javob bersa ham foydalanuvchi
    // kutib qolmasin. .catch() esa xatolik butun so'rovni yiqitmasligi uchun.
    notifyAdmins(
      `<b>Yangi foydalanuvchi</b>\n\nIsm: ${user.name}\nEmail: ${user.email}\nVaqt: ${new Date().toLocaleString("uz-UZ")}`
    ).catch(() => {});

    // 201 Created — yangi resurs yaratildi.
    // Javobda darhol token beramiz, shunda foydalanuvchi qayta login qilmaydi.
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    // Mongoose validatsiya xatosi (masalan parol 6 belgidan qisqa) —
    // birinchi xato xabarini olib, tushunarli qilib qaytaramiz.
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)[0].message;
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/auth/login — tizimga kirish.
 * Body: { email, password }
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email va parol kiritilishi kerak" });
    }

    // Modelda password: select false — shuning uchun uni ataylab so'raymiz
    const user = await User.findOne({ email }).select("+password");

    // Email topilmadimi yoki parol xatomi — FARQ qilmasdan bitta xabar qaytaramiz.
    // Sabab: "bunday email yo'q" deyish hujumchiga qaysi emaillar
    // ro'yxatdan o'tganini aniqlash imkonini beradi.
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Email yoki parol noto'g'ri" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/auth/me — joriy foydalanuvchi ma'lumoti (himoyalangan).
 * req.user'ni protect middleware'i tokendan aniqlab qo'ygan bo'ladi,
 * shuning uchun bu yerda hech qanday qo'shimcha ish qolmaydi.
 */
export const getMe = async (req, res) => {
  res.json(req.user);
};
