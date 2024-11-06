const { Users, Location, Load, CarType, LoadDetails, DriverStop } = require("../../models/index");
const ApiError = require("../../error/ApiError");

const Joi = require('joi');
const { socketService } = require('../../http');

class LoadController {

    async getLoadDetails(req, res, next) {
        try {
            const { load_id } = req.query;

            const { user_id } = req.body;

            const user = await Users.findByPk(user_id);
            if (!user) {
                return next(ApiError.badRequest("User not found"));
            }

            if (user.role !== 'cargo_owner') {
                return next(ApiError.forbidden("Only cargo owners can update loads"));
            }

            const load = await Load.findByPk(load_id);

            let result = {};
            if (!load) {
                return next(ApiError.badRequest("Load not found"));
            }

            result.main = load;

            const locations = await DriverStop.findAll({
                where: { load_id: load.id }
            });

            if (locations) {
                result.locations = locations
            }

            const loadDetails = await LoadDetails.findAll({
                where: { load_id: load_id },
                include: [
                    {
                        model: CarType,
                        attributes: ['name'],
                    },
                ],
            });

            if (loadDetails) {
                result.loadDetails = loadDetails
            }

            return res.status(200).json({
                message: "Load details retrieved successfully",
                result,
            });

        } catch (error) {
            console.error("Error retrieving load details:", error);
            next(ApiError.internal("Error retrieving load details"));
        }
    }

    async createLoad(req, res, next) {
        try {
            const schema = Joi.object({
                user_id: Joi.string().required(),
                name: Joi.string().required(),
                cargo_type: Joi.string().required(),
                receiver_phone: Joi.string().required(),
                payer: Joi.string().required(),
                description: Joi.string().required(),
                origin_location: Joi.object({
                    address: Joi.string().required(),
                    lat: Joi.number().required(),
                    lon: Joi.number().required(),
                }).required(),
                destination_location: Joi.object({
                    address: Joi.string().required(),
                    lat: Joi.number().required(),
                    lon: Joi.number().required(),
                }).required(),
                stop_locations: Joi.array().items(Joi.object({
                    address: Joi.string().required(),
                    lat: Joi.number().required(),
                    lon: Joi.number().required(),
                })).optional(),
                weight: Joi.number().required(),
                length: Joi.number().required(),
                width: Joi.number().required(),
                height: Joi.number().required(),
                car_type_id: Joi.string().required(),
                loading_time: Joi.date().required(),
                is_round_trip: Joi.boolean().required(),
            });

            const { error } = schema.validate(req.body);
            if (error) {
                return next(ApiError.badRequest(`Validation error: ${error.details[0].message}`));
            }

            const {
                user_id,
                name,
                cargo_type,
                receiver_phone,
                payer,
                description,
                origin_location,
                destination_location,
                stop_locations,
                weight,
                length,
                width,
                height,
                car_type_id,
                loading_time,
                is_round_trip
            } = req.body;

            const user = await Users.findByPk(user_id);

            if (!user) {
                return next(ApiError.badRequest("User not found"));
            }

            if (user.role !== 'cargo_owner') {
                return next(ApiError.forbidden("Only cargo owners can post loads"));
            }

            const load = await Load.create({
                user_id: user.id,
                name,
                cargo_type,
                receiver_phone,
                payer,
                description,
            });

            await DriverStop.create({
                load_id: load.id,
                latitude: origin_location.lat,
                longitude: origin_location.lon,
                order: 0
            });

            await DriverStop.create({
                load_id: load.id,
                latitude: destination_location.lat,
                longitude: destination_location.lon,
                order: 1
            });

            if (Array.isArray(stop_locations) && stop_locations.length > 0) {
                for (const stop of stop_locations) {
                    await DriverStop.create({
                        load_id: load.id,
                        latitude: stop.lat,
                        longitude: stop.lon,
                        order: stop.order
                    });
                }
            }

            const carType = await CarType.findByPk(car_type_id);
            if (!carType) {
                return next(ApiError.badRequest("Car type not found"));
            }

            await LoadDetails.create({
                load_id: load.id,
                weight,
                length,
                width,
                height,
                car_type_id: carType.id,
                loading_time,
            });

            await load.update({
                is_round_trip,
            });

            socketService.createdNewLoad({
                message: "New load posted",
                load: {
                    id: load.id,
                    name,
                    cargo_type,
                    receiver_phone,
                    payer,
                    description,
                    origin_location,
                    destination_location,
                    stop_locations,
                    weight,
                    length,
                    width,
                    height,
                    car_type_id,
                    loading_time,
                    is_round_trip
                }
            });

            return res.status(201).json({
                message: "Load created successfully",
                load,
            });

        } catch (error) {
            console.error("Error creating complete load:", error.stack);
            next(ApiError.internal("Error creating complete load"));
        }
    }

    async deactivateLoad(req, res, next) {
        try {
            const { load_id } = req.query;
            const { user_id } = req.body;

            const user = await Users.findByPk(user_id);
            if (!user) {
                return next(ApiError.badRequest("User not found"));
            }

            if (user.role !== 'cargo_owner') {
                return next(ApiError.forbidden("Only cargo owners can deactivate loads"));
            }

            const load = await Load.findByPk(load_id);
            if (!load) {
                return next(ApiError.badRequest("Load not found"));
            }

            if (load.load_status == "picked_up" || load.load_status == "in_transit" || load.load_status == "delivered") {
                return next(ApiError.badRequest("Only driver can deactivate this load"));
            }

            await load.update({ status: 'inactive' });

            await DriverStop.update({ status: 'inactive' }, { where: { load_id: load.id } });

            await LoadDetails.update({ status: 'inactive' }, { where: { load_id: load.id } });

            return res.status(200).json({
                message: "Load and related information deactivated successfully",
            });

        } catch (error) {
            console.error("Error deactivating load:", error);
            next(ApiError.internal("Error deactivating load"));
        }
    }

    async getUserAllLoads(req, res, next) {
        const { user_id } = req.params;

        try {
            const loads = await Load.findAll({
                where: {
                    user_id: user_id,
                    load_status: ['posted', 'assigned', 'picked_up', 'in_transit', 'delivered'],
                },
                include: [
                    {
                        model: LoadDetails,
                        attributes: ['car_type_id'],
                    },
                    {
                        model: DriverStop,
                        where: { order: [0, 1] },
                        attributes: ['latitude', 'longitude', 'order', 'start_time', 'end_time', 'location_name'],
                        required: false, 
                    },
                ],
                attributes: ['user_id', 'cargo_type', 'load_status'], 
            });

            res.json({
                success: true,
                message: 'Ma\'lumotlar muvaffaqiyatli olindi',
                data: loads,
            });
        } catch (error) {
            next(ApiError.internal('Ma\'lumotlarni olishda xatolik yuz berdi'));
        }
    }

}


module.exports = new LoadController();
