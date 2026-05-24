const { Op } = require("sequelize");
const { Load, LoadDetails, DriverStop, Assignment, Driver, Users, CarType, Location } = require("../../models/index");
const ApiError = require("../../error/ApiError");

class AdminLoadController {
    async getAllLoads(req, res, next) {
        try {
            const {
                search,
                load_status,
                user_id,
                payer,
                from,
                to,
                page = 1,
                limit = 20,
            } = req.query;

            const where = {};
            if (load_status) where.load_status = load_status;
            if (user_id) where.user_id = user_id;
            if (payer) where.payer = payer;
            if (from || to) {
                where.createdAt = {};
                if (from) where.createdAt[Op.gte] = new Date(from);
                if (to) where.createdAt[Op.lte] = new Date(to);
            }
            if (search) {
                where[Op.or] = [
                    { name: { [Op.iLike]: `%${search}%` } },
                    { cargo_type: { [Op.iLike]: `%${search}%` } },
                    { receiver_phone: { [Op.iLike]: `%${search}%` } },
                ];
            }

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const loads = await Load.findAndCountAll({
                where,
                include: [
                    {
                        model: Users,
                        attributes: ['id', 'firstname', 'lastname', 'phone'],
                    },
                    {
                        model: LoadDetails,
                        as: 'loadDetails',
                        attributes: ['weight', 'length', 'width', 'height', 'loading_time'],
                        include: [{ model: CarType, attributes: ['id', 'name', 'icon'] }],
                    },
                ],
                limit: parseInt(limit),
                offset,
                order: [['createdAt', 'DESC']],
                distinct: true,
            });

            return res.json({
                data: loads.rows,
                total: loads.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(loads.count / parseInt(limit)),
            });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Yuklarni olishda xatolik: " + error.message));
        }
    }

    async getLoadById(req, res, next) {
        try {
            const { id } = req.params;

            const load = await Load.findByPk(id, {
                include: [
                    {
                        model: Users,
                        attributes: ['id', 'firstname', 'lastname', 'phone', 'phone_2', 'user_img'],
                    },
                    {
                        model: LoadDetails,
                        as: 'loadDetails',
                        include: [{ model: CarType, attributes: ['id', 'name', 'icon', 'max_weight'] }],
                    },
                    {
                        model: Assignment,
                        include: [
                            {
                                model: Driver,
                                include: [
                                    { model: Users, attributes: ['firstname', 'lastname', 'phone', 'user_img'] },
                                ],
                            },
                        ],
                    },
                ],
            });

            if (!load) return next(ApiError.notFound("Yuk topilmadi"));

            const stops = await DriverStop.findAll({
                where: { load_id: id },
                order: [['order', 'ASC']],
            });

            return res.json({ load, stops });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Yukni olishda xatolik: " + error.message));
        }
    }

    async getLoadLocations(req, res, next) {
        try {
            const { id } = req.params;
            const locations = await Location.findAll({
                where: { load_id: id },
                order: [['recordedAt', 'ASC']],
                attributes: ['id', 'latitude', 'longitude', 'recordedAt', 'order'],
            });
            return res.json({ data: locations });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Joylashuvlarni olishda xatolik: " + error.message));
        }
    }

    async deactivateLoad(req, res, next) {
        try {
            const { id } = req.params;
            const load = await Load.findByPk(id);
            if (!load) return next(ApiError.notFound("Yuk topilmadi"));
            await load.update({ status: 'inactive' });
            return res.json({ message: "Yuk faolsizlantirildi" });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Yukni faolsizlantirishda xatolik: " + error.message));
        }
    }
}

module.exports = new AdminLoadController();
