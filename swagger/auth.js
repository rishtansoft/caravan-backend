/**
 * @swagger
 * components:
 *   schemas:
 *     Register:
 *       type: object
 *       required:
 *         - firstname
 *         - lastname
 *         - phone
 *         - password
 *         - role
 *       properties:
 *         firstname:
 *           type: string
 *           description: Foydalanuvchi ismi
 *         lastname:
 *           type: string
 *           description: Foydalanuvchi familiyasi
 *         phone:
 *           type: string
 *           description: Foydalanuvchi telefon raqami
 *         password:
 *           type: string
 *           description: Foydalanuvchi paroli
 *         role:
 *           type: string
 *           enum: [driver, cargo_owner]
 *           description: Foydalanuvchi roli
 *       example:
 *         firstname: "John"
 *         lastname: "Doe"
 *         phone: "+998901234567"
 *         password: "password123"
 *         role: "cargo_owner"
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Foydalanuvchini ro'yxatdan o'tkazish
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Register'
 *     responses:
 *       201:
 *         description: Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi
 *                 token:
 *                   type: string
 *                   example: "jwt_token"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstname:
 *                       type: string
 *                     lastname:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Telefon raqami allaqachon mavjud
 *       500:
 *         description: Serverda xatolik yuz berdi
 */
