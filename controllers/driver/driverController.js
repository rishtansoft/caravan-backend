const { Users, Driver } = require("../../models/index");
const ApiError = require("../../error/ApiError");

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
                    phone: user.phone,
                    role: user.role,
                    user_status: user.user_status,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
                driver: {
                    id: driverProfile.id,
                    car_type: driverProfile.car_type,
                    name: driverProfile.name,
                    tex_pas_ser: driverProfile.tex_pas_ser,
                    prava_ser: driverProfile.prava_ser,
                    tex_pas_num: driverProfile.tex_pas_num,
                    prava_num: driverProfile.prava_num,
                    car_img: driverProfile.car_img,
                    prava_img: driverProfile.prava_img,
                    tex_pas_img: driverProfile.tex_pas_img,
                    driver_status: driverProfile.driver_status,
                    is_approved: driverProfile.is_approved,
                    blocked: driverProfile.blocked,
                    createdAt: driverProfile.createdAt,
                    updatedAt: driverProfile.updatedAt,
                }
            });
        } catch (error) {
            console.error(error);
            return next(ApiError.internal("Error fetching driver profile: " + error.message));
        }
    }

    async updateDriverProfile(req, res, next) {
        try {
            const { user_id } = req.params;
            const {
                firstname,
                lastname,
                email,
                phone,
                role,
                user_status,
                car_type,
                name,
                tex_pas_ser,
                prava_ser,
                tex_pas_num,
                prava_num,
                car_img,
                prava_img,
                tex_pas_img,
                driver_status,
            } = req.body;


            const user = await Users.findByPk(user_id);

            if (!user) {
                return next(ApiError.badRequest("User not found"));
            }

            // Foydalanuvchi driver bo'lishini tekshirish
            if (user.role !== "driver") {
                return next(ApiError.badRequest("The user is not a driver"));
            }

            // `Driver` jadvalidan foydalanuvchiga tegishli ma'lumotlarni olish
            const driverProfile = await Driver.findOne({
                where: { user_id },
            });

            if (!driverProfile) {
                return next(ApiError.badRequest("Driver profile not found for this user"));
            }

            // Foydalanuvchi ma'lumotlarini yangilash (kelgan fieldlar bo'yicha)
            await user.update({
                firstname: firstname || user.firstname, // Agar yangi qiymat kelgan bo'lsa, o'zgartir, aks holda eski qiymatni saqlab qol
                lastname: lastname || user.lastname,
                email: email || user.email,
                phone: phone || user.phone,
                role: role || user.role,
                user_status: user_status || user.user_status,
            });

            // Driver profilini yangilash
            await driverProfile.update({
                car_type: car_type || driverProfile.car_type,
                name: name || driverProfile.name,
                tex_pas_ser: tex_pas_ser || driverProfile.tex_pas_ser,
                prava_ser: prava_ser || driverProfile.prava_ser,
                tex_pas_num: tex_pas_num || driverProfile.tex_pas_num,
                prava_num: prava_num || driverProfile.prava_num,
                car_img: car_img || driverProfile.car_img,
                prava_img: prava_img || driverProfile.prava_img,
                tex_pas_img: tex_pas_img || driverProfile.tex_pas_img,
                driver_status: driver_status || driverProfile.driver_status,
            });

            // Yangi ma'lumotlarni qaytarish
            return res.json({
                message: "Driver profile updated successfully",
                user: {
                    id: user.id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    user_status: user.user_status,
                },
                driver: {
                    id: driverProfile.id,
                    car_type: driverProfile.car_type,
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



}

module.exports = new DriverControllers();
