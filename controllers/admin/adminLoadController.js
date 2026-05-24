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

    async createLoad(req, res, next) {
        try {
            const {
                user_id, name, cargo_type, receiver_phone, payer, description,
                origin_location, destination_location, stop_locations,
                weight, length, width, height, car_type_id, loading_time, is_round_trip,
            } = req.body;

            if (!user_id || !name || !cargo_type || !payer || !receiver_phone || !origin_location || !destination_location || !weight || !car_type_id) {
                return next(ApiError.badRequest("Majburiy maydonlar to'liq emas (user_id, name, cargo_type, payer, receiver_phone, origin/destination_location, weight, car_type_id)"));
            }

            const owner = await Users.findByPk(user_id);
            if (!owner) return next(ApiError.badRequest("Yuk egasi topilmadi"));

            const carType = await CarType.findByPk(car_type_id);
            if (!carType) return next(ApiError.badRequest("Mashina turi topilmadi"));

            const load = await Load.create({
                user_id,
                name,
                cargo_type,
                receiver_phone,
                payer,
                description: description || null,
                load_status: 'posted',
                is_round_trip: !!is_round_trip,
            });

            await LoadDetails.create({
                load_id: load.id,
                weight,
                length: length || null,
                width: width || null,
                height: height || null,
                car_type_id,
                loading_time: loading_time || null,
            });

            await DriverStop.create({
                load_id: load.id,
                latitude: origin_location.lat,
                longitude: origin_location.lon,
                order: 0,
                location_name: origin_location.address,
            });
            await DriverStop.create({
                load_id: load.id,
                latitude: destination_location.lat,
                longitude: destination_location.lon,
                order: 1,
                location_name: destination_location.address,
            });

            if (Array.isArray(stop_locations)) {
                for (const [i, s] of stop_locations.entries()) {
                    await DriverStop.create({
                        load_id: load.id,
                        latitude: s.lat,
                        longitude: s.lon,
                        order: s.order ?? (i + 2),
                        location_name: s.address,
                    });
                }
            }

            return res.status(201).json({ message: "Yuk qo'shildi", id: load.id, load });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Yuk qo'shishda xatolik: " + error.message));
        }
    }

    async updateLoad(req, res, next) {
        try {
            const { id } = req.params;
            const {
                name, cargo_type, receiver_phone, payer, description, load_status, is_round_trip,
                weight, length, width, height, car_type_id, loading_time,
                origin_location, destination_location,
            } = req.body;

            const load = await Load.findByPk(id);
            if (!load) return next(ApiError.notFound("Yuk topilmadi"));

            await load.update({
                name: name ?? load.name,
                cargo_type: cargo_type ?? load.cargo_type,
                receiver_phone: receiver_phone ?? load.receiver_phone,
                payer: payer ?? load.payer,
                description: description ?? load.description,
                load_status: load_status ?? load.load_status,
                is_round_trip: is_round_trip ?? load.is_round_trip,
            });

            if (weight !== undefined || length !== undefined || width !== undefined ||
                height !== undefined || car_type_id !== undefined || loading_time !== undefined) {
                const details = await LoadDetails.findOne({ where: { load_id: id } });
                if (details) {
                    await details.update({
                        weight: weight ?? details.weight,
                        length: length ?? details.length,
                        width: width ?? details.width,
                        height: height ?? details.height,
                        car_type_id: car_type_id ?? details.car_type_id,
                        loading_time: loading_time ?? details.loading_time,
                    });
                }
            }

            if (origin_location) {
                const origin = await DriverStop.findOne({ where: { load_id: id, order: 0 } });
                if (origin) {
                    await origin.update({
                        latitude: origin_location.lat,
                        longitude: origin_location.lon,
                        location_name: origin_location.address,
                    });
                }
            }
            if (destination_location) {
                const dest = await DriverStop.findOne({ where: { load_id: id, order: 1 } });
                if (dest) {
                    await dest.update({
                        latitude: destination_location.lat,
                        longitude: destination_location.lon,
                        location_name: destination_location.address,
                    });
                }
            }

            return res.json({ message: "Yuk yangilandi", id });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Yukni yangilashda xatolik: " + error.message));
        }
    }

    async deleteLoad(req, res, next) {
        try {
            const { id } = req.params;
            const load = await Load.findByPk(id);
            if (!load) return next(ApiError.notFound("Yuk topilmadi"));

            // Cascade: locations + stops + details + assignments
            await Location.destroy({ where: { load_id: id } });
            await DriverStop.destroy({ where: { load_id: id } });
            await LoadDetails.destroy({ where: { load_id: id } });
            const { Assignment } = require("../../models/index");
            await Assignment.destroy({ where: { load_id: id } });
            await load.destroy();

            return res.json({ message: "Yuk o'chirildi" });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Yukni o'chirishda xatolik: " + error.message));
        }
    }
}

module.exports = new AdminLoadController();
