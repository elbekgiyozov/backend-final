# 📚 TilOrgan — Til o'rganish ilovasi

Full-stack til o'rganish platformasi: **React + Express + MongoDB**, JWT autentifikatsiya bilan.
Foydalanuvchi darslar (Lesson) va so'zlar (Word) yaratadi, tahrirlaydi va o'chiradi.

## 🧱 Texnologiyalar

| Qatlam | Texnologiya |
|---|---|
| Frontend | React (Vite) + Tailwind CSS + React Router + Axios |
| Backend | Node.js + Express.js |
| Baza | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Telegram bot | Telegraf.js (server bilan bitta processda) |
| Xavfsizlik | helmet, express-rate-limit |

## 📁 Tuzilma

```
.
├── backend/
│   ├── config/db.js          # MongoDB ulanish
│   ├── models/               # User, Lesson, Word, BotUser
│   ├── bot/                  # Telegraf bot
│   │   ├── instance.js       # bot obyekti (circular importni oldini oladi)
│   │   ├── index.js          # handlerlar + polling/webhook launch
│   │   ├── middleware.js     # BotUser upsert, admin guard
│   │   ├── keyboards.js      # reply + inline keyboardlar
│   │   ├── notify.js         # notifyAdmins / notifyUser / broadcast
│   │   ├── handlers/         # user.js, admin.js
│   │   └── scenes/           # link, broadcast, promote (wizard)
│   ├── controllers/          # Biznes logika
│   ├── routes/               # API routerlari
│   ├── middleware/           # auth, logger, errorHandler
│   ├── utils/generateToken.js
│   ├── server.js
│   └── seed.js               # test ma'lumotlari
└── frontend/
    └── src/
        ├── api/axios.js       # token interceptor bilan
        ├── context/           # AuthContext, ThemeContext (dark mode)
        ├── components/        # Navbar, ProtectedRoute
        └── pages/             # Login, Register, Lessons, LessonDetail
```

## 🗺 Kodni o'qish tartibi (backend'ni o'rganish uchun)

Barcha backend fayllari batafsil o'zbekcha kommentlar bilan izohlangan.
Tavsiya etilgan o'qish ketma-ketligi:

| # | Fayl | Nima o'rganiladi |
|---|---|---|
| 1 | `backend/server.js` | Kirish nuqtasi: middleware va route'lar qanday tartibda ulanadi |
| 2 | `backend/config/db.js` | MongoDB'ga ulanish |
| 3 | `backend/models/User.js` | Schema, validatsiya, `pre("save")` hook, parol hash |
| 4 | `backend/models/Lesson.js`, `Word.js` | Modellar orasidagi bog'lanish (`ref`, `populate`) |
| 5 | `backend/routes/*.js` | Manzil ↔ controller bog'lanishi |
| 6 | `backend/controllers/authController.js` | Register/login, JWT berish |
| 7 | `backend/middleware/auth.js` | Tokenni tekshirish (`protect`), rol tekshiruvi |
| 8 | `backend/controllers/lessonController.js` | CRUD, pagination, egalik tekshiruvi |
| 9 | `backend/bot/index.js` | Bot qanday yig'iladi, polling va webhook farqi |
| 10 | `backend/bot/handlers/`, `scenes/` | Buyruqlar, tugmalar va wizard'lar |

Qatlamlar mas'uliyati:
**route** — manzil, **controller** — biznes-logika, **model** — ma'lumot tuzilishi,
**middleware** — har so'rov o'tadigan umumiy tekshiruvlar.

## 🚀 Ishga tushirish

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # va qiymatlarni to'ldiring
npm run seed              # (ixtiyoriy) test ma'lumotlari
npm run dev               # http://localhost:5000
```

`.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/til_organish
JWT_SECRET=maxfiy_kalit
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173

# Telegram bot
BOT_TOKEN=@BotFather_dan_olingan_token
BOT_ADMIN_IDS=123456789            # vergul bilan bir nechta
BOT_WEBHOOK_DOMAIN=                # bo'sh bo'lsa — polling
BOT_WEBHOOK_PATH=/api/telegram/webhook
BOT_WEBHOOK_SECRET=
```

> MongoDB lokalda bo'lmasa — [MongoDB Atlas](https://www.mongodb.com/atlas) dan bepul URI oling.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Seed'dan keyin test login: **test@example.com / 123456**

## 🌐 API Endpointlar

| Method | Endpoint | Auth | Izoh |
|---|---|:---:|---|
| POST | `/api/auth/register` | — | Ro'yxatdan o'tish |
| POST | `/api/auth/login` | — | Kirish (JWT) |
| GET | `/api/auth/me` | ✅ | Joriy foydalanuvchi |
| GET | `/api/lessons?page=&limit=` | — | Darslar (pagination) |
| GET | `/api/lessons/:id` | — | Bitta dars |
| POST | `/api/lessons` | ✅ | Dars yaratish |
| PUT | `/api/lessons/:id` | ✅ | Yangilash |
| DELETE | `/api/lessons/:id` | ✅ | O'chirish |
| GET | `/api/words?lesson=&page=&limit=` | — | So'zlar (pagination) |
| GET | `/api/words/:id` | — | Bitta so'z |
| POST | `/api/words` | ✅ | So'z yaratish |
| PUT | `/api/words/:id` | ✅ | Yangilash |
| DELETE | `/api/words/:id` | ✅ | O'chirish |

## 🤖 Telegram bot

Bot backend server bilan **bitta processda** ishlaydi (`server.js` → `startBot(app)`).
`BOT_WEBHOOK_DOMAIN` berilsa — webhook (produksiya), aks holda long polling (lokal).

### Foydalanuvchi buyruqlari

| Buyruq | Vazifasi |
|---|---|
| `/start` | Xush kelibsiz xabari + reply keyboard menyu |
| `/help` | Buyruqlar ro'yxati |
| `/info` | Profil (bog'langan sayt akkaunti, dars/so'z statistikasi) |
| `/lessons` (`/items`, `/products`) | Darslar — inline keyboard, pagination, so'zlarni ko'rish |
| `/link` | Sayt akkauntini bog'lash (wizard: email → parol) |
| `/unlink` | Bog'lanishni bekor qilish |

### Admin buyruqlari

| Buyruq | Vazifasi |
|---|---|
| `/admin` | Inline admin panel |
| `/stats` | Statistika (foydalanuvchilar, darslar, so'zlar, bot obunachilari) |
| `/users` | Bot foydalanuvchilari ro'yxati (pagination bilan) |
| `/broadcast` | Ommaviy xabar (wizard: matn → tasdiq → yuborish) |

### Admin qilish

1. `.env` da `BOT_ADMIN_IDS=<sizning_telegram_id>` — doimiy admin (olib tashlab bo'lmaydi).
2. Yoki admin panel → 🛡 Adminlar → ➕ Admin qo'shish (ID/@username orqali).
3. Yoki sayt akkauntida `role: "admin"` bo'lsa — `/link` dan keyin avtomatik admin.

### Avtomatik xabarlar

- Yangi foydalanuvchi ro'yxatdan o'tganda → barcha adminlarga
- Yangi dars yaratilganda → barcha adminlarga

### Produksiyada webhook

`.env` ga backend domenini qo'shing, bot ishga tushganda webhook o'zi o'rnatiladi:

```
BOT_WEBHOOK_DOMAIN=https://sizning-backend.onrender.com
BOT_WEBHOOK_SECRET=tasodifiy_maxfiy_satr
```

## ✨ Xususiyatlar

- ✅ JWT login/register, bcrypt hash
- ✅ Protected routes (frontend + backend)
- ✅ 3 model: User, Lesson, Word
- ✅ To'liq CRUD + pagination
- ✅ Middleware: auth, logger, error handler
- ✅ Dark mode, Loading/Error holatlari, form validatsiya
- ✅ Bonus: helmet + rate limiting
- ✅ Telegraf bot: inline + reply keyboard, 3 ta wizard scene, ko'p admin, broadcast
- ✅ Bot ↔ DB integratsiyasi (`BotUser` modeli, sayt akkauntiga bog'lash)
