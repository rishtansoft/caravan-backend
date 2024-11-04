const Admin = require("../../models/admin");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const ApiError = require("../../error/ApiError");

class AdminController {
    validateRegistrationFields() {
        return [
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
    }

    validateLoginFields() {
        return [
            body('phone')
                .exists().withMessage('Telefon raqami kiritilishi shart')
                .isString().withMessage('Telefon raqami matn ko\'rinishida bo\'lishi kerak')
                .matches(/^\+998[0-9]{9}$/).withMessage('Telefon raqami O\'zbekiston formatida bo\'lishi kerak'),

            body('password')
                .exists().withMessage('Parol kiritilishi shart')
                .isLength({ min: 4 }).withMessage('Parol kamida 4 ta belgidan iborat bo\'lishi shart')
        ];
    }

    async validateAdmin(phone) {
        const admin = await Admin.findOne({ where: { phone } });
        if (!admin) {
            throw ApiError.badRequest("Admin topilmadi");
        }
        return admin;
    }

    async validatePassword(password, hashedPassword) {
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) {
            throw ApiError.badRequest("Parol noto'g'ri");
        }
    }

    async loginAdmin(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(ApiError.badRequest("Validation error", errors.array()));
            }

            const { phone, password } = req.body;

            // Validate admin exists
            const admin = await this.validateAdmin(phone);

            // Validate password
            await this.validatePassword(password, admin.password);

            // Create JWT token
            const token = jwt.sign(
                { id: admin.id, phone: admin.phone, role: admin.role }, 
                process.env.SECRET_KEY, 
                { expiresIn: '1h' }
            );

            return res.json({ 
                message: "Muvaffaqiyatli kirish", 
                id: admin.id, 
                token 
            });

        } catch (error) {
            console.error(error);
            return next(
                error instanceof ApiError 
                    ? error 
                    : ApiError.internal("Login jarayonida xatolik: " + error.message)
            );
        }
    }

    async registerAdmin(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(ApiError.badRequest("Validation error", errors.array()));
            }

            const { phone, phone_2, lastname, firstname, address, role, password } = req.body;

            // Check if admin already exists
            const existingAdmin = await Admin.findOne({ where: { phone } });
            console.log(Admin);
            
            if (existingAdmin) {
                return next(ApiError.badRequest("Bu telefon raqami bilan admin allaqachon mavjud"));
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create admin
            const newAdmin = await Admin.create({
                phone,
                phone_2,
                lastname,
                firstname,
                address,
                password: hashedPassword,
                role
            });

            return res.status(201).json({
                message: "Admin muvaffaqiyatli ro'yxatdan o'tkazildi",
                id: newAdmin.id
            });

        } catch (error) {
            console.error(error);
            return next(
                error instanceof ApiError 
                    ? error 
                    : ApiError.internal("Adminni ro'yxatdan o'tkazishda xatolik: " + error.message)
            );
        }
    }
}

const adminController = new AdminController();

module.exports = {
    adminController,
    validateRegistrationFields: adminController.validateRegistrationFields(),
    validateLoginFields: adminController.validateLoginFields()
};