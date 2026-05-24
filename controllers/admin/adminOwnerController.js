const { Users, Load } = require("../../models/index");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const ApiError = require("../../error/ApiError");

class AdminOwnerController {

     async getOwners(req, res, next) {
        try {
            const { search, status, page = 1, limit = 20 } = req.query;

            const where = { role: 'cargo_owner' };
            if (search) {
                where[Op.or] = [
                    { firstname: { [Op.iLike]: `%${search}%` } },
                    { lastname: { [Op.iLike]: `%${search}%` } },
                    { phone: { [Op.iLike]: `%${search}%` } },
                ];
            }
            if (status) {
                where.user_status = status;
            }

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const owners = await Users.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset,
                order: [['createdAt', 'DESC']],
                attributes: { exclude: ['password', 'verification_code', 'verification_expiry'] },
            });

            res.json({
                data: owners.rows,
                total: owners.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(owners.count / parseInt(limit)),
            });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Yuk egalari ro'yxatini olishda xatolik: " + error.message));
        }
    }



    async getOwnerById(req, res, next) {
        try {
            const { ownerId } = req.params;
            const owner = await Users.findByPk(ownerId, {
                attributes: { exclude: ['password'] },
            });

            if (!owner) return next(ApiError.notFound('Yuk egasi topilmadi'));
            res.json({ message: 'Yuk egasi maʼlumotlari', data: owner });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Yuk egasi maʼlumotlarini olishda xatolik: " + error.message));
        }
    }


    async updateOwner(req, res, next) {
        try {
            const { ownerId } = req.params;
            const { firstname, lastname, phone, phone_2, address, email, password } = req.body;

            const owner = await Users.findByPk(ownerId);
            if (!owner) return next(ApiError.notFound('Yuk egasi topilmadi'));

            const hashedPassword = password ? await bcrypt.hash(password, 10) : owner.password;
            await owner.update({ firstname, lastname, phone, phone_2, address, email, password: hashedPassword });

            res.json({ message: "Yuk egasi ma'lumotlari yangilandi", id: owner.id });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Yuk egasi ma'lumotlarini yangilashda xatolik: " + error.message));
        }
    }


    async blockOwner(req, res, next) {
        try {
            const { ownerId } = req.params;

            const owner = await Users.findByPk(ownerId);
            if (!owner) return next(ApiError.notFound('Yuk egasi topilmadi'));

            owner.user_status = 'inactive';
            await owner.save();

            res.json({ message: "Yuk egasi muvaffaqiyatli bloklandi", id: owner.id });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Yuk egasini bloklashda xatolik: " + error.message));
        }
    }

    async unblockOwner(req, res, next) {
        try {
            const { ownerId } = req.params;

            const owner = await Users.findByPk(ownerId);
            if (!owner) return next(ApiError.notFound('Yuk egasi topilmadi'));

            owner.user_status = 'active';
            await owner.save();

            res.json({ message: "Yuk egasi bloktan chiqarildi", id: owner.id });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Bloktan chiqarishda xatolik: " + error.message));
        }
    }

    async deleteOwner(req, res, next) {
        try {
            const { ownerId } = req.params;

            const owner = await Users.findByPk(ownerId);
            if (!owner) return next(ApiError.notFound('Yuk egasi topilmadi'));

            await owner.destroy();

            res.json({ message: "Yuk egasi tizimdan muvaffaqiyatli oʻchirildi" });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Yuk egasini oʻchirishda xatolik: " + error.message));
        }
    }

    async getOwnerOrders(req, res, next) {
        try {
            const { ownerId } = req.params;

            const owner = await Users.findByPk(ownerId);
            if (!owner) return next(ApiError.notFound('Yuk egasi topilmadi'));

            const orders = await Load.findAll({
                where: { user_id: ownerId },
            });

            res.json({ message: 'Yuk egasining buyurtmalari roʻyxati', data: orders });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Yuk egasining buyurtmalarini olishda xatolik: " + error.message));
        }
    }

}

module.exports = new AdminOwnerController();
