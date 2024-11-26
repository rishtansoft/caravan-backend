const { Users, Driver, CarType, Assignment, Load, DriverStop } = require("../../models/index");
const ApiError = require("../../error/ApiError");
const utilFunctions = require('../../utils/index');

const configService = require('../../config/configureService');
const { uploadFile, deleteFile } = require('../../utils/index');


class DriverControllers {
    async getProfile(req, res, next) {
        try {
            const { user_id } = req.query;

            if (!user_id) {
                return next(ApiError.badRequest("User id not found"));
            }

            const user = await Users.findByPk(user_id);

            if (!user) {
                return next(ApiError.badRequest("User not found"));
            }

            if (user.role !== "driver") {
                return next(ApiError.badRequest("The user is not a driver"));
            }

            const driverProfile = await Driver.findOne({
                where: { user_id },
            });

            if (!driverProfile) {
                return next(ApiError.badRequest("Driver profile not found for this user"));
            }

            return res.json({
                user: {
                    id: user.id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    birthday: user.birthday,
                    phone: user.phone,
                    phone_2: user.phone_2,
                    role: user.role,
                    user_status: user.user_status,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
                driver: driverProfile
            });
        } catch (error) {
            console.error(error);
            return next(ApiError.internal("Error fetching driver profile: " + error.message));
        }
    }

    async updateDriverProfile(req, res, next) {
        try {
            const { user_id } = req.query;

            const {
                firstname,
                lastname,
                email,
                birthday,
                phone_2,
                car_type,
                car_name: name,
                tex_pas_ser,
                prava_ser,
                tex_pas_num,
                prava_num
            } = req.body;

            const user = await Users.findByPk(user_id);

            if (!user) {
                return next(ApiError.badRequest("User not found"));
            }

            if (user.role !== "driver") {
                return next(ApiError.badRequest("The user is not a driver"));
            }

            const driverProfile = await Driver.findOne({
                where: { user_id },
            });

            if (!driverProfile) {
                return next(ApiError.badRequest("Driver profile not found for this user"));
            }

            if (email) {
                const isEmailValid = utilFunctions.validateEmail(email);
                if (!isEmailValid) {
                    return next(ApiError.badRequest("Email is not valid"));
                }
            }

            if (phone_2) {
                const isPhone2Valid = utilFunctions.validatePhoneNumber(phone_2);
                if (!isPhone2Valid) {
                    return next(ApiError.badRequest("Phone number is not valid"));
                }
            }

            if (firstname) {
                const isFirstNameValid = utilFunctions.validateName(firstname);
                if (!isFirstNameValid) {
                    return next(ApiError.badRequest("Firstname is not valid"));
                }
            }

            if (lastname) {
                const isLastnameValid = utilFunctions.validateName(lastname);
                if (!isLastnameValid) {
                    return next(ApiError.badRequest("Lastname is not valid"));
                }
            }

            if (name) {
                const isCarnameValid = utilFunctions.validateName(name);
                if (!isCarnameValid) {
                    return next(ApiError.badRequest("Car name is not valid"));
                }
            }

            if (tex_pas_ser) {
                const isValidTexPassportSerialNumber = utilFunctions.validateTexPassportSeries(tex_pas_ser);
                if (!isValidTexPassportSerialNumber) {
                    return next(ApiError.badRequest("Tex passport is not valid"));
                }
            }

            if (tex_pas_num) {
                const isValidTexPassportNumber = utilFunctions.validatePassportNumber(tex_pas_num);
                if (!isValidTexPassportNumber) {
                    return next(ApiError.badRequest("Tex passport is not valid"));
                }
            }

            if (prava_ser) {
                const isValidTexPassportSerialNumber = utilFunctions.validatePravaPassportSeries(prava_ser);
                if (!isValidTexPassportSerialNumber) {
                    return next(ApiError.badRequest("Prava is not valid"));
                }
            }

            if (prava_num) {
                const isValidTexPassportNumber = utilFunctions.validatePassportNumber(prava_num);
                if (!isValidTexPassportNumber) {
                    return next(ApiError.badRequest("Prava is not valid"));
                }
            }

            if (car_type) {
                const isExist = await CarType.findByPk(car_type);
                if (!isExist) {
                    return next(ApiError.badRequest("Car type is not found"));
                }
            }

            await user.update({
                firstname: firstname || user.firstname,
                lastname: lastname || user.lastname,
                email: email || user.email
            });

            console.log(169, phone_2, birthday, car_type);

            await user.update({
                phone_2: phone_2 || user.phone_2,
                birthday: birthday || driverProfile.birthday,
            })

            await driverProfile.update({
                car_type_id: car_type || driverProfile.car_type_id,
                name: name || driverProfile.name,
                tex_pas_ser: tex_pas_ser || driverProfile.tex_pas_ser,
                prava_ser: prava_ser || driverProfile.prava_ser,
                tex_pas_num: tex_pas_num || driverProfile.tex_pas_num,
                prava_num: prava_num || driverProfile.prava_num,
            });

            return res.json({
                message: "Driver profile updated successfully",
                user: {
                    id: user.id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    phone_2: phone_2,
                    birthday: birthday,
                    phone: user.phone,
                    role: user.role,
                    user_status: user.user_status,
                },
                driver: {
                    id: driverProfile.id,
                    car_type: driverProfile.car_type_id,
                    name: driverProfile.name,
                    tex_pas_ser: driverProfile.tex_pas_ser,
                    prava_ser: driverProfile.prava_ser,
                    tex_pas_num: driverProfile.tex_pas_num,
                    prava_num: driverProfile.prava_num,
                    car_img: driverProfile.car_img,
                    prava_img: driverProfile.prava_img,
                    tex_pas_img: driverProfile.tex_pas_img,
                    driver_status: driverProfile.driver_status,
                }
            });
        } catch (error) {
            console.error(error);
            return next(ApiError.internal("Error updating driver profile: " + error.message));
        }
    }

    // Tex passport image
    async uploadTexPassportImage(req, res, next) {
        try {
            const { user_id } = req.query;
            const file = req.file;

            if (!file || !user_id) {
                return res.status(400).json({ message: 'User ID and file are required' });
            }

            const driver = await Driver.findOne({ where: { user_id } });
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found' });
            }

            const fileUrl = await uploadFile(file, configService);

            await driver.update({ tex_pas_img: fileUrl });

            return res.json({
                message: 'Technical passport image uploaded successfully',
                tex_pas_img: fileUrl
            });
        } catch (error) {
            console.error('Error uploading technical passport image:', error);
            next(error);
        }
    }

    async deleteTexPassportImage(req, res, next) {
        try {
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            const driver = await Driver.findOne({ where: { user_id } });
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found' });
            }

            const texPasImgUrl = driver.tex_pas_img;
            if (!texPasImgUrl) {
                return res.status(400).json({ message: 'No technical passport image found to delete' });
            }

            await deleteFile(texPasImgUrl, configService);

            await driver.update({ tex_pas_img: null });

            return res.json({
                message: 'Technical passport image deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting technical passport image:', error);
            next(error);
        }
    }

    async replaceTexPassportImage(req, res, next) {
        try {
            const { user_id } = req.query;
            const file = req.file;

            if (!file || !user_id) {
                return res.status(400).json({ message: 'File and user ID are required' });
            }

            const driver = await Driver.findOne({ where: { user_id } });
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found' });
            }

            const oldTexPasImgUrl = driver.tex_pas_img;

            const newTexPasImgUrl = await uploadFile(file, configService);

            if (oldTexPasImgUrl) {
                await deleteFile(oldTexPasImgUrl, configService);
            }

            await driver.update({ tex_pas_img: newTexPasImgUrl });

            return res.json({
                message: 'Technical passport image replaced successfully',
                new_tex_pas_img: newTexPasImgUrl,
            });
        } catch (error) {
            console.error('Error replacing technical passport image:', error);
            next(error);
        }
    }

    // Prava image
    async uploadPravaImage(req, res, next) {
        try {
            const { user_id } = req.query;
            const file = req.file;

            console.log(323, user_id, file);

            if (!file || !user_id) {
                return res.status(400).json({ message: 'User ID and file are required' });
            }

            const driver = await Driver.findOne({ where: { user_id } });
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found' });
            }

            const fileUrl = await uploadFile(file, configService);

            await driver.update({ prava_img: fileUrl });

            return res.json({
                message: 'Technical passport image uploaded successfully',
                prava_img: fileUrl
            });
        } catch (error) {
            console.error('Error uploading technical passport image:', error);
            next(error);
        }
    }

    async deletePravaImage(req, res, next) {
        try {
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            const driver = await Driver.findOne({ where: { user_id } });
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found' });
            }

            const texPasImgUrl = driver.prava_img;
            if (!texPasImgUrl) {
                return res.status(400).json({ message: 'No technical passport image found to delete' });
            }

            await deleteFile(texPasImgUrl, configService);

            await driver.update({ prava_img: null });

            return res.json({
                message: 'Technical passport image deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting technical passport image:', error);
            next(error);
        }
    }

    async replacePravaImage(req, res, next) {
        try {
            const { user_id } = req.query;
            const file = req.file;

            if (!file || !user_id) {
                return res.status(400).json({ message: 'File and user ID are required' });
            }

            const driver = await Driver.findOne({ where: { user_id } });
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found' });
            }

            const oldTexPasImgUrl = driver.prava_img;

            const newTexPasImgUrl = await uploadFile(file, configService);

            if (oldTexPasImgUrl) {
                await deleteFile(oldTexPasImgUrl, configService);
            }

            await driver.update({ prava_img: newTexPasImgUrl });

            return res.json({
                message: 'Technical passport image replaced successfully',
                new_prava_img: newTexPasImgUrl,
            });
        } catch (error) {
            console.error('Error replacing technical passport image:', error);
            next(error);
        }
    }

    // async driverisInRoad(req, res, next) {
    //     try {
    //         const { user_id } = req.query;

    //         const user = await Users.findByPk(user_id);

    //         if (!user) {
    //             return next(ApiError.badRequest("User not found"));
    //         }

    //         if (user.role !== "driver") {
    //             return next(ApiError.badRequest("The user is not a driver"));
    //         }

    //         const driverProfile = await Driver.findOne({
    //             where: { user_id },
    //         });

    //         if (!driverProfile) {
    //             return next(ApiError.badRequest("Driver profile not found for this user"));
    //         }

    //         const assignment = await Assignment.findOne({
    //             where: {
    //                 driver_id: driverProfile.id,
    //                 assignment_status: {
    //                     [Op.in]: ['in_transit', 'in_transit_get_load']
    //                 }
    //             }
    //         });

    //         if (assignment) {
    //             const driverStop = DriverStop.findOne({where: {load_id: assignment.load_id}});

    //             if (!driverStop) {
    //                 return res.status(404).json({ message: 'Load not found', success: false });
    //             }

    //             if (assignment.assignment_status == 'in_transit') {

    //             }

    //             if (assignment.assignment_status == 'in_transit_get_load') {

    //             }




    //         }

    //         return res.status(200).json({ message: 'Driver is not on road', success: false });


    //     } catch (error) {
    //         console.error(error);
    //         return next(ApiError.internal("Error updating driver profile: " + error.message));
    //     }
    // }

    async arrivedLuggage(req, res, next) {
        const { user_id, load_id, current_longitude, current_latitude, start_longitude, start_latitude } = req.body;

        try {
            // Dastlab kerakli obyektlarni topish uchun barcha so'rovlarni parallel ravishda bajaramiz
            const [driver, load, assignment] = await Promise.all([
                Driver.findOne({ where: { user_id } }),
                Load.findByPk(load_id),
                Assignment.findOne({ where: { load_id } })
            ]);

            // Haydovchi topilmasa
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found', success: false });
            }

            // Yuk topilmasa
            if (!load) {
                return res.status(404).json({ message: 'Load not found', success: false });
            }

            // Tayinlangan vazifa topilmasa
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found', success: false });
            }

            // Masofani hisoblash va tekshirish
            const distance = utilFunctions.calculateDistance(
                { latitude: current_latitude, longitude: current_longitude },
                { latitude: start_latitude, longitude: start_longitude }
            );

            if (distance >= 150 || !distance) {
                return res.status(200).json({ message: 'Siz hali manzilga yetib kelmadingiz', success: false });
            }

            // Holatlarni yangilash
            await Promise.all([
                assignment.update({ assignment_status: "arrived_picked_up" }),
                load.update({ load_status: "arrived_picked_up" })
            ]);

            return res.status(200).json({ success: true, message: 'Siz manzilga yetib keldingiz' });
        } catch (error) {
            console.error("Error updating driver status:", error);
            return next(ApiError.internal("Yukni olishga yetib kelishda muammo bor."));
        }
    }

    async arrivingToGetLoad(req, res, next) {
        const { user_id, load_id } = req.body;

        try {
            // Dastlab kerakli obyektlarni topish uchun barcha so'rovlarni parallel ravishda bajaramiz
            const [driver, load, assignment] = await Promise.all([
                Driver.findOne({ where: { user_id } }),
                Load.findByPk(load_id),
                Assignment.findOne({ where: { load_id } })
            ]);

            // Haydovchi topilmasa
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found', success: false });
            }

            // Yuk topilmasa
            if (!load) {
                return res.status(404).json({ message: 'Load not found', success: false });
            }

            // Tayinlangan vazifa topilmasa
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found', success: false });
            }

            // Holatlarni yangilash
            await Promise.all([
                assignment.update({ assignment_status: "in_transit_get_load" }),
                load.update({ load_status: "in_transit_get_load" })
            ]);

            return res.status(200).json({ success: true, message: 'Haydovchi yukni olish uchun yolga chiqdi' });
        } catch (error) {
            console.error("Error updating driver status:", error);
            return next(ApiError.internal("Yukni olishga yetib kelishda muammo bor."));
        }
    }

    async startLoading(req, res, next) {
        const { user_id, load_id } = req.body;

        try {
            // Dastlab kerakli obyektlarni topish uchun barcha so'rovlarni parallel ravishda bajaramiz
            const [driver, load, assignment] = await Promise.all([
                Driver.findOne({ where: { user_id } }),
                Load.findByPk(load_id),
                Assignment.findOne({ where: { load_id } })
            ]);

            // Haydovchi topilmasa
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found', success: false });
            }

            // Yuk topilmasa
            if (!load) {
                return res.status(404).json({ message: 'Load not found', success: false });
            }

            // Tayinlangan vazifa topilmasa
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found', success: false });
            }

            // Holatlarni yangilash
            await Promise.all([
                assignment.update({ assignment_status: "picked_up" }),
                load.update({ load_status: "picked_up" })
            ]);

            return res.status(200).json({ success: true, message: 'Siz manzilga yetib keldingiz' });
        } catch (error) {
            console.error("Error updating driver status:", error);
            return next(ApiError.internal("Yukni olishga yetib kelishda muammo bor."));
        }
    }

    async getLoadStatus(req, res, next) {
        const { user_id, load_id } = req.body;

        try {
            // Dastlab kerakli obyektlarni topish uchun barcha so'rovlarni parallel ravishda bajaramiz
            const [driver, load, assignment] = await Promise.all([
                Driver.findOne({ where: { user_id } }),
                Load.findByPk(load_id),
                Assignment.findOne({ where: { load_id } })
            ]);

            // Haydovchi topilmasa
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found', success: false });
            }

            // Yuk topilmasa
            if (!load) {
                return res.status(404).json({ message: 'Load not found', success: false });
            }

            // Tayinlangan vazifa topilmasa
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found', success: false });
            }

            return res.status(200).json({ success: true, status: load.load_status });

        } catch (error) {
            console.error("Error updating driver status:", error);
            return next(ApiError.internal("Yukni olishga yetib kelishda muammo bor."));
        }
    }

    async finishLoadPickup(req, res, next) {
        const { user_id, load_id } = req.body;

        try {
            // Dastlab kerakli obyektlarni topish uchun barcha so'rovlarni parallel ravishda bajaramiz
            const [driver, load, assignment] = await Promise.all([
                Driver.findOne({ where: { user_id } }),
                Load.findByPk(load_id),
                Assignment.findOne({ where: { load_id } })
            ]);

            // Haydovchi topilmasa
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found', success: false });
            }

            // Yuk topilmasa
            if (!load) {
                return res.status(404).json({ message: 'Load not found', success: false });
            }

            // Tayinlangan vazifa topilmasa
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found', success: false });
            }

            // Holatlarni yangilash
            await Promise.all([
                assignment.update({ assignment_status: "in_transit" }),
                load.update({ load_status: "in_transit" })
            ]);

            return res.status(200).json({ success: true, message: 'Yuklash nihoyasiga yetdi.' });
        } catch (error) {
            console.error("Error updating driver status:", error);
            return next(ApiError.internal("Yukni olishga yetib kelishda muammo bor."));
        }
    }

    async finishTrip(req, res, next) {

        const { user_id, load_id, current_longitude, current_latitude, start_longitude, start_latitude } = req.body;

        try {
            // Dastlab kerakli obyektlarni topish uchun barcha so'rovlarni parallel ravishda bajaramiz
            const [driver, load, assignment] = await Promise.all([
                Driver.findOne({ where: { user_id } }),
                Load.findByPk(load_id),
                Assignment.findOne({ where: { load_id } })
            ]);

            // Haydovchi topilmasa
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found', success: false });
            }

            // Yuk topilmasa
            if (!load) {
                return res.status(404).json({ message: 'Load not found', success: false });
            }

            // Tayinlangan vazifa topilmasa
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found', success: false });
            }

            // Masofani hisoblash va tekshirish
            const distance = utilFunctions.calculateDistance(
                { latitude: current_latitude, longitude: current_longitude },
                { latitude: start_latitude, longitude: start_longitude }
            );

            if (distance >= 150 || !distance) {
                return res.status(200).json({ message: 'Siz hali manzilga yetib kelmadingiz', success: false });
            }

            // Holatlarni yangilash
            await Promise.all([
                assignment.update({ assignment_status: "delivered" }),
                load.update({ load_status: "delivered" }),
                driver.update({ driver_status: "empty" })
            ]);

            return res.status(200).json({ success: true, message: 'Siz manzilga yetib keldingiz' });
        } catch (error) {
            console.error("Error updating driver status:", error);
            return next(ApiError.internal("Yukni olishga yetib kelishda muammo bor."));
        }


    }

    async getDriverLocation(req, res, next) {
        const { load_id, user_id } = req.query;

        try {
            // Validatsiya
            if (!load_id || !user_id) {
                return res.status(400).json({ message: "load_id va user_id talab qilinadi." });
            }

            // User va yuk o'rtasidagi aloqani tekshirish
            const load = await Load.findOne({
                where: { id: load_id, user_id },
            });

            if (!load) {
                return res.status(403).json({
                    message: "Bu yuk sizga tegishli emas yoki topilmadi.",
                });
            }

            // Yukga tayinlangan haydovchini olish
            const driver = await Driver.findOne({
                where: {
                    id: load_id, // Yukka tayinlangan haydovchini topish
                },
            });

            if (!driver) {
                return res.status(404).json({
                    message: "Yuk uchun haydovchi topilmadi.",
                });
            }

            // Haydovchining oxirgi 5 ta lokatsiyasini olish
            const locations = await Location.findAll({
                where: { load_id },
                order: [["recordedAt", "DESC"]], // Eng oxirgi yozuvlarni olish
                limit: 5, // Faqat 5 ta ma'lumotni qaytarish
            });

            if (locations.length === 0) {
                return res.status(404).json({
                    message: "Haydovchining lokatsiyalari topilmadi.",
                });
            }

            // Natijani qaytarish
            return res.status(200).json({
                driver_id: driver.id,
                locations,
            });
        } catch (error) {
            console.error("Xatolik:", error);
            return res.status(500).json({ message: "Server xatosi yuz berdi." });
        }
    }


}

module.exports = new DriverControllers();
