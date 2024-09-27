const { Users, UserRegister, Driver } = require('../models/models')
const ApiError = require('../error/ApiError')
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userToken = require("./usetToken");
const { Op } = require("sequelize");
const validate = require('./validateFun')
const helperFunctions = require('./helperFunctions')
const generateJwt = ({ id, role, phone }) => {
    return jwt.sign({ id, phone: phone, role: role }, process.env.SECRET_KEY, {
        expiresIn: "1440m",
    });
};

class UserControllers {
    //-------------------------------------------------------------------
    async userAdd(req, res, next) {
        try {
            const {
                lastname,
                firstname,
                phone,
                password,
                password_rep,
                role
            } = req.body;

            if (!lastname) {
                return next(
                    ApiError.badRequest('lastname was not entered')
                )
            }
            if (!firstname) {
                return next(
                    ApiError.badRequest('firstname was not entered')
                )
            }
            const roles = ['driver', 'cargo_owner']
            if (!role || !roles.includes(role)) {
                return next(
                    ApiError.badRequest('role was not entered')
                )
            }
            if (!phone || !validate.validatePhoneNumber(phone)) {
                return next(
                    ApiError.badRequest('phone was not entered')
                )
            } else {
                const user_driver = await Users.findOne({
                    where: {
                        phone: phone,
                        [Op.or]: [
                            { status: 'active' },
                            { status: 'pending' },
                        ]
                    }
                });
                if (user_driver) {
                    return next(
                        ApiError.badRequest("This phone number is already registered")
                    )
                }
            }

            if ((!password || !password_rep) || (password != password_rep)) {
                return next(
                    ApiError.badRequest('The password value was entered incorrectly. Please check and login again')
                )
            }

            const hashPassword = await bcrypt.hash(password, 5);

            const smsCode = helperFunctions.generateRandomCode();

            const user_driver = await Users.create({
                lastname: lastname,
                firstname: firstname,
                phone: phone,
                role: role,
                password: hashPassword
            });

            const userReg = await UserRegister.create({
                code: smsCode,
                user_id: user_driver.id
            });


            return res.json({
                code: smsCode,
                id: userReg.id,
                phone: phone,
                ur_id: user_driver.id

            })

        } catch (error) {
            console.log(error.stack);
            return next(
                ApiError.badRequest("User driver add error")
            )
        }
    } // user qo'shsih 

    async userUpdateAdd(req, res, next) {
        try {
            const {
                id,
                lastname,
                firstname,
                phone,
                password,
                password_rep,
                role
            } = req.body;

            if (!id || !validate.isValidUUID(id)) {
                return next(
                    ApiError.badRequest("The id value was entered incorrectly")
                )
            }
            const user = await Users.findOne({
                where: {
                    status: 'cargo_owner',
                    id: id
                }
            });

            if (!user) {
                return next(
                    ApiError.badRequest("User not found")
                )
            }


            if (!lastname) {
                return next(
                    ApiError.badRequest('lastname was not entered')
                )
            }
            if (!firstname) {
                return next(
                    ApiError.badRequest('firstname was not entered')
                )
            }
            const roles = ['driver', 'cargo_owner']
            if (!role || !roles.includes(role)) {
                return next(
                    ApiError.badRequest('role was not entered')
                )
            }
            if (!phone || !validate.validatePhoneNumber(phone)) {
                return next(
                    ApiError.badRequest('phone was not entered')
                )
            } else {
                const user_driver = await Users.findOne({
                    where: {
                        phone: phone,
                        [Op.or]: [
                            { status: 'active' },
                            { status: 'pending' },
                        ]
                    }
                });
                if (user_driver) {
                    return next(
                        ApiError.badRequest("This phone number is already registered")
                    )
                }
            }

            if ((!password || !password_rep) || (password != password_rep)) {
                return next(
                    ApiError.badRequest('The password value was entered incorrectly. Please check and login again')
                )
            }

            const hashPassword = await bcrypt.hash(password, 5);

            const smsCode = helperFunctions.generateRandomCode();

            user.lastname = lastname,
                user.firstname = firstname,
                user.phone = phone,
                user.role = role,
                user.password = hashPassword
            await user.save();
            const userReg = await UserRegister.create({
                code: smsCode,
                user_id: user.id
            });


            return res.json({
                code: smsCode,
                id: userReg.id,
                phone: phone,
                ur_id: user.id
            })

        } catch (error) {
            console.log(error.stack);
            return next(
                ApiError.badRequest("User driver add error")
            )
        }
    } // user qo'shida dagi hato kiritlga qiymaytlanri o'zgartirish

    //-------------------------------------------------------------------



    /*
        async user2Add(req, res, next) {
            try {
                const {
                    lastname,
                    firstname,
                    phone,
                    birthday,
                    tex_pas_id,
                    prava,
                    password,
                    password_rep,
                    address
                } = req.body;
                const user_img = req.files['user_img'] ? req.files['user_img'][0] : false;
                const car_img = req.files['car_img'] ? req.files['car_img'][0] : false;
                if (!lastname) {
                    return next(
                        ApiError.badRequest('lastname was not entered')
                    )
                }
                if (!firstname) {
                    return next(
                        ApiError.badRequest('firstname was not entered')
                    )
                }
                if (!phone) {
                    return next(
                        ApiError.badRequest('phone was not entered')
                    )
                } else {
                    const user_driver = await Users.findOne({
                        where: {
                            phone: phone,
                            [Op.or]: [
                                { status: 'active' },
                                { status: 'pending' },
                            ]
                        }
                    });
                    if (user_driver) {
                        return next(
                            ApiError.badRequest("This phone number is already registered")
                        )
                    }
                }
                if (birthday && !validate.isDate(birthday)) {
                    return next(
                        ApiError.badRequest('The birthday value was entered incorrectly')
                    )
                }
                if (!tex_pas_id) {
                    return next(
                        ApiError.badRequest('tex_pas_id was not entered')
                    )
                }
                if (!prava) {
                    return next(
                        ApiError.badRequest('prava was not entered')
                    )
                }
                if ((!password || !password_rep) || (password != password_rep)) {
                    return next(
                        ApiError.badRequest('The password value was entered incorrectly. Please check and login again')
                    )
                }
    
                if (user_img && !validate.is_img(user_img)) {
                    return next(
                        ApiError.badRequest('prava was not entered')
                    )
                }
    
                if (car_img && !validate.is_img(car_img)) {
                    return next(
                        ApiError.badRequest('prava was not entered')
                    )
                }
    
                const user_imgFormat = user_img ? user_img.buffer.toString('base64') : null
                const car_imgFormat = car_img ? car_img.buffer.toString('base64') : null
    
                const smsCode = helperFunctions.generateRandomCode();
    
                const user_driver = await Users.create({
                    password: password,
                    lastname: lastname,
                    firstname: firstname,
                    phone: phone,
                    birthday: password,
                    user_img: user_imgFormat,
                    address: address ? address : '',
                    role: 'driver'
                });
    
                const driver = await Driver.create({
                    tex_pas_id: tex_pas_id,
                    prava: prava,
                    car_img: car_imgFormat,
                    user_id: user_driver.id
                })
    
                const userReg = await UserRegister.create({
                    code: smsCode,
                    user_id: user_driver.id
                });
    
    
                return res.json({
                    "code": smsCode,
                    "id": userReg.id,
    
                })
    
            } catch (error) {
                console.log(error.stack);
                return next(
                    ApiError.badRequest("User driver add error")
                )
            }
        }
    
        async userLoadAdd(req, res, next) {
            try {
                const {
                    lastname,
                    firstname,
                    phone,
                    birthday,
                    password,
                    password_rep,
                    address
                } = req.body;
                const user_img = req.files['user_img'] ? req.files['user_img'][0] : false;
                if (!lastname) {
                    return next(
                        ApiError.badRequest('lastname was not entered')
                    )
                }
                if (!firstname) {
                    return next(
                        ApiError.badRequest('firstname was not entered')
                    )
                }
                if (!address) {
                    return next(
                        ApiError.badRequest('address was not entered')
                    )
                }
                if (!phone) {
                    return next(
                        ApiError.badRequest('phone was not entered')
                    )
                } else {
                    const user_driver = await Users.findOne({
                        where: {
                            phone: phone,
                            [Op.or]: [
                                { status: 'active' },
                                { status: 'pending' },
                            ]
                        }
                    });
                    if (user_driver) {
                        return next(
                            ApiError.badRequest("This phone number is already registered")
                        )
                    }
                }
                if (birthday && !validate.isDate(birthday)) {
                    return next(
                        ApiError.badRequest('The birthday value was entered incorrectly')
                    )
                }
                if ((!password || !password_rep) || (password != password_rep)) {
                    return next(
                        ApiError.badRequest('The password value was entered incorrectly. Please check and login again')
                    )
                }
                if (user_img && !validate.is_img(user_img)) {
                    return next(
                        ApiError.badRequest('prava was not entered')
                    )
                }
                const user_imgFormat = user_img ? user_img.buffer.toString('base64') : null
                const smsCode = helperFunctions.generateRandomCode();
                const user_driver = await Users.create({
                    password: password,
                    lastname: lastname,
                    firstname: firstname,
                    phone: phone,
                    birthday: password,
                    user_img: user_imgFormat,
                    address: address ? address : '',
                    role: 'cargo_owner'
                });
    
                const userReg = await UserRegister.create({
                    code: smsCode,
                    user_id: user_driver.id
                });
    
                return res.json({
                    "code": smsCode,
                    "id": userReg.id,
    
                })
    
            } catch (error) {
                console.log(error.stack);
                return next(
                    ApiError.badRequest("User cargo owner add error")
                )
            }
        }
    */

    //-------------------------------------------------------------------

    async smsCodeResedUserAdd(req, res, next) {
        try {
            const { id } = req.body;
            if (!id || !validate.isValidUUID(id)) {
                return next(
                    ApiError.badRequest("The id value was entered incorrectly")
                )
            }

            const userReg = await UserRegister.findOne({
                where: {
                    status: 'active',
                    id: id
                }
            });

            if (!userReg) {
                return next(
                    ApiError.badRequest("The id value was entered incorrectly")
                )
            }

            const user = await Users.findOne({
                where: {
                    status: 'confirm_phone',
                    id: userReg.user_id
                }
            });

            if (!user) {
                return next(
                    ApiError.badRequest("User not found")
                )
            }

            const smsCode = helperFunctions.generateRandomCode();

            const userNewReg = await UserRegister.create({
                code: smsCode,
                user_id: user.id
            });

            return res.json({
                id: userNewReg.id,
                code: smsCode
            })


        } catch (error) {
            console.log(error.stack);
            return next(
                ApiError.badRequest(error)
            )
        }
    } // user qo'shida  sms ko'd kelmasa resed qilish 

    async userRegisterActive(req, res, next) {
        try {
            const { id, code } = req.body;
            if (!id || !validate.isValidUUID(id)) {
                return next(
                    ApiError.badRequest("The id value was entered incorrectly")
                )
            }

            const userReg = await UserRegister.findOne({
                where: {
                    status: 'active',
                    id: id
                }
            });

            if (!userReg) {
                return next(
                    ApiError.badRequest("The id value was entered incorrectly")
                )
            }

            if (!code || !validate.validateCode(code) || code != userReg.code) {
                return next(
                    ApiError.badRequest("The sms code value was entered incorrectly")
                )
            }

            const user = await Users.findOne({
                where: {
                    status: 'confirm_phone',
                    id: userReg.user_id
                }
            });

            const userID = await helperFunctions.generateUniqueUserId()


            user.status = 'pending';
            user.userid = userID;
            userReg.status = 'inactive';
            await user.save()
            await userReg.save()

            const resData = {
                id: user.id,
                role: user.role,
                user_reg: true,
            };

            return res.json(resData);

        } catch (error) {
            console.log(error.stack);
            return next(
                ApiError.badRequest(error)
            )
        }
    } // user qo'shida sms code orali userni telefon raqamni tasdiqlash 

    //-------------------------------------------------------------------




    //--------------------------------------------------------------------

    async userLogin(req, res, next) {
        try {
            const { phone, password } = req.body;
            if (!phone) {
                return next(
                    ApiError.badRequest('phone was not entered')
                )
            }
            if (!password) {
                return next(
                    ApiError.badRequest('The password value was entered incorrectly. Please check and login again')
                )
            }
            const user = await Users.findOne({
                where: {
                    [Op.or]: [
                        { status: 'active' },
                        { status: 'pending' },
                    ],
                    phone: phone
                }
            });

            if (!user) {
                return next(
                    ApiError.badRequest('User not found')
                )
            };

            let comparePassword = bcrypt.compareSync(password, user.password);


            if (!comparePassword) {
                return next(
                    ApiError('The password was entered incorrectly')
                )
            }

            if (user.status == 'pending') {

                return res.json({
                    role: user.role,
                    id: user.id,
                    user_reg: false
                });

            } else {
                const token = generateJwt({
                    id: user.id,
                    phone: user.phone,
                    role: user.role,
                });

                const resData = {
                    user_reg: true,
                    token: token,
                    id: user.id,
                    role: user.role
                };
                return res.json(resData)
            }


        } catch (error) {
            console.log(error.stack);
            return next(
                ApiError.badRequest("User driver login error")
            )
        }
    } // user login qilish 


    //--------------------------------------------------------------------

    async userPasswordChangSendCode(req, res, next) {
        try {
            const { phone } = req.body;
            if (!phone || !validate.validatePhoneNumber(phone)) {
                return next(
                    ApiError.badRequest('phone was not entered')
                )
            }

            const user = await Users.findOne({
                where: {
                    [Op.or]: [
                        { status: 'active' },
                        { status: 'pending' },
                    ],
                    phone: phone
                }
            });

            if (!user) {
                return next(
                    ApiError.badRequest('User not found')
                )
            };
            const smsCode = helperFunctions.generateRandomCode();
            const userReg = await UserRegister.create({
                code: smsCode,
                user_id: user.id
            });

            return res.json({
                code: smsCode,
                id: userReg.id,

            });

        } catch (error) {
            console.log(error.stack);
            return next(
                ApiError.badRequest(error)
            )
        }
    }

    async userPasswordChangCode(req, res, next) {
        try {
            const { id, code } = req.body;
            if (!id || !validate.isValidUUID(id)) {
                return next(
                    ApiError.badRequest("The id value was entered incorrectly")
                )
            }

            const userReg = await UserRegister.findOne({
                where: {
                    status: 'active',
                    id: id
                }
            });

            if (!userReg) {
                return next(
                    ApiError.badRequest("The id value was entered incorrectly")
                )
            }

            if (!code || !validate.validateCode(code) || code != userReg.code) {
                return next(
                    ApiError.badRequest("The sms code value was entered incorrectly")
                )
            }

            const user = await Users.findOne({
                where: {
                    [Op.or]: [
                        { status: 'active' },
                        { status: 'pending' },
                    ],
                    id: userReg.user_id
                }
            });

            if (!user) {
                return next(
                    ApiError.badRequest("User not found")
                )
            }


            userReg.status = 'inactive';
            await userReg.save()



            const resData = user.status == "pending" ? {
                id: user.id,
                role: user.role,
                user_pasword_update: true,
                // user_reg: false
            } : {
                id: user.id,
                role: user.role,
                user_pasword_update: true,
                // user_reg: true
            }

            return res.json(resData);

        } catch (error) {
            console.log(error.stack);
            return next(
                ApiError.badRequest(error)
            )
        }
    }

    async userPasswordChang(req, res, next) {
        try {
            const { password,
                password_rep,
                id
            } = req.body;

            if (!id || !validate.isValidUUID(id)) {
                return next(
                    ApiError.badRequest("The id value was entered incorrectly")
                )
            }
            const user = await Users.findOne({
                where: {
                    [Op.or]: [
                        { status: 'active' },
                        { status: 'pending' },
                    ],
                    id: id
                }
            });

            if (!user) {
                return next(
                    ApiError.badRequest("user not found")
                )
            }


            if ((!password || !password_rep) || (password != password_rep)) {
                return next(
                    ApiError.badRequest('The password value was entered incorrectly. Please check and login again')
                )
            }

            const hashPassword = await bcrypt.hash(password, 5);

            user.password == hashPassword;
            await user.save();

            return res.json({
                message: 'password update is done',
                in_update: true
            })

        } catch (error) {
            console.log(error.stack);
            return next(
                ApiError.badRequest(error)
            )
        }
    }

    //-------------------------------------------------------------------


}

module.exports = new UserControllers();
