# MVP Action Plan — Caravan

**Maqsad:** Loyihani 100% MVP holatiga keltirib QA jamoasiga topshirish.
**Sana:** 2026-05-24
**Eslatma:** SMS provayder (Eskiz/Playmobile) keyingi bosqichda ulanadi. Hozircha SMS kodi development logikasi saqlanadi, lekin response'dan olib tashlanadi.

---

## Bosqich 1 — Backend Critical Fixes (MVP Blocker'lar)

Bularsiz tizim ishlamaydi. Boshqa hech narsadan oldin shu 4 ta tuzatilishi shart.

### 1.1. Admin panel auth'ni tiklash
**Fayl:** `router/admin/driver.js`, `router/admin/owners.js`
**Muammo:** `authMiddleware` chaqirilmagan → `req.user` undefined → har doim "Access denied".
**Tuzatish:** Har bir admin route'da `authMiddleware`ni `adminMiddleware`dan oldin qo'shish.

```js
const authMiddleware = require('../../middleware/authMiddleware');
const adminMiddleware = require('../../middleware/adminAuthMiddleware');

router.get('/', authMiddleware, adminMiddleware, adminsController.getAllDrivers);
// barcha admin route'larga shu naqsh
```

**Tekshirish:** Admin token bilan `GET /api/admin/driver/` chaqirib, 200 + driverlar ro'yxati qaytishini ko'rish.

---

### 1.2. Socket location broadcast'ni tuzatish
**Fayl:** `http.js:120-155`
**Muammo:**
- `Assignment.findOne({ where: { driver_id: driverId } })` — mobil `user.id` yuboradi, lekin `Assignment.driver_id` — bu `Driver.id` (PK).
- `load.owner_id` — Load modelida bunday maydon yo'q, `load.user_id` ishlatilishi kerak.

**Tuzatish:**
```js
socket.on('locationUpdate', async (data) => {
  const { driverId, latitude, longitude } = data; // driverId = user.id

  // Driver topish (user_id orqali)
  const driver = await Driver.findOne({ where: { user_id: driverId } });
  if (!driver) return;

  // Aktiv assignment topish
  const assignment = await Assignment.findOne({
    where: { driver_id: driver.id, status: ['in_transit_get_load','arrived_picked_up','picked_up','in_transit'] }
  });
  if (!assignment) return;

  const load = await Load.findByPk(assignment.load_id);
  if (!load) return;

  // owner_id emas, user_id
  io.to(`owner_${load.user_id}`).emit('driverLocationUpdated', {
    loadId: load.id, driverId, latitude, longitude
  });
});
```

**Tekshirish:** Driver mobil socket orqali koordinata yuboradi, owner mobil xaritada nuqta yangilanishini ko'radi. (Bu MVP'ning eng asosiy value prop'i.)

---

### 1.3. CarTypes jadvalini to'ldirish
**Muammo:** Bo'sh dropdown → owner yuk yarata olmaydi.
**Tuzatish:** `scripts/seedCarTypes.js` yaratish va admin orqali yoki npm script orqali ishga tushirish.

Minimal seed:
| Nomi | Max og'irlik (kg) | O'lcham (m) |
|---|---|---|
| Sedan | 500 | 1.2 × 1.0 × 0.6 |
| Pikap | 1000 | 2.5 × 1.6 × 0.8 |
| Furgon | 2000 | 3.5 × 1.8 × 1.9 |
| Yuk mashinasi (5t) | 5000 | 6.0 × 2.4 × 2.5 |
| TIR | 20000 | 13.6 × 2.45 × 2.7 |

**Tekshirish:** `GET /api/admin/car-type/` — 5 ta yozuv qaytishi kerak.

---

### 1.4. Login `user_status` tekshiruvi
**Fayl:** `controllers/user/userController.js:322` (login funksiyasi)
**Muammo:** Telefoni tasdiqlanmagan (`pending`, `confirm_phone`) foydalanuvchi ham token oladi.
**Tuzatish:** Parol tekshiruvidan keyin qo'shish:

```js
if (user.user_status !== 'active') {
  return next(ApiError.badRequest('Telefon raqamingiz tasdiqlanmagan. Iltimos, ro\'yxatdan o\'tishni yakunlang.'));
}
```

**Tekshirish:** Yangi register qilingan (lekin SMS tasdiqlanmagan) foydalanuvchi login qila olmasligi kerak.

---

## Bosqich 2 — Backend Major Fixes

### 2.1. `arrived-luggage` / `finish-trip` distance bug
**Fayl:** `controllers/driver/driverController.js:507`, `:719`
**Muammo:** `if (distance >= 150 || !distance)` — distance=0 bo'lsa `!0===true` → "yetib kelmadingiz" qaytaradi.
**Tuzatish:**
```js
if (distance === null || distance === undefined || distance >= 150) {
  return next(ApiError.badRequest('Siz hali manzilga yetib kelmadingiz'));
}
```

### 2.2. Load `loading_time` schema
**Fayl:** `models/models.js` (Load modeli)
**Muammo:** Float deb belgilangan, mobil ISO datetime string yuboradi → DB ga `null` yoziladi.
**Tuzatish:** `loading_time: DataTypes.DATE` ga o'zgartirish + migratsiya.

### 2.3. `verify-phone` code tipini robust qilish
**Fayl:** `controllers/user/userController.js` (verifyPhone)
**Tuzatish:** Solishtirishdan oldin `String(code)` bilan o'rab qo'yish — kelajakda integer yuborilsa ham ishlasin.

---

## Bosqich 3 — Mobile-Backend API Mos kelishi

### 3.1. Avatar o'chirish
**Mobil:** `OwnerProfile.tsx:228` `DELETE /api/auth/delete-profile-image` chaqiradi.
**Backend:** Faqat `POST /api/auth/delete-avatar` mavjud.
**Tanlov (bittasini qil):**
- **A variant (tezroq):** Mobilda chaqiruvni `POST /api/auth/delete-avatar` ga o'zgartirish.
- **B variant:** Backend'da `DELETE /api/auth/delete-profile-image` route qo'shib, eski controllerga yo'naltirish.

Tavsiya: **A variant** — mobil tarafda 1 qator o'zgartirish.

### 3.2. Akkountni o'chirish (delete account)
**Mobil:** `DriverProfile.tsx:350`, `OwnerProfile.tsx` — "Akkountni o'chirish" tugmasi `logoutFun()` chaqiradi. Backend'da endpoint yo'q. **GDPR muammo.**
**Tuzatish:** Yangi endpoint `DELETE /api/auth/delete-account`:
- Token orqali `user.id` olish
- Driver/Assignment/Load larni soft delete yoki cascade
- Users dan o'chirish (yoki `deleted_at` qo'shish)
- Mobilda tugmani shu endpointga ulash

---

## Bosqich 4 — Mobile UX Critical

### 4.1. Silent catch'larni tuzatish
**Fayllar:** `AppNavigator.tsx:73`, `RegisterSecondScreen.tsx:145`, `DriverProfile.tsx:138`, `OwnerProfile.tsx:139`, `ActiveOrders.tsx:182`, `HomeScreen.tsx:151`, `Socket/index.tsx`.
**Muammo:** Xato yuz bersa foydalanuvchi bilmaydi — bo'sh ekran yoki noto'g'ri navigatsiya.
**Tuzatish:** Har bir `.catch` ichida `Alert.alert('Xato', err?.response?.data?.message || 'Xatolik yuz berdi')` chaqirish. `AppNavigator` check-token fail bo'lsa login'ga yo'naltirish.

### 4.2. Hardcoded telefon placeholder
**Fayllar:** `VerifySmsScreen.tsx:24`, `RegisterSecondScreen.tsx:26`
**Tuzatish:** `useState('')` qilib, `placeholder="+998 91 234 56 78"` prop'iga ko'chirish.

### 4.3. Redux state typo
**Fayl:** `app/store/UserData.ts`
**Tuzatish:** `conut` → `count` (qaysi joylarda ishlatilgan bo'lsa hammasini almashtirish).

### 4.4. AppNavigator check-token fallback
**Fayl:** `AppNavigator.tsx:73-79`
**Tuzatish:** Token tekshiruv fail bo'lsa yoki 401 qaytsa — `AsyncStorage` tozalash + Login screen'ga yo'naltirish.

---

## Bosqich 5 — Security Cleanup

### 5.1. SMS kodlarni response'dan olib tashlash
**Fayl:** `controllers/user/userController.js:182, 249, 469, 504, 622`
**Muammo:** Production'da forgot-password orqali istalgan kishi hisobni qo'lga kiritishi mumkin.
**Tuzatish (SMS ulanmaguncha vaqtinchalik yechim):**
- JSON response'dan `smsCode` / `code` maydonlarini olib tashlash.
- Development'da `console.log('[DEV] SMS kod:', code)` qoldirish — tester serverlarga loglardan ko'rib turadi.
- `.env` ga `NODE_ENV=development` qo'yish, agar `production` bo'lsa hatto log ham chiqmasin.

**Eslatma:** Haqiqiy SMS provayder (Eskiz/Playmobile) ulanganda shu yerga `smsService.send(phone, code)` chaqiruvini qo'shish kerak.

### 5.2. MapBox kalit `.env` ga
**Fayl:** `mobile/.../GetLoadNavigator.tsx:34`
**Tuzatish:** Agar token **public** (pk.) bo'lsa qoldirish mumkin, lekin yaxshisi `react-native-config` orqali `.env` dan o'qish. Agar **private** (sk.) bo'lsa — DARROV `.env` ga ko'chirish + git history'dan tozalash.

### 5.3. JWT secret tekshiruvi
**Fayl:** `.env`
`SECRET_KEY=hakunamatata` — production'ga chiqarishdan oldin random 256-bit string bilan almashtirish:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Bosqich 6 — Validation & Localization

### 6.1. `validateName` regex — Cyrillic Uzbek qabul qilish
**Fayl:** `utils/index.js:19`
**Hozir:** `/^[^\d][a-zA-Z]{2,}$/` — "Аҳмад" rad qilinadi.
**Tuzatish:** `/^[^\d][a-zA-ZЀ-ӿʼ'\- ]{2,}$/u` — lotin + kirill + apostrof + chiziqcha.

### 6.2. Driver auto-create "unknown" tozalash
**Fayl:** `controllers/user/userController.js:293-308`
**Muammo:** Verify-phone'da driver uchun Driver row "unknown" string bilan to'liq yaratiladi → validatsiya bypass.
**Tuzatish:** Bo'sh Driver row yaratmaslik, `null` bo'sh maydonlar bilan yaratish (model'da `allowNull: true` qilish) yoki umuman yaratmaslik — birinchi `driver-info` so'rovida yaratish.

---

## Bosqich 7 — Pre-QA Sanity Checks

### 7.1. DB tozalash va seed
```bash
# 1. DB ni tozalash
psql -h localhost -U postgres -d caravan-new -c \
'TRUNCATE "Users","Drivers","Loads","Assignments","Locations","DriverStops","LoadDetails","UserRegisters","Notifications","CarTypes" CASCADE;'

# 2. CarTypes seed
node scripts/seedCarTypes.js

# 3. Admin yaratish (qo'lda yoki seed)
```

### 7.2. End-to-End smoke test
QA topshirishdan oldin shu ssenariyni o'zimiz o'tishimiz kerak:
1. Cargo owner ro'yxatdan o'tadi → SMS kodi log'dan olinadi → tasdiqlaydi → login qiladi.
2. Driver ro'yxatdan o'tadi → SMS tasdiqlaydi → driver-info to'ldiradi → login qiladi.
3. Owner yuk yaratadi (3 bosqich).
4. Driver yangi yuk haqida socket orqali xabar oladi.
5. Driver yukni qabul qiladi → in_transit_get_load.
6. Driver "manzilga yetdim" → arrived_picked_up.
7. Driver "yukni oldim" → picked_up.
8. Driver "yetkazib berildi" → delivered.
9. **Eng muhim:** Owner xaritada driver harakatini real-time ko'radi.
10. Admin paneldan driver va owner ro'yxatini ochish.

### 7.3. Production checklist
- [ ] `.env` da `NODE_ENV=production`
- [ ] `SECRET_KEY` random
- [ ] DB backup avtomatlashtirilgan
- [ ] PM2 yoki systemd bilan serverga deploy
- [ ] HTTPS (nginx + Let's Encrypt)
- [ ] CORS faqat mobil bundleID/domen uchun ochiq
- [ ] Rate limiting (`express-rate-limit`) — kamida `/auth/*` route'larida
- [ ] Logging (`winston` yoki `pino`) — fayl + log rotation

---

## Bajarish tartibi va vaqt baholash

| Bosqich | Vazifa | Vaqt | Kim |
|---|---|---|---|
| 1.1 | Admin middleware | 15 daq | Backend |
| 1.2 | Socket fix | 1 soat | Backend |
| 1.3 | CarType seed | 30 daq | Backend |
| 1.4 | Login status check | 15 daq | Backend |
| 2.1 | Distance bug | 15 daq | Backend |
| 2.2 | loading_time schema + migration | 30 daq | Backend |
| 2.3 | verify-phone String cast | 5 daq | Backend |
| 3.1 | Avatar endpoint mos qilish | 15 daq | Mobile |
| 3.2 | delete-account endpoint | 1.5 soat | Backend + Mobile |
| 4.1 | Silent catch'lar | 2 soat | Mobile |
| 4.2 | Placeholder | 10 daq | Mobile |
| 4.3 | `conut` typo | 15 daq | Mobile |
| 4.4 | check-token fallback | 30 daq | Mobile |
| 5.1 | SMS code response'dan olib tashlash | 30 daq | Backend |
| 5.2 | MapBox `.env` | 20 daq | Mobile |
| 5.3 | JWT secret | 5 daq | DevOps |
| 6.1 | Name regex | 10 daq | Backend |
| 6.2 | Driver auto-create | 30 daq | Backend |
| 7.* | Smoke test + checklist | 2 soat | Hammasi |

**Jami:** ~12-14 soat ish (1.5 ish kuni 2 odam bilan).

---

## Keyingi bosqich (MVP'dan keyin — REGRESSIONga kiritmaslik)

Bu yerda MVP uchun shart emas, lekin keyin qilinishi kerak bo'lgan ishlar:

- **SMS provayder ulash** (Eskiz/Playmobile) — Bosqich 5.1 dagi log o'rniga real send.
- **Push notification** (FCM) — driver yangi yuk uchun.
- **i18n** (rus tili) — mobil app uchun.
- **Test suite** — Jest backend + Detox mobil.
- **CI/CD** — GitHub Actions.
- **Telegram bot integratsiya** (TELEGRAM_BOT_TOKEN allaqachon `.env` da).
- **Soft delete** — Users uchun `deleted_at`.
- **Payment** — yuk yetkazilgandan keyin to'lov flow'i.

---

## Yakuniy mezon (MVP "Done" deb hisoblash uchun)

✅ Yuqoridagi Bosqich 1-7 to'liq bajarilgan.
✅ End-to-end smoke test 10/10 muvaffaqiyatli o'tgan.
✅ `QA_REPORT.md` dagi 5 ta MVP blocker yopilgan.
✅ Yangi qisqa regression report (`MVP_DONE.md`) yozilgan.
✅ Production server'da deploy qilingan va QA jamoasi access ola olgan.
