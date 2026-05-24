# Caravan MVP — QA Tayyorgarlik Hisoboti

**Test sanasi:** 2026-05-24
**Loyiha:** Caravan (yuk yetkazib berish platformasi)
**Komponenta:** Backend (Node.js + Express + Sequelize + Socket.io) + Mobile (React Native CLI)
**Backend joylashuvi:** `/Users/macbookair/Desktop/projects/caravan/backend/caravan-backend`
**Mobile joylashuvi:** `/Users/macbookair/Desktop/projects/caravan/mobile/caravan-mobile-cli`
**Backend port:** 5000 (`.env` da `PORT=5000`)

---

## 0. Test metodologiyasi va cheklovlar

### Bajarilgan:
- **Backend:** real `curl` so'rovlari bilan har bir asosiy endpoint sinab ko'rildi (auth, user, driver, load, admin, socket).
- **Mobile:** statik kod ko'rinishi — barcha screenlar o'qib chiqildi, API chaqiruvlari backend bilan solishtirildi.
- **Socket.io:** `socket.io-client` orqali real handshake, event broadcast tekshiruvi.

### Bajarilmagan (cheklov):
- **Mobile UI interaktiv testlari** — emulator/qurilmada tap, swipe, screenshot olib ko'rib bo'lmadi. Bu QA jamoasi tomonidan qo'lda bajarilishi shart.
- **Real SMS yuborish** — backend SMS ni faqat console.log ga yozadi va response da qaytaradi (production muammosi, pastda yozilgan).
- **iOS-ga xos test** — faqat kod ko'rinishi.
- **Yuk hajmi / parallel yuklar / race condition testlari** — bitta foydalanuvchi flow tekshirildi.

---

## 1. UMUMIY XULOSA: MVP HOLATIDA QA GA TAYORMI?

> **JAVOB: Sharti bilan tayyor.** Asosiy oqim (auth → driver/owner ro'yxati → yuk yaratish → yuk topshirish → yetkazib berish) ishlaydi, lekin **MVP'ga to'siq bo'luvchi 5 ta jiddiy xatolik** mavjud (4-bo'lim). Ularni QA ga topshirishdan oldin tuzatish tavsiya etiladi, aks holda QA testerlar to'xtab qoladi.

| Kategoriya | Holat |
|---|---|
| Autentifikatsiya | ✅ Ishlaydi (kichik xavfsizlik kamchiliklari bor) |
| Driver profili + hujjat upload | ✅ Ishlaydi |
| Cargo owner yuk yaratish | ✅ Ishlaydi |
| Yuk lifecycle (assign → finish) | ✅ Ishlaydi (mobil tomonidan to'g'ri parametr yuboriladi) |
| Driver/Owner haqiqiy vaqtli kuzatuv (Socket location broadcast) | ❌ **BUZILGAN** |
| Admin panel (drivers/owners ro'yxati) | ❌ **BUZILGAN** — middleware xatosi |
| Car-type (yuk yaratish uchun zarur) | ⚠️ DB bo'sh — admin tomonidan oldindan to'ldirish kerak |
| Mobile flow yaxlitligi | ⚠️ Bir nechta UX kamchilik |

---

## 2. MVP BLOCKER ХATOLAR (QA dan oldin tuzatilishi shart)

### 2.1 🔴 Admin panel endpointlari butunlay ishlamaydi (Auth middleware uzilgan)

**Joylashuv:** `router/admin/driver.js:9`, `router/admin/owners.js:9`

`admin/driver/*` va `admin/owner/*` routelari faqat `adminMiddleware` ni ishlatadi, lekin uning oldidan `authMiddleware` chaqirilmagan. Natija: `req.user` hech qachon o'rnatilmaydi, `adminMiddleware` har doim `Access denied` qaytaradi.

**Reproduktsiya:**
```bash
# Admin login OK
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+998901112200","password":"admin123"}'
# Token oldim. Endi:
curl http://localhost:5000/api/admin/driver -H "Authorization: Bearer <ADMIN_TOKEN>"
# Javob: {"message":"Access denied"} — har doim
```

**Tuzatish:** Routerga `authMiddleware` ni `adminMiddleware` dan oldin qo'shish:
```js
router.get('/', authMiddleware, adminMiddleware, adminsController.getAllDrivers);
```

**Ta'sir:** Admin frontend (mavjud `front-admin` papka) hech qanday driver yoki cargo owner ma'lumotini ko'ra olmaydi.

---

### 2.2 🔴 Socket.io haydovchi joylashuvi cargo owner ga uzatilmaydi

**Joylashuv:** `http.js:131-147`

```js
const assignment = await Assignment.findOne({ where: { driver_id: driverId } });
// driverId — mobil tomondan keladigan user.id (uuid), lekin Assignment.driver_id — Driver.id (boshqa uuid)
// → Hech qachon topilmaydi

const ownerId = load.owner_id;
// Load modelida `owner_id` maydoni yo'q! Faqat `user_id` bor → undefined
// Keyingi qator: ownerId.toString() crash bo'lishi mumkin
```

**Natija:** Mobile da cargo owner haydovchining xaritada harakatini KO'RA OLMAYDI. Bu MVP'ning asosiy "value proposition" funksiyasini buzadi.

**Reproduktsiya:** Socket testlar (`/tmp/socket_test4.js`) — driver `locationUpdate` emit qiladi, owner hech narsa qabul qilmaydi.

**Tuzatish:**
```js
// 1) driverId → user_id → Driver topish:
const driver = await Driver.findOne({ where: { user_id: driverId } });
const assignment = await Assignment.findOne({
  where: { driver_id: driver.id, assignment_status: { [Op.notIn]: ['delivered'] } }
});
// 2) load.owner_id → load.user_id:
const ownerId = load.user_id;
```

---

### 2.3 🔴 Car-type bazasi bo'sh — yuk yaratish blok bo'ladi

**Joylashuv:** PostgreSQL `CarTypes` jadvali

Yangi o'rnatishda `car-type` yozuvlari yo'q. `GET /api/admin/car-type/get-all` bo'sh array qaytaradi. Cargo owner mobil ilovada yuk yaratish formasini ochsa, "Avtomobil turi" dropdown bo'sh — yuk yaratib bo'lmaydi.

**Tuzatish:** Seed script yoki migration yozish. Hozir admin orqali qo'lda:
```bash
ATOKEN="<admin-token>"
curl -X POST http://localhost:5000/api/admin/car-type/create \
  -H "Authorization: Bearer $ATOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Truck","icon":"truck.png","title":"Truck","max_weight":5000,"dim_x":6,"dim_y":2.4,"dim_z":2.5}'
```

**Tavsiya:** Kamida 3-5 ta standart car-type (Sedan, Pikap, Furgon, Yuk mashinasi, TIR) seed qilish.

---

### 2.4 🔴 Login tasdiqlanmagan foydalanuvchini o'tkazib yuboradi

**Joylashuv:** `controllers/user/userController.js:322` (`login` funksiyasi)

Login funksiyasi `user.user_status` ni umuman tekshirmaydi. Telefonni tasdiqlamagan (status `pending` yoki `confirm_phone`) foydalanuvchi ham JWT token oladi va himoyalangan endpointlardan foydalana boshlaydi.

**Reproduktsiya:**
```bash
# 1. Register initial — status: pending
# 2. SMS verify QILMASDAN login — TOKEN OLAMAN!
curl -X POST http://localhost:5000/api/auth/login \
  -d '{"phone":"+998901112299","password":"Parol123!"}'
# → {"token": "...", ...} muvaffaqiyatli
```

**Tuzatish:** Login da:
```js
if (user.user_status !== 'active') {
  return next(ApiError.badRequest('Telefon raqamingiz tasdiqlanmagan'));
}
```

---

### 2.5 🔴 SMS kod javobda qaytariladi (xavfsizlik teshigi)

**Joylashuv:** `userController.js:182, 249, 469, 504, 622`

Ro'yxatdan o'tish va parol tiklash kodi JSON javobida ochiq qaytariladi:
```json
{"message":"...","smsCode":1111}
```

Production'da bu — istalgan kishi telefon raqamga forgot-password yuborib, javobdan kodni o'qib, parolni almashtirib hisobni qo'lga kiritishi mumkin degani.

**Tuzatish:** Response payload'dan `smsCode`/`code` maydonini olib tashlash; haqiqiy SMS provayder (Eskiz/Playmobile) ulash.

---

## 3. MAJOR (MVP'ni qabul qilinishi mumkin, lekin tez orada tuzatish kerak)

### 3.1 ⚠️ `verify-phone` integer va string'ni teng deb hisoblamaydi
**Joylashuv:** Backend SQL queryda `code` ustun `VARCHAR`, agar JSON da raqam (`{"code": 1111}`) yuborilsa:
> `operator does not exist: character varying = integer`

Mobile string yuboradi → ishlaydi. Lekin API mijozlari uchun bu xato xabari foydasiz. Backenda `String(code)` ga o'rab qo'yish kerak.

### 3.2 ⚠️ Driver yaratilganda `name`, `tex_pas_ser`, `prava_ser`, `prava_num` ga "unknown" yoziladi
**Joylashuv:** `userController.js:293-308`

`verifyPhone` da driver roli uchun avtomatik Driver yozuvi yaratiladi va kerakli maydonlar `"unknown"` qiymati bilan to'ldiriladi. Bu validatsiya'ni o'tib ketadi (chunki keyin yangilash kerak), lekin `getProfile` ushbu xato qiymatlarni front-end ga yuboradi. Mobile esa "Ma'lumotlaringizni to'ldiring" deb ko'rsatishi kerak. Foydalanuvchi UX qatlamida bu yashirilgan, lekin ma'lumotlar bazasi iflos.

### 3.3 ⚠️ `validateName` regex Uzbek kirill alifbosini rad etadi
**Joylashuv:** `utils/index.js:20`
```js
const regex = /^[^\d][a-zA-Z]{2,}$/;
```

`Аҳмад`, `Ўткир`, `Ғафур` — barchasi `Firstname is not valid` xato. O'zbek foydalanuvchilarga mo'ljallangan ilova uchun bu blokerga yaqin.

**Tuzatish:** Regex ni `/^[\p{L}][\p{L}\s'\-]{1,}$/u` yoki o'xshashga o'zgartirish.

### 3.4 ⚠️ `arrived-luggage` va `finish-trip` aniq mos koordinatada ishlamaydi
**Joylashuv:** `driverController.js:507, 719`
```js
if (distance >= 150 || !distance) { ... } // not arrived
```

`!distance` — `distance === 0` bo'lsa, true qaytaradi (operator xatosi). Aslida shart `distance >= 150` bo'lishi kerak (0 — bu manzilda turibsiz degani, OK). Haqiqiy GPS noaniqligi tufayli kamdan-kam holatda bu bag ishga tushadi, lekin testlarda ko'rinadi.

### 3.5 ⚠️ Mobile da `DELETE /api/auth/delete-profile-image` chaqiriladi, backend da yo'q
**Joylashuv:** `mobile/.../OwnerProfile.tsx:228` va `DriverProfile.tsx`

Backend `POST /api/auth/delete-avatar` endpointiga ega. Mobile avatar o'chirishni amalga oshira olmaydi — har doim 404. **Yagona API mos kelmasligi** topildi (qolgan ~42 ta endpoint mos).

**Tuzatish:** Mobile da URL ni `/api/auth/delete-avatar` ga, methodni `POST` ga o'zgartirish, yoki backend da yangi route qo'shish.

### 3.6 ⚠️ Mobile da "Akkountni o'chirish" tugmasi LOGOUT qiladi
**Joylashuv:** `DriverProfile.tsx:350`, `OwnerProfile.tsx` (shu pattern)

Tugma yozuvi "Akkountni o'chirish" lekin `logoutFun()` chaqiradi. Foydalanuvchi hisobini o'chirmoqchi bo'lsa, faqat tizimdan chiqadi va keyin keyingi loginda ma'lumotlari hali ham mavjud. GDPR-da bu jiddiy.

### 3.7 ⚠️ Mobile da deyarli barcha `.catch()` bloklari faqat `console.log` qiladi
Foydalanuvchi xato xabarini ko'rmaydi:
- `AppNavigator.tsx:73` — token check fail bo'lsa, blank screen
- `RegisterSecondScreen.tsx:145` — register complete fail bo'lsa, baribir SMS sahifasiga o'tadi
- `DriverProfile.tsx:138`, `OwnerProfile.tsx:139` — profil yuklanmasa, bo'sh ekran
- `ActiveOrders.tsx:182` — orderlar bo'sh paydo bo'ladi
- `HomeScreen.tsx:151` — active loads bo'sh

QA da bu — "ekran bo'sh, hech narsa ko'rinmayapti" deb bug raport qilinadi.

### 3.8 ⚠️ Driver ishtirok etgan `Load.user_id` xato namespace ishlatilgan
Bir nechta joyda `load.owner_id` deb yozilgan (yuqorida socket bo'limida ko'rdik). Model `user_id` ishlatadi. Kod faqat shartli ravishda ishlaydi.

---

## 4. MINOR (Polish — sprintda yoki keyingi iteratsiyada)

| # | Joy | Tavsif |
|---|---|---|
| 4.1 | Mobile (~120 joy) | Production'ga `console.log()` qoldirilgan, sensitive data (token, user_id) loglanadi |
| 4.2 | `RegisterSecondScreen.tsx:26`, `VerifySmsScreen.tsx:24` | Hardcoded test telefon `'+998 91 234 56 78'` placeholder sifatida ko'rinadi |
| 4.3 | `GetLoadNavigator.tsx:34` | MapBox public token kod ichida — agar private bo'lsa `.env` ga ko'chirish |
| 4.4 | `AddLoad.tsx:190`, `AddLoadSecond.tsx:205`, `AddLoadThird.tsx:284` | Progress bar 30→55→85% (kutilgan 33→66→100%) |
| 4.5 | `HomeScreen.tsx:115-253` | Bir xil `/get-all-active-loads` ni 3 ta `useEffect` da nusxalangan |
| 4.6 | `OwnerProfile.tsx:6`, `DriverProfileEdit.tsx:22` | `launchCamera`, `CameraOptions` import qilingan, lekin ishlatilmagan |
| 4.7 | Mobile state | Redux'da `conut` (typo, kerak: `count`) |
| 4.8 | `Socket/Socket.tsx` | Eski socket implementatsiyasi to'liq commentlangan — o'chirish |
| 4.9 | `LoginScreen.tsx:25` | `Alert` `OK` tugmasi `console.log('OK bosildi')` qiladi |
| 4.10 | `models.js` (Load) | `loading_time` Float deb belgilangan, lekin mobil ISO string yuboradi → DB ga `null` yoziladi |
| 4.11 | Backend (ko'p joyda) | `console.log(70, ...)` — line-number debug logs production'da |
| 4.12 | Routes | `/api/users/profile` (PUT) va `/api/auth/get-profile` (GET) ikkisi ham mavjud — duplikat, biri ortiqcha |
| 4.13 | Backend | `axios` timeout sozlanmagan, slow API → mobil UI muzlaydi |

---

## 5. NIMA YAXSHI ISHLAYDI (Tasdiqlangan)

✅ **Auth flow** — register/initial → register/complete → verify-phone → login zanjirasi to'liq ishlaydi.
✅ **Forgot password** — forgot → verify → reset → login (yangi parol bilan) to'liq ishlaydi.
✅ **JWT token** — 24 soat amal qiladi, `check-token` to'g'ri javob qaytaradi.
✅ **S3 file upload** — profile picture, prava, tex-passport — barchasi `twcstorage.ru` ga yuklanadi va URL qaytaradi.
✅ **Cargo owner yuk yaratish** — barcha maydonlar (origin, destination, stops, dimensions, weight) to'g'ri saqlanadi.
✅ **Driver active loads ro'yxati** — yangi yuk darhol ko'rinadi.
✅ **Yuk assign qilish** — driver bilan load 1-to-1 bog'lanadi, Assignment yozuvi yaratiladi.
✅ **Lifecycle endpoints** — `arring-to-get-load` → `start-loading` → `finish-pickup-load` → `arrived-luggage` → `finish-trip` ketma-ketligi to'g'ri ishlaydi (mobile to'g'ri payload yuborganida).
✅ **Load history** — driver va owner uchun o'tgan yuklar ko'rinadi.
✅ **Load deactivate** — cargo owner faollikdan olishi mumkin.
✅ **Role validatsiya** — driver `/loads/create` ga so'rov yubora olmaydi (403 qaytadi).
✅ **Socket.io connect** — driver/owner identifikatsiyasi to'g'ri ishlaydi, `test_connection` event keladi.
✅ **`created_load` broadcast** — yangi yuk yaratilganda `status: empty` driverlarga real-time notifikatsiya yetadi.
✅ **Batch GPS save** — `load-location-all-save` offline rejimda yig'ilgan koordinatalarni qabul qiladi.
✅ **Car-type CRUD** — admin tomonidan yaratish/o'qish/yangilash/o'chirish ishlaydi.
✅ **Admin register + login** — bcrypt hashing, JWT to'g'ri.

---

## 6. API contract — Mobile vs Backend mosligi

Audit qilindi: **43 ta unique API chaqiruv** mobile da, **81 ta route** backend da.

| Holat | Soni |
|---|---|
| To'liq mos | 42 |
| Mos kelmaydi | 1 (`/api/auth/delete-profile-image`) |
| Mobile chaqirmaydi (server'da bor) | ~38 |

Mos kelmaslik nisbati: **2.3%** — yaxshi natija. Bitta bug 3.5-bo'limda batafsil yozilgan.

---

## 7. QA jamoasiga TEST PLAN takliflari

### 7.1 Smoke test scenariylari (har bir build da)
1. Cargo owner ro'yxatdan o'tish → SMS verify → login → yuk yaratish (admin oldindan car-type qo'shgan bo'lishi kerak)
2. Driver ro'yxatdan o'tish → SMS verify → profil to'ldirish (prava, tex-pas) → online qilish → yuk qabul qilish
3. Driver yuk lifecycle: arring-to-get-load → start-loading → finish-pickup → arrived-luggage → finish-trip
4. Cargo owner active orders va past orders ekranlari to'g'ri ko'rinishi
5. Parolni tiklash flow

### 7.2 Mobil-specific test qilinishi kerak (men test qila olmadim)
- 4 raqamli SMS input auto-advance
- Map orqali pickup/destination tanlash
- Background GPS tracking (app minimized)
- Push notification (`@notifee`) ko'rinishi
- Camera/Gallery permission so'rovi
- Network o'chirilganida UI holati
- Pull-to-refresh

### 7.3 Edge case scenariylari
- Bir vaqtning o'zida 2 ta driver bir loadga assign qilishga harakat qilsa
- SMS kod muddati tugaganida (1 daqiqa)
- JWT token muddati tugaganida (24 soat)
- 10 MB dan katta rasm yuklash
- Cyrillic ism bilan ro'yxatdan o'tish (hozir blok bo'ladi — major bug 3.3)

---

## 8. Production'ga chiqishdan oldin checklist

- [ ] **5.1–5.5 MVP bloker'lar** — barchasi tuzatildi
- [ ] **SMS provayder** ulandi (Eskiz/Playmobile yoki shunga o'xshash)
- [ ] `.env` da `SECRET_KEY` va `SESSION_SECRET` — kuchli random qiymatlar (hozir `"hakunamatata"`)
- [ ] DB seed: `CarType` lar yaratilgan
- [ ] Console.log lar olib tashlangan
- [ ] DB credentials production'ga moslangan (hozir `DB_PASSWORD=1`)
- [ ] CORS sozlamalari production domeni uchun
- [ ] Rate limiting (login, forgot-password)
- [ ] HTTPS / reverse proxy (nginx)
- [ ] Backup strategy DB uchun

---

## 9. Test ma'lumotlari (tekshiruvda yaratilgan)

| Kim | Telefon | Parol | user_id | unique_id |
|---|---|---|---|---|
| Cargo owner | `+998901112299` | `NewParol1!` | `7f9fe45d-4981-42bc-b178-7b0908331d32` | `557187` |
| Driver | `+998931119911` | `Parol123!` | `76657a3e-c3a2-4618-a16c-494697c070b0` | `461974` |
| Admin | `+998901112200` | `admin123` | `7f83f81c-d0fd-400a-96f8-03c56a8e2801` | — |
| CarType | "Truck" | — | `a4802d4e-1751-453e-99da-faf2371843e6` | — |

DB ni reset qilish uchun: `psql -h localhost -U postgres -d caravan-new` → `TRUNCATE Users, Drivers, Loads, Assignments, Locations, "DriverStops", "LoadDetails", "UserRegisters", Notifications CASCADE;`

---

## 10. Yakuniy tavsiya

**MVP'ni QA ga topshirishdan oldin** kamida quyidagilar tuzatilishi tavsiya etiladi:
1. **2.1** — Admin middleware (1 qator o'zgartirish)
2. **2.2** — Socket location broadcast (kichik refaktor)
3. **2.3** — Car-type seed
4. **2.4** — Login `user_status` check
5. **2.5** — SMS kodni response'dan olib tashlash (production uchun)
6. **3.5** — `delete-profile-image` route mosligi
7. **3.6** — "Akkountni o'chirish" tugmasi — endpoint qo'shish yoki tugma matnini "Chiqish 2" ga o'zgartirish

Ushbu 7 ta bandni tuzatishga taxminan **1-2 ish kuni** ketadi. Shundan keyin MVP haqiqatan ham testlashga yaroqli holatda bo'ladi.

Qolgan **MAJOR/MINOR** muammolar QA cycle paytida raport qilinishi va keyingi sprintda hal qilinishi mumkin.
