# Tilim — Til o'rganish ilovasi

Full-stack til o'rganish platformasi: **React + Express + MongoDB**, JWT autentifikatsiya bilan.
Foydalanuvchi darslar (Lesson) va so'zlar (Word) yaratadi, tahrirlaydi va o'chiradi.

## Texnologiyalar

| Qatlam | Texnologiya |
|---|---|
| Frontend | React (Vite) + Tailwind CSS + Zustand + React Router + Axios |
| Backend | Node.js + Express.js |
| Baza | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Telegram bot | Telegraf.js (server bilan bitta processda) |
| Xavfsizlik | helmet, express-rate-limit |

## Tuzilma

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
        ├── store/             # Zustand: authStore, themeStore
        ├── components/        # Navbar, ProtectedRoute, AdminRoute, ui
        └── pages/             # Login, Register, Lessons, LessonDetail,
                               # Profile, AdminDashboard (lazy yuklanadi)
```

## Kodni o'qish tartibi (backend'ni o'rganish uchun)

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

## Ishga tushirish

### 0. MongoDB (lokal, o'rnatishsiz)

MongoDB o'rnatilmagan bo'lsa, `mongodb-memory-server` bilan birga keladigan
`mongod` binaridan doimiy lokal baza sifatida foydalanish mumkin:

```bash
cd backend && npm install   # binar shu paytda yuklab olinadi
npm run db                  # 127.0.0.1:27017, ma'lumot ../.mongodb-data da saqlanadi
```

> `npm run db` skripti macOS (arm64) uchun yozilgan. Boshqa tizimda
> `node_modules/.cache/mongodb-memory-server/` ichidagi binar nomini mos ravishda o'zgartiring,
> yoki MongoDB Atlas URI'sini ishlating.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # va qiymatlarni to'ldiring
npm run seed              # (ixtiyoriy) test ma'lumotlari
npm run dev               # http://localhost:5000
```

> **macOS eslatmasi:** 5000-portni AirPlay Receiver (`ControlCenter`) egallab turadi.
> Shuning uchun lokalda `.env` da `PORT=5001` qilingan — frontend `.env` dagi
> `VITE_API_URL` ham 5001 ga moslangan. Yoki System Settings → General → AirDrop
> & Handoff → AirPlay Receiver ni o'chiring.

`.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/tilim
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

Seed'dan keyin: **test@example.com / 123456** va **admin@tilim.uz / admin123**

## API Endpointlar

| Method | Endpoint | Auth | Izoh |
|---|---|:---:|---|
| POST | `/api/auth/register` | — | Ro'yxatdan o'tish |
| POST | `/api/auth/login` | — | Kirish (JWT) |
| GET | `/api/auth/me` | token | Joriy foydalanuvchi |
| PUT | `/api/auth/me` | token | Profilni tahrirlash (ism/email/parol) |
| GET | `/api/auth/users?page=&limit=&search=` | admin | Foydalanuvchilar ro'yxati |
| GET | `/api/stats` | admin | Dashboard ko'rsatkichlari |
| GET | `/api/lessons?page=&limit=` | — | Darslar (pagination) |
| GET | `/api/lessons/:id` | — | Bitta dars |
| POST | `/api/lessons` | token | Dars yaratish |
| PUT | `/api/lessons/:id` | token | Yangilash |
| DELETE | `/api/lessons/:id` | token | O'chirish |
| GET | `/api/words?lesson=&page=&limit=` | — | So'zlar (pagination) |
| GET | `/api/words/:id` | — | Bitta so'z |
| POST | `/api/words` | token | So'z yaratish |
| PUT | `/api/words/:id` | token | Yangilash |
| DELETE | `/api/words/:id` | token | O'chirish |

## Telegram bot

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
2. Yoki skript orqali (serverni qayta ishga tushirmasdan):
   ```bash
   cd backend
   npm run make-admin              # bot foydalanuvchilari ro'yxati
   npm run make-admin -- 12345678  # shu ID ni admin qilish
   ```
3. Yoki admin panel → Adminlar → Admin qo'shish (ID/@username orqali).
4. Yoki sayt akkauntida `role: "admin"` bo'lsa — `/link` dan keyin avtomatik admin.

### Avtomatik xabarlar

- Yangi foydalanuvchi ro'yxatdan o'tganda → barcha adminlarga
- Yangi dars yaratilganda → barcha adminlarga

### Produksiyada webhook

`.env` ga backend domenini qo'shing, bot ishga tushganda webhook o'zi o'rnatiladi:

```
BOT_WEBHOOK_DOMAIN=https://sizning-backend.onrender.com
BOT_WEBHOOK_SECRET=tasodifiy_maxfiy_satr
```

## Live havolalar

| Nima | Manzil |
|---|---|
| Frontend (Vercel) | https://backend-final-mauve.vercel.app |
| Backend API (Railway) | https://backend-final-production-50fe.up.railway.app |
| Telegram bot | [@backccbot](https://t.me/backccbot) |
| Repozitoriya | https://github.com/elbekgiyozov/backend-final |

Demo akkauntlar:

| Rol | Email | Parol |
|---|---|---|
| Foydalanuvchi | `test@example.com` | `123456` |
| Admin | `admin@tilim.uz` | `admin123` |

## Deploy

Umumiy sxema: **Atlas** (baza) → **Railway** (backend + bot) → **Vercel** (frontend).
Tartib muhim: har bir keyingisi oldingisining domenini talab qiladi.

### Backend — Railway

Repo mono-repo bo'lgani uchun **Root Directory** ni `backend` qilib ko'rsatish shart.

1. Railway → **New Project** → **Deploy from GitHub repo** → repozitoriyani tanlang.
2. Service → **Settings** → **Source** → **Root Directory** = `/backend`, so'ng yonidagi
   tasdiqlash tugmasini bosing (Railway bu maydonni avtomatik saqlamaydi).
   Start command va healthcheck `backend/railway.json` dan olinadi.
3. **Settings → Regions** → bazangiz turgan qit'aga yaqin region (masalan Atlas Frankfurt'da
   bo'lsa — **EU West**). Noto'g'ri region har bir baza so'roviga 200-300 ms qo'shadi.
4. **Variables** bo'limiga quyidagilarni qo'ying:

| O'zgaruvchi | Qiymat |
|---|---|
| `MONGO_URI` | Atlas connection string (`mongodb+srv://...`) |
| `JWT_SECRET` | uzun tasodifiy satr |
| `JWT_EXPIRE` | `7d` |
| `CLIENT_URL` | frontend domeni (bir nechtasi vergul bilan) |
| `NODE_ENV` | `production` |
| `BOT_TOKEN` | @BotFather tokeni |
| `BOT_ADMIN_IDS` | Telegram ID'laringiz |
| `BOT_WEBHOOK_DOMAIN` | Railway bergan domen (birinchi deploy'dan keyin) |
| `BOT_WEBHOOK_PATH` | `/api/telegram/webhook` |
| `BOT_WEBHOOK_SECRET` | tasodifiy satr |
| `MONGOMS_DISABLE_POSTINSTALL` | `1` — mongodb-memory-server binarini yuklamasin |

> `PORT` ni qo'lda kiritmang — uni Railway o'zi beradi, kod `process.env.PORT` dan oladi.

5. **Settings → Networking → Generate Domain** → chiqqan manzilni `BOT_WEBHOOK_DOMAIN` ga
   yozing va redeploy qiling.
6. Ixtiyoriy: **Settings → Watch Paths** = `/backend/**` — frontend o'zgarganda backend
   bekorga qayta deploy bo'lmaydi.

Tekshirish:
```bash
curl https://<domen>/            # {"status":"ok","service":"tilim API"}
curl https://<domen>/api/lessons # bazadan ma'lumot
```
Log'da `Telegram bot webhook rejimida: ...` chiqsa — bot produksiya rejimida.

### Baza — MongoDB Atlas

1. Bepul **M0** cluster yarating. Region'ni Railway region'iga yaqin tanlang
   (masalan Frankfurt) — cluster yaratilgandan keyin uni o'zgartirib bo'lmaydi.
2. "Preload sample dataset" ni **o'chiring** — bepul 512 MB joyning katta qismini egallaydi.
3. **Database Access** → foydalanuvchi qo'shing. Parolda `@ : / ? #` belgilari bo'lmasin —
   ular connection string'ni buzadi.
4. **Network Access** → `0.0.0.0/0`. Railway IP'lari o'zgarib turadi, aniq IP yozib bo'lmaydi.
5. **Connect → Drivers** dan string'ni oling va **baza nomini qo'shing**:
   ```
   mongodb+srv://user:parol@cluster.mongodb.net/tilim?retryWrites=true&w=majority
   ```
   `/tilim` qismisiz Mongo `test` nomli bazaga yozadi.
6. Produksiya bazasini to'ldirish (ixtiyoriy):
   ```bash
   cd backend && MONGO_URI='<atlas-string>' npm run seed
   ```

### Frontend — Vercel

- **Root Directory**: `frontend`
- Framework Preset: Vite (avtomatik aniqlanadi)
- **Environment Variables**: `VITE_API_URL = https://<railway-domen>/api`

SPA routing uchun `frontend/vercel.json` qo'shilgan — busiz `/login` yoki `/lessons/:id`
manzillarini to'g'ridan-to'g'ri ochganda 404 chiqadi.

> **Muhim:** Vite `VITE_*` o'zgaruvchilarni **build paytida** kodga yozadi. Env qo'shgandan
> keyin **Redeploy** qilish shart (Build Cache'siz), aks holda eski qiymat qoladi.

Frontend'da faqat `VITE_` bilan boshlanadigan o'zgaruvchilar bo'lsin — `MONGO_URI`,
`JWT_SECRET`, `BOT_TOKEN` kabi backend sirlari bu loyihada keraksiz.

Deploy'dan keyin frontend domenini backend'dagi `CLIENT_URL` ga qo'shing (CORS uchun):
```
CLIENT_URL=https://<vercel-domen>,http://localhost:5173
```

### Netlify (muqobil)

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `frontend/dist`
- Environment: `VITE_API_URL=https://<railway-domen>/api`

SPA fallback uchun `frontend/public/_redirects` fayliga `/*  /index.html  200` yozing.

### Tez-tez uchraydigan xatolar

| Belgi | Sabab | Yechim |
|---|---|---|
| `Railpack could not determine how to build the app` | Root Directory qo'yilmagan, Railway repo ildizini ko'ryapti | Settings → Source → Root Directory = `/backend` |
| `MongoServerSelectionError` | Atlas'da IP ruxsati yo'q | Network Access → `0.0.0.0/0` |
| `bad auth` | parol noto'g'ri yoki maxsus belgi bor | `MONGO_URI` ni qayta yig'ing |
| Saytda `/login` → 404 | SPA fallback yo'q | `vercel.json` / `_redirects` |
| Saytdan API'ga so'rov `localhost` ga ketyapti | `VITE_API_URL` yo'q yoki redeploy qilinmagan | env qo'shib, cache'siz redeploy |
| Brauzer konsolida CORS xatosi | backend'da `CLIENT_URL` eski | Railway'da yangilang va redeploy |
| Bot ikki marta javob beradi / `409 Conflict` | lokal va produksiya bot bir vaqtda polling qilyapti | lokal serverni to'xtating |

## Postman collection

`backend/postman/` ichida ikkita fayl bor — Postman'da **Import** qiling:

| Fayl | Nima |
|---|---|
| `Tilim.postman_collection.json` | 17 ta so'rov: Health, Auth, Lessons, Words, xatolik holatlari |
| `Tilim.postman_environment.json` | `baseUrl`, `serverUrl`, `token`, `lessonId`, `wordId` |

Ishlatish: environment'ni tanlang → **Auth → Login** (token avtomatik `{{token}}` ga saqlanadi)
→ qolgan so'rovlarni yuboraverasiz. `Dars yaratish` / `So'z yaratish` esa ID'ni
`{{lessonId}}` / `{{wordId}}` ga yozadi, shuning uchun GET/PUT/DELETE larni qo'lda tahrirlash shart emas.

Papkalar yuqoridan pastga ketma-ket ishlatiladigan tartibda joylashgan
(create → list → get → update → delete). Har bir so'rovda status kodlari va
xatolik holatlari izohlangan.

Produksiyani tekshirish uchun environment'da ikki qiymatni almashtiring:

```
serverUrl = https://backend-final-production-50fe.up.railway.app
baseUrl   = https://backend-final-production-50fe.up.railway.app/api
```

## Topshirish ro'yxati (TZ 6-bo'lim)

| Talab | Holat |
|---|---|
| GitHub repozitoriyasi, commit tarixi bilan | https://github.com/elbekgiyozov/backend-final |
| Frontend live URL | https://backend-final-mauve.vercel.app |
| Backend live URL | https://backend-final-production-50fe.up.railway.app |
| Telegram bot username | [@backccbot](https://t.me/backccbot) |
| README: local ishga tushirish | shu fayl, "Ishga tushirish" bo'limi |
| Postman collection | `backend/postman/` |
| `.env.example` (haqiqiy qiymatlarsiz) | `backend/.env.example`, `frontend/.env.example` |

## Xususiyatlar

- JWT login/register, bcrypt hash
- Protected routes (frontend + backend)
- 3 model: User, Lesson, Word
- To'liq CRUD + pagination
- Middleware: auth, logger, error handler
- Dark mode, Loading/Error holatlari, form validatsiya
- Bonus: helmet + rate limiting
- Telegraf bot: inline + reply keyboard, 3 ta wizard scene, ko'p admin, broadcast
- Bot ↔ DB integratsiyasi (`BotUser` modeli, sayt akkauntiga bog'lash)
- Zustand store'lari (`authStore`, `themeStore`) — Context o'rniga
- Admin dashboard: statistika, daraja bo'yicha taqsimot, foydalanuvchilar jadvali
- Profil sahifasi: ism/email/parolni tahrirlash
- Lazy loading: har bir sahifa alohida chunk, `Suspense` fallback bilan
- Real-time: admin dashboard har 15 soniyada polling qiladi
- Telegram bot havolasi navbarda (`VITE_BOT_URL`)
