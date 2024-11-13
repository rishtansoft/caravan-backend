const { Users, Driver, Load, CarType, LoadDetails, DriverStop, Assignment } = require("../../models/index");
const ApiError = require("../../error/ApiError");
const { Op } = require('sequelize'); // Op ni import qilish


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

            // if (user.role !== 'cargo_owner') {
            //     return next(ApiError.forbidden("Only cargo owners can update loads"));
            // }

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
                    order: Joi.number().required(),
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
                order: 0,
                location_name: origin_location.address
            });

            await DriverStop.create({
                load_id: load.id,
                latitude: destination_location.lat,
                longitude: destination_location.lon,
                order: 1,
                location_name: destination_location.address
            });

            if (Array.isArray(stop_locations) && stop_locations.length > 0) {
                for (const stop of stop_locations) {
                    await DriverStop.create({
                        load_id: load.id,
                        latitude: stop.lat,
                        longitude: stop.lon,
                        order: stop.order,
                        location_name: stop.address
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
            console.error("Error creating complete load:", error);
            next(ApiError.badRequest("Error creating complete load"));
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
        const { user_id } = req.query;

        try {
            // 1. Loadlarni olish
            const loads = await Load.findAll({
                where: {
                    user_id,
                    load_status: {
                        [Op.in]: ['posted', 'assigned', 'picked_up', 'in_transit', 'delivered'],
                    },
                    status: "active"
                },
                attributes: ['id', 'user_id', 'cargo_type', 'load_status'],
            });

            // Agar loadlar bo'lmasa, darhol javob qaytarish
            if (!loads.length) {
                return res.status(200).json({
                    success: true,
                    message: "Ma'lumotlar topilmadi",
                    data: [],
                });
            }

            // 2. Loadlarning IDlarini olish
            const loadIds = loads.map(load => load.id);

            // 3. LoadDetails ma'lumotlarini olish
            const loadDetails = await LoadDetails.findAll({
                where: {
                    load_id: {
                        [Op.in]: loadIds
                    }
                },
                attributes: ['load_id', 'car_type_id', "weight"],
            });

            // 4. DriverStop ma'lumotlarini olish
            const driverStops = await DriverStop.findAll({
                where: {
                    load_id: {
                        [Op.in]: loadIds
                    },
                    order: {
                        [Op.in]: [0, 1]
                    }
                },
                attributes: ['load_id', 'latitude', 'longitude', 'order', 'start_time', 'end_time', 'location_name'],
            });

            // 5. Loadlar bilan LoadDetails va DriverStoplarni birlashtirish
            const loadsWithDetailsAndStops = loads.map(load => {
                const loadDetail = loadDetails.find(detail => detail.load_id === load.id);
                const stops = driverStops.filter(stop => stop.load_id === load.id);

                console.log(321, loadDetail);
                
                return {
                    ...load.toJSON(),
                    loadDetails: loadDetail || null,
                    driverStops: stops,
                };
            });

            // 6. Natijani qaytarish
            return res.status(200).json({
                success: true,
                message: "Ma'lumotlar muvaffaqiyatli olindi",
                data: loadsWithDetailsAndStops,
            });
        } catch (error) {
            console.error("Error fetching user loads:", error);
            return next(ApiError.internal("Ma'lumotlarni olishda xatolik yuz berdi"));
        }
    }

    async getAllActiveLoads(req, res, next) {
        const { user_id } = req.query;

        try {
            const user = await Users.findByPk(user_id);

            if (!user) {
                return next(ApiError.badRequest("Ushbu foydalanuvchi topilmadi"));
            }

            // 1. Loadlarni olish
            const loads = await Load.findAll({
                where: {
                    load_status: {
                        [Op.in]: ['posted'],
                    },
                    status: "active"
                },
                attributes: ['id', 'user_id', 'cargo_type', 'load_status'],
            });

            // Agar loadlar bo'lmasa, darhol javob qaytarish
            if (!loads.length) {
                return res.status(200).json({
                    success: true,
                    message: "Ma'lumotlar topilmadi",
                    data: [],
                });
            }

            // 2. Loadlarning IDlarini olish
            const loadIds = loads.map(load => load.id);

            // 3. LoadDetails ma'lumotlarini olish
            const loadDetails = await LoadDetails.findAll({
                where: {
                    load_id: {
                        [Op.in]: loadIds
                    }
                },
                attributes: ['load_id', 'car_type_id', "weight"],
            });

            // 4. DriverStop ma'lumotlarini olish
            const driverStops = await DriverStop.findAll({
                where: {
                    load_id: {
                        [Op.in]: loadIds
                    },
                    order: {
                        [Op.in]: [0, 1]
                    }
                },
                attributes: ['load_id', 'latitude', 'longitude', 'order', 'start_time', 'end_time', 'location_name'],
            });

            // 5. Loadlar bilan LoadDetails va DriverStoplarni birlashtirish
            const loadsWithDetailsAndStops = loads.map(load => {
                const loadDetail = loadDetails.find(detail => detail.load_id === load.id);
                const stops = driverStops.filter(stop => stop.load_id === load.id);

                return {
                    ...load.toJSON(),
                    loadDetails: loadDetail || null,
                    driverStops: stops,
                };
            });

            // 6. Natijani qaytarish
            return res.status(200).json({
                success: true,
                message: "Ma'lumotlar muvaffaqiyatli olindi",
                data: loadsWithDetailsAndStops,
            });
        } catch (error) {
            console.error("Error fetching user loads:", error);
            return next(ApiError.internal("Ma'lumotlarni olishda xatolik yuz berdi"));
        }
    }


    async getDriverLoads(req, res, next) {
        const { user_id } = req.query;

        try {
            // 1. Foydalanuvchi mavjudligini va role driver ekanligini tekshirish
            const user = await Users.findOne({
                where: { id: user_id, role: 'driver' },
            });

            if (!user) {
                return next(ApiError.badRequest("Foydalanuvchi topilmadi yoki u driver emas"));
            }

            // 2. Ushbu driverga tegishli barcha Assignment larni olish
            const assignments = await Assignment.findAll({
                where: { driver_id: user_id },
                attributes: ['load_id'],
            });

            const loadIds = assignments.map(assignment => assignment.load_id);

            if (!loadIds.length) {
                return res.json({
                    success: true,
                    message: "Ushbu driverga yuklar tayinlanmagan",
                    data: [],
                });
            }

            // 3. Load jadvalidan faqat kerakli loadlarni olish
            const loads = await Load.findAll({
                where: {
                    id: {
                        [Op.in]: loadIds,
                    },
                },
                attributes: ['id', 'load_status'], // Faqat kerakli attributlar
            });

            if (!loads) {
                return next(ApiError.badRequest("Haydovchiga tegishli load lar topilmadi"));
            }

            // 4. Har bir load uchun LoadDetails va DriverStop ma'lumotlarini olish
            const loadData = await Promise.allSettled(
                loads.map(async (load) => {
                    // LoadDetails dan car_type_id ni olish
                    const loadDetails = await LoadDetails.findOne({
                        where: { load_id: load.id },
                        attributes: ['car_type_id'],
                    });

                    // DriverStop jadvalidan joylashuv ma'lumotlarini olish
                    const driverStops = await DriverStop.findAll({
                        where: { load_id: load.id },
                        attributes: ['latitude', 'longitude', 'order', 'start_time', 'end_time', 'location_name'],
                    });

                    return {
                        load_id: load.id,
                        load_status: load.load_status,
                        loadDetails: loadDetails ? loadDetails.car_type_id : null,
                        driverStops,
                    };
                })
            );

            // 5. Natijani qaytarish
            return res.json({
                success: true,
                message: "Ma'lumotlar muvaffaqiyatli olindi",
                data: loadData,
            });

        } catch (error) {
            console.error("Error fetching driver loads:", error);
            return next(ApiError.internal("Ma'lumotlarni olishda xatolik yuz berdi"));
        }

    }

    async updateDriverStatus(req, res, next) {
        const { user_id, driver_status } = req.body;
    
        // Dastlab driver_status qiymatini tasdiqlash
        const validStatuses = ["empty", "at_work", "resting", "offline", "on_break"];
        if (!validStatuses.includes(driver_status)) {
            return next(ApiError.badRequest("Noto'g'ri driver_status qiymati"));
        }


        try {
            // Foydalanuvchiga tegishli Driver yozuvini topish
            const driver = await Driver.findOne({ where: { user_id } });
            
            // Driver mavjudligini tekshirish
            if (!driver) {
                return next(ApiError.badRequest("Driver topilmadi"));
            }

            const assignment = await Assignment.findOne({
                where: {
                  driver_id: driver.id,
                  assignment_status: {
                    [Op.in]: ['assigned', 'picked_up', 'in_transit']
                  }
                }
              });
              
              if (assignment) {
                return next(ApiError.badRequest("Haydovchi safar yangi yuk olishi uchun safarni yakunlashi kerak"));
              }
              
    
            // driver_status qiymatini yangilash
            driver.driver_status = driver_status;
            await driver.save();
    
            return res.json({
                success: true,
                message: "Driver statusi muvaffaqiyatli yangilandi",
                data: {
                    user_id,
                    driver_status: driver.driver_status,
                },
            });
        } catch (error) {
            console.error("Error updating driver status:", error);
            return next(ApiError.internal("Driver statusini yangilashda xatolik yuz berdi"));
        }
    }

}


module.exports = new LoadController();
