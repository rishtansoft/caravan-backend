const Admin = require("../../models/admin");
const { Users, Driver, Assignment, Load, CarType } = require("../../models/index");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const ApiError = require("../../error/ApiError");

class AdminsController {

    async updateAdmin(req, res, next) {
        try {
            const adminId = req.query.id;
            const { firstname, lastname, phone, phone_2, address, email, password } = req.body;

            if (!adminId) {
                return next(ApiError.badRequest('Admin ID is required'));
            }

            const admin = await Admin.findByPk(adminId);
            if (!admin) return next(ApiError.notFound('Admin not found'));

            const hashedPassword = password ? await bcrypt.hash(password, 10) : admin.password;
            await admin.update({ firstname, lastname, phone, phone_2, address, email, password: hashedPassword });

            return res.json({ message: "Admin ma'lumotlari yangilandi", id: admin.id });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Admin ma'lumotlarini yangilashda xatolik: " + error.message));
        }
    }

    async getAdminProfile(req, res, next) {
        try {
            const admin = await Admin.findByPk(req.params.id, {
                attributes: ['id', 'firstname', 'lastname', 'phone', 'phone_2', 'address', 'role']
            });
            if (!admin) return next(ApiError.notFound('Admin not found'));
            return res.json(admin);
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Error retrieving admin profile: " + error.message));
        }
    }

    async getMe(req, res, next) {
        try {
            const admin = await Admin.findByPk(req.user.id, {
                attributes: ['id', 'firstname', 'lastname', 'phone', 'phone_2', 'address', 'role']
            });
            if (!admin) return next(ApiError.notFound('Admin not found'));
            return res.json(admin);
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Error retrieving current admin: " + error.message));
        }
    }

    async updateAdminPassword(req, res, next) {
        try {
            const { oldPassword, newPassword } = req.body;
            const admin = await Admin.findByPk(req.params.id);
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

    async getAllAdmins(req, res, next) {
        try {
            const admins = await Admin.findAll({
                attributes: ['id', 'firstname', 'lastname', 'phone', 'phone_2', 'address', 'role', 'createdAt'],
                order: [['createdAt', 'DESC']]
            });
            return res.json({ data: admins });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Adminlar ro'yxatini olishda xatolik: " + error.message));
        }
    }

    async deleteAdmin(req, res, next) {
        try {
            const { adminId } = req.params;
            if (adminId === req.user.id) {
                return next(ApiError.badRequest("O'zingizni o'chira olmaysiz"));
            }
            const deleted = await Admin.destroy({ where: { id: adminId } });
            if (!deleted) return next(ApiError.notFound("Admin topilmadi"));
            return res.json({ message: "Admin o'chirildi" });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Adminni o'chirishda xatolik: " + error.message));
        }
    }

    async getAllDrivers(req, res, next) {
        try {
            const {
                search,
                driver_status,
                car_type_id,
                is_approved,
                blocked,
                page = 1,
                limit = 20
            } = req.query;

            const driverWhere = {};
            if (driver_status) driverWhere.driver_status = driver_status;
            if (car_type_id) driverWhere.car_type_id = car_type_id;
            if (is_approved !== undefined) driverWhere.is_approved = is_approved === "true";
            if (blocked !== undefined) driverWhere.blocked = blocked === "true";

            const userWhere = {};
            if (search) {
                userWhere[Op.or] = [
                    { firstname: { [Op.iLike]: `%${search}%` } },
                    { lastname: { [Op.iLike]: `%${search}%` } },
                    { phone: { [Op.iLike]: `%${search}%` } },
                ];
            }

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const drivers = await Driver.findAndCountAll({
                where: driverWhere,
                include: [
                    {
                        model: Users,
                        where: Object.keys(userWhere).length ? userWhere : undefined,
                        required: !!Object.keys(userWhere).length,
                        attributes: ['id', 'firstname', 'lastname', 'phone', 'phone_2', 'user_img', 'user_status', 'createdAt']
                    },
                    {
                        model: CarType,
                        as: 'carType',
                        attributes: ['id', 'name', 'icon', 'max_weight']
                    }
                ],
                limit: parseInt(limit),
                offset,
                order: [['createdAt', 'DESC']],
                distinct: true,
            });

            return res.json({
                data: drivers.rows,
                total: drivers.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(drivers.count / parseInt(limit)),
            });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Haydovchilarni olishda xatolik: " + error.message));
        }
    }

    async getDriverById(req, res, next) {
        try {
            const driver = await Driver.findByPk(req.params.driverId, {
                include: [
                    {
                        model: Users,
                        attributes: ['id', 'firstname', 'lastname', 'phone', 'phone_2', 'user_img', 'user_status', 'address', 'birthday', 'createdAt']
                    },
                    {
                        model: CarType,
                        as: 'carType',
                        attributes: ['id', 'name', 'icon', 'max_weight', 'dim_x', 'dim_y', 'dim_z']
                    }
                ]
            });
            if (!driver) return next(ApiError.notFound("Haydovchi topilmadi"));
            return res.json(driver);
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Haydovchini olishda xatolik: " + error.message));
        }
    }

    async createDriver(req, res, next) {
        try {
            const {
                firstname, lastname, phone, phone_2, email, address, birthday, user_img,
                car_type_id, name, tex_pas_ser, tex_pas_num, prava_ser, prava_num,
                car_img, prava_img, tex_pas_img, password,
            } = req.body;

            if (!firstname || !lastname || !phone || !password) {
                return next(ApiError.badRequest("Ism, familiya, telefon va parol kerak"));
            }
            if (!/^\+998\d{9}$/.test(phone)) {
                return next(ApiError.badRequest("Telefon raqami noto'g'ri formatda"));
            }

            const existing = await Users.findOne({ where: { phone } });
            if (existing) return next(ApiError.badRequest("Bu telefon raqami band"));

            const hashed = await bcrypt.hash(password, 10);
            const user = await Users.create({
                firstname, lastname, phone,
                phone_2: phone_2 || null,
                email: email || null,
                address: address || null,
                birthday: birthday || null,
                user_img: user_img || null,
                role: 'driver',
                user_status: 'active',
                password: hashed,
            });

            const driver = await Driver.create({
                user_id: user.id,
                car_type_id: car_type_id || null,
                name: name || null,
                tex_pas_ser: tex_pas_ser || null,
                tex_pas_num: tex_pas_num || null,
                prava_ser: prava_ser || null,
                prava_num: prava_num || null,
                car_img: car_img || null,
                prava_img: prava_img || null,
                tex_pas_img: tex_pas_img || null,
                driver_status: 'offline',
                is_approved: false,
                blocked: false,
            });

            return res.status(201).json({ message: "Haydovchi qo'shildi", id: driver.id, driver, user });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Haydovchi qo'shishda xatolik: " + error.message));
        }
    }

    async deleteDriver(req, res, next) {
        try {
            const { driverId } = req.params;
            const deleted = await Driver.destroy({ where: { id: driverId } });
            if (!deleted) return next(ApiError.notFound("Haydovchi topilmadi"));
            return res.json({ message: "Haydovchi o'chirildi" });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Haydovchini o'chirishda xatolik: " + error.message));
        }
    }

    async getDriverOrders(req, res, next) {
        try {
            const { driverId } = req.params;
            const orders = await Assignment.findAll({
                where: { driver_id: driverId },
                include: [
                    {
                        model: Load,
                        attributes: ['id', 'name', 'cargo_type', 'load_status', 'createdAt']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            return res.json({ data: orders });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Buyurtmalarni olishda xatolik: " + error.message));
        }
    }

    async blockDriver(req, res, next) {
        try {
            const { driverId } = req.params;
            const driver = await Driver.findByPk(driverId);
            if (!driver) return next(ApiError.notFound("Haydovchi topilmadi"));
            await driver.update({ blocked: true });
            return res.json({ message: "Haydovchi bloklandi", driver });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Haydovchini bloklashda xatolik: " + error.message));
        }
    }

    async unblockDriver(req, res, next) {
        try {
            const { driverId } = req.params;
            const driver = await Driver.findByPk(driverId);
            if (!driver) return next(ApiError.notFound("Haydovchi topilmadi"));
            await driver.update({ blocked: false });
            return res.json({ message: "Haydovchi bloktan chiqarildi", driver });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Bloktan chiqarishda xatolik: " + error.message));
        }
    }

    async approveDriver(req, res, next) {
        try {
            const { driverId } = req.params;
            const driver = await Driver.findByPk(driverId);
            if (!driver) return next(ApiError.notFound("Haydovchi topilmadi"));
            await driver.update({ is_approved: true });
            return res.json({ message: "Haydovchi tasdiqlandi", driver });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Tasdiqlashda xatolik: " + error.message));
        }
    }

    async rejectDriver(req, res, next) {
        try {
            const { driverId } = req.params;
            const driver = await Driver.findByPk(driverId);
            if (!driver) return next(ApiError.notFound("Haydovchi topilmadi"));
            await driver.update({ is_approved: false });
            return res.json({ message: "Haydovchi rad etildi", driver });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Rad etishda xatolik: " + error.message));
        }
    }

    async updateDriver(req, res, next) {
        try {
            const { driverId } = req.params;
            const {
                // Driver fields
                car_type_id, name, tex_pas_ser, prava_ser, tex_pas_num, prava_num,
                car_img, prava_img, tex_pas_img, driver_status, is_approved, blocked,
                // User fields (bog'liq Users yozuvini ham yangilash)
                firstname, lastname, phone, phone_2, email, address, birthday, user_img,
            } = req.body;

            const driver = await Driver.findByPk(driverId);
            if (!driver) return next(ApiError.notFound('Haydovchi topilmadi'));

            await driver.update({
                car_type_id: car_type_id ?? driver.car_type_id,
                name: name ?? driver.name,
                tex_pas_ser: tex_pas_ser ?? driver.tex_pas_ser,
                prava_ser: prava_ser ?? driver.prava_ser,
                tex_pas_num: tex_pas_num ?? driver.tex_pas_num,
                prava_num: prava_num ?? driver.prava_num,
                car_img: car_img ?? driver.car_img,
                prava_img: prava_img ?? driver.prava_img,
                tex_pas_img: tex_pas_img ?? driver.tex_pas_img,
                driver_status: driver_status ?? driver.driver_status,
                is_approved: is_approved ?? driver.is_approved,
                blocked: blocked ?? driver.blocked,
            });

            // Update user record too (if user fields provided)
            if (firstname || lastname || phone || email || address || birthday || user_img || phone_2 !== undefined) {
                const user = await Users.findByPk(driver.user_id);
                if (user) {
                    await user.update({
                        firstname: firstname ?? user.firstname,
                        lastname: lastname ?? user.lastname,
                        phone: phone ?? user.phone,
                        phone_2: phone_2 !== undefined ? (phone_2 || null) : user.phone_2,
                        email: email ?? user.email,
                        address: address ?? user.address,
                        birthday: birthday ?? user.birthday,
                        user_img: user_img ?? user.user_img,
                    });
                }
            }

            return res.json({ message: "Haydovchi yangilandi", id: driver.id, driver });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Haydovchini yangilashda xatolik: " + error.message));
        }
    }

    async getStats(req, res, next) {
        try {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            const [
                driversTotal,
                driversApproved,
                driversPending,
                driversBlocked,
                driversByStatus,
                ownersTotal,
                ownersActive,
                ownersBlocked,
                loadsTotal,
                loadsByStatus,
                assignmentsToday,
                loadsLast7Days,
            ] = await Promise.all([
                Driver.count(),
                Driver.count({ where: { is_approved: true } }),
                Driver.count({ where: { is_approved: false } }),
                Driver.count({ where: { blocked: true } }),
                Driver.findAll({
                    attributes: [
                        'driver_status',
                        [Driver.sequelize.fn('COUNT', Driver.sequelize.col('id')), 'count']
                    ],
                    group: ['driver_status'],
                    raw: true,
                }),
                Users.count({ where: { role: 'cargo_owner' } }),
                Users.count({ where: { role: 'cargo_owner', user_status: 'active' } }),
                Users.count({ where: { role: 'cargo_owner', user_status: 'inactive' } }),
                Load.count(),
                Load.findAll({
                    attributes: [
                        'load_status',
                        [Load.sequelize.fn('COUNT', Load.sequelize.col('id')), 'count']
                    ],
                    group: ['load_status'],
                    raw: true,
                }),
                Assignment.count({ where: { createdAt: { [Op.gte]: startOfDay } } }),
                Load.findAll({
                    attributes: [
                        [Load.sequelize.fn('DATE', Load.sequelize.col('createdAt')), 'date'],
                        [Load.sequelize.fn('COUNT', Load.sequelize.col('id')), 'count']
                    ],
                    where: { createdAt: { [Op.gte]: sevenDaysAgo } },
                    group: [Load.sequelize.fn('DATE', Load.sequelize.col('createdAt'))],
                    order: [[Load.sequelize.fn('DATE', Load.sequelize.col('createdAt')), 'ASC']],
                    raw: true,
                }),
            ]);

            return res.json({
                drivers: {
                    total: driversTotal,
                    approved: driversApproved,
                    pending: driversPending,
                    blocked: driversBlocked,
                    byStatus: driversByStatus,
                },
                owners: {
                    total: ownersTotal,
                    active: ownersActive,
                    blocked: ownersBlocked,
                },
                loads: {
                    total: loadsTotal,
                    byStatus: loadsByStatus,
                    last7Days: loadsLast7Days,
                },
                assignments: {
                    today: assignmentsToday,
                },
            });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Statistika olishda xatolik: " + error.message));
        }
    }
}

module.exports = new AdminsController();
