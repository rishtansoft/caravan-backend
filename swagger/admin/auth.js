/**
 * @swagger
 * components:
 *   schemas:
 *     Admin:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Adminning noyob identifikatori
 *         userid:
 *           type: string
 *           description: Adminning foydalanuvchi identifikatori
 *         phone:
 *           type: string
 *           description: Telefon raqami +998 bilan boshlanishi shart va kiritilishi majburiy
 *           example: "+998901234567"
 *         phone_2:
 *           type: string
 *           description: Qo'shimcha telefon raqami +998 bilan boshlanishi mumkin, ixtiyoriy
 *           example: "+998901234568"
 *         lastname:
 *           type: string
 *           description: Familiya, kiritilishi majburiy va kamida 3 ta belgidan iborat bo'lishi shart
 *           example: "Yusupov"
 *         firstname:
 *           type: string
 *           description: Ism, kiritilishi majburiy va kamida 3 ta belgidan iborat bo'lishi shart
 *           example: "Alisher"
 *         address:
 *           type: string
 *           description: Manzil, kiritilishi ixtiyoriy
 *           example: "Toshkent, Yangi shahar"
 *         role:
 *           type: string
 *           description: Rol, kiritilishi majburiy va "admin" yoki "superadmin" bo'lishi mumkin
 *           enum: [admin, superadmin]
 *           example: "admin"
 *         password:
 *           type: string
 *           description: Parol, kiritilishi majburiy, kamida 4 ta belgidan iborat va raqam hamda harflardan iborat bo'lishi shart
 *           example: "password123"
 *       required:
 *         - userid
 *         - phone
 *         - lastname
 *         - firstname
 *         - role
 *         - password
 * 
 * /admin/register:
 *   post:
 *     summary: Adminni ro'yxatdan o'tkazish
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Admin'
 *     responses:
 *       201:
 *         description: Admin muvaffaqiyatli ro'yxatdan o'tkazildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Kiritilgan ma'lumotlarda xatolik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                       msg:
 *                         type: string
 *                       param:
 *                         type: string
 *                       location:
 *                         type: string
 *       500:
 *         description: Xatolik ro'y berdi
 */

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Adminni tizimga kirishi
 *     tags: [Admin]
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
 *                 description: Parol, kamida 4 ta belgidan iborat bo'lishi shart
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli kirish
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 admin:
 *                   type: object
 *                   $ref: '#/components/schemas/Admin'
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *       400:
 *         description: Kiritilgan ma'lumotlarda xatolik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                       msg:
 *                         type: string
 *                       param:
 *                         type: string
 *                       location:
 *                         type: string
 *       401:
 *         description: Parol noto'g'ri
 *       404:
 *         description: Admin topilmadi
 *       500:
 *         description: Xatolik ro'y berdi
 */
