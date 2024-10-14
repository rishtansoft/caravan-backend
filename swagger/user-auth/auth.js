
/**
 * @swagger
 * /user/initial-registration:
 *   post:
 *     summary: Foydalanuvchining boshlang'ich ro'yxatdan o'tish jarayoni
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Telefon raqami, O'zbekiston formatida kiritilishi shart
 *                 example: "+998901234567"
 *               password:
 *                 type: string
 *                 description: Parol, kamida 4 ta belgidan iborat va raqam hamda harf bo'lishi shart
 *                 example: "password123"
 *               password_rep:
 *                 type: string
 *                 description: Parolni tasdiqlash, parol bilan bir xil bo'lishi shart
 *                 example: "password123"
 *               lastname:
 *                 type: string
 *                 description: Foydalanuvchining familiyasi, kamida 3 ta belgidan iborat bo'lishi shart
 *                 example: "Kamolov"
 *               firstname:
 *                 type: string
 *                 description: Foydalanuvchining ismi, kamida 3 ta belgidan iborat bo'lishi shart
 *                 example: "Ibrohim"
 *     responses:
 *       200:
 *         description: Boshlang'ich ro'yxatdan o'tish muvaffaqiyatli
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Ro'yxatdan o'tish muvaffaqiyatli tugallandi
 *                   example: "Initial registration successful. Please complete your profile."
 *       400:
 *         description: So'rovdagi xatoliklar (validatsiya yoki mos kelmaydigan parol)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Xatolik haqida ma'lumot
 *                   example: "Lastname was not entered"
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Xatolik haqida ma'lumot
 *                   example: "User registration error"
 */

/**
 * @swagger
 * /user/complete-registration:
 *   post:
 *     summary: Ro'yxatni to'liq tugallash (Foydalanuvchi registratsiyasini davom ettirish)
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone_2:
 *                 type: string
 *                 description: Qo'shimcha telefon raqami (kiritilishi ixtiyoriy)
 *                 example: "+998901234568"
 *               birthday:
 *                 type: string
 *                 description: Tug'ilgan sana, YYYY-MM-DD formatida
 *                 example: "1995-05-15"
 *               role:
 *                 type: string
 *                 description: Foydalanuvchi roli ("driver" yoki boshqa rol)
 *                 example: "driver"
 *     responses:
 *       200:
 *         description: Ro'yxatdan o'tish muvaffaqiyatli tugallandi va telefon tasdiqlanishi kutilmoqda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Muvaffaqiyatli tugallanganlik haqida xabar
 *                   example: "Registration complete. Please verify your phone number."
 *                 user_id:
 *                   type: string
 *                   description: Foydalanuvchining noyob identifikatori
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 smsCode:
 *                   type: string
 *                   description: Telefon raqamini tasdiqlash uchun yuborilgan SMS kodi
 *                   example: "123456"
 *       400:
 *         description: So'rovdagi xatoliklar (masalan, noto'g'ri telefon raqami yoki majburiy maydonlar yo'qligi)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Xatolik haqida ma'lumot
 *                   example: "role was not entered"
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Xatolik haqida ma'lumot
 *                   example: "User registration error"
 */

/**
 * @swagger
 * /user/verify-phone:
 *   post:
 *     summary: Telefon raqamini tasdiqlash
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: Foydalanuvchining noyob identifikatori
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               code:
 *                 type: string
 *                 description: Foydalanuvchiga yuborilgan SMS kodi
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Telefon raqami muvaffaqiyatli tasdiqlandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Tasdiqlash muvaffaqiyatli tugallandi
 *                   example: "Phone number verified successfully. You can now log in."
 *       400:
 *         description: Xatoliklar (foydalanuvchi topilmadi yoki kod noto'g'ri)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Xatolik haqida ma'lumot
 *                   example: "Invalid or expired verification code"
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Xatolik haqida ma'lumot
 *                   example: "Phone verification error"
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Foydalanuvchini tizimga kirish
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Foydalanuvchining telefon raqami
 *                 example: "+998901234567"
 *               password:
 *                 type: string
 *                 description: Foydalanuvchining paroli
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli tizimga kirildi va token qaytarildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user_id:
 *                   type: integer
 *                   description: Foydalanuvchining noyob identifikatori (ID)
 *                   example: 1
 *                 role:
 *                   type: string
 *                   description: Foydalanuvchining roli
 *                   example: "admin"
 *       400:
 *         description: Foydalanuvchi topilmadi yoki parol noto'g'ri
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Xatolik haqida ma'lumot
 *                   example: "User not found" | "Invalid password"
 *       500:
 *         description: Serverdagi xatolik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Serverdagi xatolik haqida ma'lumot
 *                   example: "Login error: {error_message}"
 */
