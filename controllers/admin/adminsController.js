const Admin = require("../../models/admin");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const ApiError = require("../../error/ApiError");

class AdminsController {


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
            console.log("ss ");
            
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
                    : ApiError.internal("Adminni ro'yxatdan o'tkazishda xatolik....: " + error.message)
            );
        }
    }

    async updateAdmin (req, res, next) {
        try {
            const adminId = req.query.id;  // Access the ID from the query string
            const { firstname, lastname, phone, phone_2, address, email, password } = req.body;
            console.log(adminId);

            const allAdmins = await Admin.findAll({ attributes: ['id', 'firstname', 'lastname', 'phone'] });
            console.log("All Admins:", allAdmins);  // Log all admins for verification


            if (!adminId) {
                return next(ApiError.badRequest('Admin ID is required'));
            }

            // Fetch the admin details
            const admin = await Admin.findByPk(adminId);
            if (!admin) return next(ApiError.notFound('Admin not found'));

            const hashedPassword = password ? await bcrypt.hash(password, 10) : admin.password;
            await admin.update({ firstname, lastname, phone, phone_2, address, email, password: hashedPassword });

            return res.json({ message: "Admin ma'lumotlari yangilandi", id: admin.id });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Admin ma'lumotlarini yangilashda xatolik: " + error.message));
        }
    };

    async getAdminProfile (req, res, next)  {
        try {
            const admin = await Admin.findByPk(req.user.id, {
                attributes: ['id', 'firstname', 'lastname', 'phone', 'phone_2', 'address', 'email']
            });
            if (!admin) return next(ApiError.notFound('Admin not found'));

            return res.json(admin);
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Admin profilini olishda xatolik: " + error.message));
        } 
    }

    async updateAdminPassword (req, res, next) {
        try {
            const { oldPassword, newPassword } = req.body;

            // Password update logic
            const admin = await Admin.findByPk(req.user.id);
            if (!admin) return next(ApiError.notFound('Admin not found'));

            const isMatch = await bcrypt.compare(oldPassword, admin.password);
            if (!isMatch) return next(ApiError.badRequest('Old password is incorrect'));

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await admin.update({ password: hashedPassword });

            return res.json({ message: "Parol yangilandi" });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Parolni yangilashda xatolik: " + error.message));
        }
    }
}

module.exports = new AdminsController();
