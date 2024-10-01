// controllers/admin/authController.js
const Admin = require("../../models/admin");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

// Adminni ro'yxatdan o'tkazish uchun validationlar
const validateAdminRegistration = [
    body("phone")
        .exists().withMessage("Telefon raqami kiritilishi shart")
        .matches(/^\+998[1-9]\d{8}$/).withMessage("Telefon raqami +998 bilan boshlanishi shart"),

    body("phone_2")
        .optional()
        .matches(/^\+998[1-9]\d{8}$/).withMessage("Qo'shimcha telefon raqami +998 bilan boshlanishi shart"),

    body("lastname")
        .exists().withMessage("Familiya kiritilishi shart")
        .isLength({ min: 3 }).withMessage("Familiya kamida 3 belgidan iborat bo'lishi shart"),

    body("firstname")
        .exists().withMessage("Ism kiritilishi shart")
        .isLength({ min: 3 }).withMessage("Ism kamida 3 belgidan iborat bo'lishi shart"),

    body("address")
        .optional(),

    body("role")
        .exists().withMessage("Rol kiritilishi shart")
        .isIn(["admin", "superadmin"]).withMessage("Rol faqat 'admin' yoki 'superadmin' bo'lishi mumkin"),

    body("password")
        .exists().withMessage("Parol kiritilishi shart")
        .isLength({ min: 4 }).withMessage("Parol kamida 4 belgidan iborat bo'lishi shart")
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/).withMessage("Parol raqam va harflardan iborat bo'lishi shart")
];

// Adminni ro'yxatdan o'tkazish funksiyasi
const registerAdmin = async (req, res) => {
    // Validatsiyani tekshirish
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { phone, phone_2, lastname, firstname, address, role, password } = req.body;

    try {
        // Parolni shaxta qilish
        const hashedPassword = await bcrypt.hash(password, 10);

        // Adminni yaratish
        const newAdmin = await Admin.create({
            phone,
            phone_2,
            lastname,
            firstname,
            address,
            password: hashedPassword, // Shaxtalangan parolni saqlash
            role
        });

        return res.status(201).json({
            message: "Admin muvaffaqiyatli ro'yxatdan o'tkazildi",
            admin: newAdmin,
        });
    } catch (error) {
        console.error("Adminni ro'yxatdan o'tkazishda xatolik:", error);
        return res.status(500).json({
            message: "Adminni ro'yxatdan o'tkazishda xatolik",
            error: error.message,
        });
    }
};

// Admin login funksiyasi
const loginAdminValidation = [
    body('phone')
        .exists().withMessage('Telefon raqami kiritilishi shart')
        .isString().withMessage('Telefon raqami matn ko\'rinishida bo\'lishi kerak')
        .matches(/^\+998[0-9]{9}$/).withMessage('Telefon raqami O\'zbekiston formatida bo\'lishi kerak'),

    body('password')
        .exists().withMessage('Parol kiritilishi shart')
        .isLength({ min: 4 }).withMessage('Parol kamida 4 ta belgidan iborat bo\'lishi shart'),
];

const loginAdmin = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password } = req.body;

    try {
        const admin = await Admin.findOne({ where: { phone } });

        if (!admin) {
            return res.status(404).json({ message: "Admin topilmadi" });
        }

        const isMatch = await bcrypt.compare(password, admin.password); // Parolni taqqoslash
        if (!isMatch) {
            return res.status(401).json({ message: "Parol noto'g'ri" });
        }

        // JWT token yaratish
        const token = jwt.sign({ id: admin.id, phone: admin.phone, role: admin.role }, process.env.SECRET_KEY, { expiresIn: '1h' });

        // Successful login
        res.status(200).json({ message: "Muvaffaqiyatli kirish", admin, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Xatolik ro'y berdi" });
    }
};

module.exports = {
    registerAdmin,
    loginAdmin,
    validateAdminRegistration,
    loginAdminValidation
};
