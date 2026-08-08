# CLAUDE.md — Tilim loyihasi

Til o'rganish full-stack ilovasi (TTZ: React + Express + MongoDB).

## Tuzilma
- `backend/` — Express API (ESM, `type: module`). Qatlamli: models / controllers / routes / middleware.
- `backend/bot/` — Telegraf bot, server bilan bitta processda (`startBot(app)`).
  `instance.js` bot obyektini alohida eksport qiladi — `notify.js` bilan circular import bo'lmasligi uchun.
- `frontend/` — Vite React + Tailwind. Auth va Theme `Context` orqali; API `src/api/axios.js` (token interceptor).

## Modellar
`User` → `Lesson` → `Word` (har biri `createdBy` ref bilan). CRUD egasi yoki admin tomonidan.
`BotUser` — Telegram foydalanuvchisi, ixtiyoriy `user` ref orqali sayt akkauntiga bog'lanadi.

## Bot
- Handlerlar `bot/handlers/`, wizardlar `bot/scenes/`, keyboardlar `bot/keyboards.js` da.
- Admin tekshiruvi `bot/middleware.js` → `isAdmin` (DB flag, sayt roli yoki `BOT_ADMIN_IDS`).
- Controllerdan xabar yuborish: `notifyAdmins` / `notifyUser` (javobni bloklamasin — `.catch(() => {})`).
- `BOT_WEBHOOK_DOMAIN` bo'lsa webhook, aks holda polling.

## Deploy
- Backend + bot: **Railway** (Root Directory `/backend`, region EU West, `backend/railway.json`).
- Baza: **MongoDB Atlas** M0, Frankfurt, IP ruxsati `0.0.0.0/0`.
- Frontend: **Vercel** (Root Directory `frontend`, `frontend/vercel.json` — SPA fallback).
- Produksiyada bot webhook rejimida (`BOT_WEBHOOK_DOMAIN` bor bo'lsa) ishlaydi.
- Live URL'lar va tez-tez uchraydigan xatolar jadvali — `README.md`.
- Lokal backend va produksiya boti bir vaqtda ishlamasin — Telegram 409 beradi.

## Buyruqlar
- Backend: `cd backend && npm run dev` (port 5000, macOS'da 5001), `npm run seed` — test data.
- `npm run db` — o'rnatishsiz lokal MongoDB, `npm run make-admin` — botga admin huquqi.
- Frontend: `cd frontend && npm run dev` (port 5173), `npm run build`, `npm run lint`.
- MongoDB lokalda yo'q — Atlas URI'ni `backend/.env` ga qo'ying.

## Konvensiyalar
- Javob/kommentlar o'zbekcha, texnik atamalar inglizcha.
- `backend/` o'quv maqsadida **batafsil kommentlangan** — yangi kod yozganda ham
  shu uslubni saqlang: har fayl boshida vazifasini tushuntiruvchi JSDoc blok,
  murakkab qatorlarda "nima uchun shunday" izohi.
- Yangi resurs qo'shishda mavjud model/controller/route patternini takrorlang.
- `.env` hech qachon commit qilinmaydi (`.gitignore` da).
