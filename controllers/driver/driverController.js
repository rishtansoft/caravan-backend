const { Users, Driver, CarType } = require("../../models/index");
const ApiError = require("../../error/ApiError");
const utilFunctions = require('../../utils/index');

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
            const { user_id } = req.query;
            console.log(71, user_id);
            
            const {
                firstname,
                lastname,
                email,
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

            await driverProfile.update({
                car_type: car_type || driverProfile.car_type,
                name: name || driverProfile.name,
                tex_pas_ser: tex_pas_ser || driverProfile.tex_pas_ser,
                prava_ser: prava_ser || driverProfile.prava_ser,
                tex_pas_num: tex_pas_num || driverProfile.tex_pas_num,
                prava_num: prava_num || driverProfile.prava_num
            });

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
