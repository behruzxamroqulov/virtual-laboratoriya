# Virtual Lab — Talabalar laboratoriya platformasi

Talabalar HTML/CSS/JS loyihalarini yozadigan, xavfsiz sandbox'da sinaydigan, hisobot va kod fayllarini
topshiradigan, ustozlar esa laboratoriyalarni yaratib baholaydigan platforma.

Texnologiyalar: **Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL (Vercel Postgres) + Vercel Blob + Tailwind CSS**.

---

## 1. Asosiy imkoniyatlar

- **Ustoz paneli:** talabalarni yaratish/tahrirlash, laboratoriyalar yaratish (raqam, mavzu, tavsif, topshiriq,
  deadline, holat), talabalarni laboratoriyaga biriktirish, topshiriqlarni ko'rish va baholash (ball + izoh).
- **Talaba kabineti:** biriktirilgan laboratoriyalarni ko'rish, ishchi muhitda (index.html / style.css / script.js)
  kod yozish, **real vaqtli live preview** (brauzerda, serverga so'rovsiz), "Sinash" orqali xavfsiz sandbox'da
  ko'rish, hisobot fayli (docx/pdf/ppt/rasm) yuklash, ishni topshirish.
- **Xavfsiz Virtual Lab preview:** talaba kodi `<iframe sandbox="allow-scripts" srcdoc="...">` ichida, hech qanday
  `allow-same-origin` bermasdan ishga tushadi — shuning uchun u asosiy platforma cookie/session'iga umuman
  kira olmaydi (har doim `null` originda ishlaydi). CSS/JS/rasm fayllari serverda bitta HTML'ga inline qilib
  birlashtiriladi (`src/lib/sandboxBundler.ts`).
- **Real vaqtli resurs monitoring paneli** (`/teacher/monitoring` va har bir sahifa yuqorisidagi kompakt
  indikator): server xotirasi (heap), fayl storage kvotasi va rate-limit keshi holatini har 5 soniyada
  yangilab ko'rsatadi; umumiy resurs sarfi **70%** ga yetganda ko'zga tashlanadigan qizil ogohlantirish chiqadi;
  **"Keshni tozalash"** tugmasi rate-limit keshini bo'shatadi (`src/lib/monitoring.ts`, `src/components/ResourceMonitor.tsx`).
- **Xavfsizlik:** JWT (httpOnly cookie) autentifikatsiya, bcrypt parol hash, rate-limit (brute-force himoyasi),
  fayl turi/hajmi/nomi validatsiyasi (path traversal himoyasi bilan), role-based middleware, qattiq
  Content-Security-Policy sarlavhalari (ayniqsa `/preview/*` uchun).

---

## 2. Loyiha tuzilishi (qisqacha)

```
prisma/schema.prisma        — DB sxemasi (User, Laboratory, Submission, va h.k.)
prisma/seed.ts               — boshlang'ich ustoz hisobini yaratadi
middleware.ts                — route himoyasi (JWT + rol tekshiruvi)
src/lib/                     — auth, db, storage (Vercel Blob), monitoring, sandbox bundler, validatsiya
src/components/              — Sidebar, StatCard, StatusBadge, ResourceMonitor
src/app/login                — kirish sahifasi
src/app/teacher/*             — ustoz paneli (dashboard, talabalar, laboratoriyalar, topshiriqlar, monitoring)
src/app/student/*             — talaba kabineti (dashboard, laboratoriyalar, workspace, topshiriqlarim, profil)
src/app/api/*                 — barcha backend endpointlar
src/app/preview/[id]          — talaba loyihasini xavfsiz ko'rsatuvchi route
```

---

## 3. Mahalliy (local) ishga tushirish

```bash
npm install

cp .env.example .env
# .env faylida DATABASE_URL, BLOB_READ_WRITE_TOKEN, JWT_SECRET qiymatlarini to'ldiring

npx prisma db push       # DB sxemasini yaratish
npm run db:seed          # boshlang'ich ustoz hisobini yaratish (login: ustoz / parol: ustoz1)

npm run dev              # http://localhost:3000
```

> **Eslatma:** `BLOB_READ_WRITE_TOKEN` bo'lmasa fayl yuklash ishlamaydi. Buni olish uchun 5-bo'limga qarang
> (mahalliy rivojlantirish uchun ham Vercel Blob loyihasi kerak bo'ladi, chunki bu xizmat faqat Vercel orqali
> ishlaydi).

---

## 4. Vercelga joylashtirish (deploy)

### 4.1. Ma'lumotlar bazasi va fayl xotirasi ulash

1. Vercel loyihangizga o'ting → **Storage** bo'limi.
2. **Postgres** yarating (Neon asosidagi Vercel Postgres) → loyihaga **Connect** qiling.
   Bu avtomatik ravishda `DATABASE_URL` muhit o'zgaruvchisini qo'shadi.
3. **Blob** storage yarating → loyihaga **Connect** qiling.
   Bu avtomatik ravishda `BLOB_READ_WRITE_TOKEN` ni qo'shadi.

### 4.2. Muhit o'zgaruvchilari (Environment Variables)

Vercel loyiha sozlamalarida (**Settings → Environment Variables**) qo'shing:

| Nomi | Tavsif |
|---|---|
| `JWT_SECRET` | Uzun tasodifiy matn: `openssl rand -base64 48` |
| `SEED_TEACHER_LOGIN` | Boshlang'ich ustoz logini (masalan `ustoz`) |
| `SEED_TEACHER_PASSWORD` | Boshlang'ich ustoz paroli (birinchi kirishdan so'ng albatta almashtiring) |
| `STORAGE_QUOTA_BYTES` | Monitoring panelidagi storage kvotasi (baytlarda, masalan `5368709120` = 5 GB) |

`DATABASE_URL` va `BLOB_READ_WRITE_TOKEN` — 4.1-bandda avtomatik qo'shiladi.

### 4.3. Build sozlamalari

`package.json`dagi `build` skripti avtomatik `prisma generate` ni ham bajaradi, shuning uchun Vercel'da
qo'shimcha sozlash shart emas — **Framework Preset: Next.js** bilan **Deploy** tugmasini bosing.

Birinchi deploy'dan keyin, bazani migratsiya/seed qilish uchun bir marta lokal terminaldan (Vercel'ning
`DATABASE_URL`ini `.env`ga vaqtincha ko'chirib) quyidagini ishga tushiring:

```bash
npx prisma db push
npm run db:seed
```

(Yoki Vercel CLI orqali: `vercel env pull .env` keyin yuqoridagi buyruqlar.)

### 4.4. Domendan foydalanish

Deploy tugagach, Vercel bergan `https://<loyiha>.vercel.app` manzili orqali `ustoz`/belgilagan parolingiz bilan
kiring va birinchi ishda parolni **Talabalar** bo'limi orqali emas, balki to'g'ridan-to'g'ri DB'da yoki keyingi
versiyada qo'shiladigan "ustoz profili" sahifasi orqali almashtirishni unutmang.

---

## 5. Resurs monitoring va kesh haqida (muhim eslatma)

- **Server xotirasi (heap)** — bu ko'rsatkich Vercel'ning **serverless funksiyasi bitta nusxasi** doirasida
  o'lchanadi (`process.memoryUsage()`). Vercel funksiyalari statsiz va ko'p nusxali (scale-out) bo'lgani uchun
  bu qiymat "butun sayt umumiy xotirasi" emas, balki so'rovni qayta ishlayotgan joriy nusxaning holatidir —
  baribir xotira sizib chiqishi (memory leak) yoki keskin o'sishini kuzatish uchun foydali.
- **Fayl storage** — talabalar yuklagan barcha fayllarning DB'da qayd etilgan real hajmi, `STORAGE_QUOTA_BYTES`
  konfiguratsiyasiga nisbatan foiz sifatida hisoblanadi. Bu — "sayt xotirasi to'lib qolmasligi" talabingizga
  mos, amaliy va Vercel arxitekturasida ishlaydigan yechim.
- **Kesh** — hozirda rate-limit (login/upload brute-force himoyasi) xotirada saqlanadi. **"Keshni tozalash"**
  tugmasi shuni bo'shatadi. Katta miqyosda (ko'p bir vaqtdagi foydalanuvchi) ishlatilsa, buni **Vercel KV**
  yoki **Upstash Redis** ga ko'chirish tavsiya etiladi — kod tuzilishi (`src/lib/rateLimit.ts`) buni oson almashtirishga
  moslab yozilgan.
- 70% chegara `src/lib/monitoring.ts` faylidagi `overallPercent >= 70` shartida — xohlasangiz bu qiymatni
  osongina o'zgartirishingiz mumkin.

---

## 6. Keyingi rivojlantirish uchun tavsiyalar (hujjatda bor, hozircha MVP'ga kiritilmagan)

- Monaco Editor / CodeMirror bilan sintaksis rangini qo'shish (hozir oddiy `<textarea>` ishlatilgan).
- Plagiat aniqlash tizimi.
- Telegram/email orqali bildirishnomalar.
- Ustozning o'z profilida parolni UI orqali almashtirishi (hozircha talabalar uchun mavjud, ustoz uchun DB
  orqali yoki keyingi iteratsiyada qo'shiladi).
- Vercel KV/Redis asosidagi to'liq masshtablanuvchi rate-limit va kesh.

---

## 7. Xavfsizlik bo'yicha qisqacha izoh

- Parollar **bcrypt** (cost 12) bilan xeshlanadi, hech qachon ochiq matnda saqlanmaydi.
- Sessiyalar **httpOnly, sameSite=lax** cookie'dagi JWT orqali (8 soat amal qiladi).
- Barcha fayllar **kengaytma + MIME turi + hajm** bo'yicha tekshiriladi, fayl nomlarida path traversal
  (`..`, `/`, `\`) bloklanadi, va Vercel Blob'da **random kalit** bilan saqlanadi (original fayl nomi orqali
  hujum qilib bo'lmaydi).
- Talaba kodi hech qachon to'g'ridan-to'g'ri asosiy domenda ishlamaydi — faqat `sandbox="allow-scripts"`
  (allow-same-origin'siz) `srcdoc` orqali, alohida qattiq CSP bilan.
