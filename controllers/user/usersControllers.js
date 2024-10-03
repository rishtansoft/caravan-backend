const { Users, UserRegister, Driver } = require("../../models/index");
const ApiError = require("../../error/ApiError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const validate = require("./validateFun");
const helperFunctions = require("./helperFunctions");
const generateJwt = ({ id, role, phone }) => {
  return jwt.sign({ id, phone: phone, role: role }, process.env.SECRET_KEY, {
    expiresIn: "1440m",
  });
};

class UserControllers {
  async userAdd(req, res, next) {
    try {
      const {
        lastname,
        firstname,
        phone,
        phone_2,
        password,
        password_rep,
        role,
      } = req.body;

      // Validate inputs
      if (!lastname) {
        return next(ApiError.badRequest("Lastname was not entered"));
      }
      if (!firstname) {
        return next(ApiError.badRequest("Firstname was not entered"));
      }
      if (!role) {
        return next(ApiError.badRequest("role was not entered"));
      }

      if (!password || !password_rep || password !== password_rep) {
        return next(
          ApiError.badRequest("Passwords do not match or are not provided")
        );
      }

      if (!validate.validatePhoneNumber(phone)) {
        return next(
          ApiError.badRequest("Phone number is not formatted correctly")
        );
      }

      const existingUser = await Users.findOne({
        where: {
          phone: phone,
          [Op.or]: [{ user_status: "active" }, { user_status: "pending" }],
        },
      });

      if (existingUser) {
        return next(
          ApiError.badRequest("This phone number is already registered")
        );
      }

      const smsCode = helperFunctions.generateRandomCode();

      // Create a new user
      const newUser = await Users.create({
        lastname,
        firstname,
        phone,
        phone_2,
        password,
        verification_code: smsCode,
        role,
        user_status: "confirm_phone",
      });

      console.log(newUser);

      // Save the verification code for the user
      const userReg = await UserRegister.create({
        code: smsCode,
        user_id: newUser.id,
      });

      // Return success response
      return res.json({
        code: smsCode,
        id: userReg.id,
        phone: phone,
        ur_id: newUser.id,
      });
    } catch (error) {
      console.log(error.stack);
      return next(
        ApiError.badRequest("User driver adding error: " + error.message)
      );
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
        address,
      } = req.body;
      const user_img = req.files["user_img"] ? req.files["user_img"][0] : false;
      if (!lastname) {
        return next(ApiError.badRequest("lastname was not entered"));
      }
      if (!firstname) {
        return next(ApiError.badRequest("firstname was not entered"));
      }
      if (!address) {
        return next(ApiError.badRequest("address was not entered"));
      }
      if (!phone) {
        return next(ApiError.badRequest("phone was not entered"));
      } else {
        const user_driver = await Users.findOne({
          where: {
            phone: phone,
            [Op.or]: [{ status: "active" }, { status: "pending" }],
          },
        });
        if (user_driver) {
          return next(
            ApiError.badRequest("This phone number is already registered")
          );
        }
      }
      if (birthday && !validate.isDate(birthday)) {
        return next(
          ApiError.badRequest("The birthday value was entered incorrectly")
        );
      }
      if (!password || !password_rep || password != password_rep) {
        return next(
          ApiError.badRequest(
            "The password value was entered incorrectly. Please check and login again"
          )
        );
      }
      if (user_img && !validate.is_img(user_img)) {
        return next(ApiError.badRequest("prava was not entered"));
      }
      const user_imgFormat = user_img
        ? user_img.buffer.toString("base64")
        : null;
      const smsCode = helperFunctions.generateRandomCode();
      const user_driver = await Users.create({
        password: password,
        lastname: lastname,
        firstname: firstname,
        phone: phone,
        birthday: password,
        user_img: user_imgFormat,
        address: address ? address : "",
        role: "cargo_owner",
      });

      const userReg = await UserRegister.create({
        code: smsCode,
        user_id: user_driver.id,
      });

      return res.json({
        code: smsCode,
        id: userReg.id,
      });
    } catch (error) {
      console.log(error.stack);
      return next(ApiError.badRequest("User cargo owner add error"));
    }
  }

  async smsCodeResed(req, res, next) {
    try {
      // const
    } catch (error) {
      console.log(error.stack);
      return next(ApiError.badRequest(error));
    }
  }

  async userRegisterActive(req, res, next) {
    try {
      const { id, code } = req.body;
      if (!id || !validate.isValidUUID(id)) {
        return next(
          ApiError.badRequest("The id value was entered incorrectly")
        );
      }

      const userReg = await UserRegister.findOne({
        where: {
          status: "active",
          id: id,
        },
      });

      if (!userReg) {
        return next(
          ApiError.badRequest("The id value was entered incorrectly")
        );
      }

      if (!code || !validate.validateCode(code) || code != userReg.code) {
        return next(
          ApiError.badRequest("The sms code value was entered incorrectly")
        );
      }

      const user = await Users.findOne({
        where: {
          status: "confirm_phone",
          id: userReg.user_id,
        },
      });

      const userID = await helperFunctions.generateUniqueUserId();

      user.status = "pending";
      user.userid = userID;
      userReg.status = "inactive";
      await user.save();
      await userReg.save();

      const resData = {
        id: user.id,
        role: user.role,
        user_reg: true,
      };

      return res.json(resData);
    } catch (error) {
      console.log(error.stack);
      return next(ApiError.badRequest(error));
    }
  }

  async userLogin(req, res, next) {
    try {
      const { phone, password } = req.body;
      if (!phone) {
        return next(ApiError.badRequest("phone was not entered"));
      }
      if (!password) {
        return next(
          ApiError.badRequest(
            "The password value was entered incorrectly. Please check and login again"
          )
        );
      }
      const user = await Users.findOne({
        where: {
          [Op.or]: [{ status: "active" }, { status: "pending" }],
          phone: phone,
        },
      });

      if (!user) {
        return next(ApiError.badRequest("User not found"));
      }

      if (user.password != password) {
        return next(ApiError("The password was entered incorrectly"));
      }

      if (user.status == "pending") {
        const smsCode = helperFunctions.generateRandomCode();
        const userReg = await UserRegister.create({
          code: smsCode,
          user_id: user_driver.id,
        });
        return res.json({
          code: smsCode,
          id: userReg.id,
          user_reg: false,
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
          role: user.role,
        };
        return res.json(resData);
      }
    } catch (error) {
      console.log(error.stack);
      return next(ApiError.badRequest("User driver login error"));
    }
  }

  async userPasswordChangSendCode(req, res, next) {
    try {
      const { phone } = req.body;
      if (!phone) {
        return next(ApiError.badRequest("phone was not entered"));
      }
      const user = await Users.findOne({
        where: {
          status: "active",
          phone: phone,
        },
      });

      if (!user) {
        return next(ApiError.badRequest("User not found"));
      }
      const smsCode = helperFunctions.generateRandomCode();
      const userReg = await UserRegister.create({
        code: smsCode,
        user_id: user.id,
      });

      return res.json({
        code: smsCode,
        id: userReg.id,
      });
    } catch (error) {
      console.log(error.stack);
      return next(ApiError.badRequest(error));
    }
  }

  async userPasswordChangCode(req, res, next) {
    try {
      const { id, code } = req.body;
      if (!id || !validate.isValidUUID(id)) {
        return next(
          ApiError.badRequest("The id value was entered incorrectly")
        );
      }

      const userReg = await UserRegister.findOne({
        where: {
          status: "active",
          id: id,
        },
      });

      if (!userReg) {
        return next(
          ApiError.badRequest("The id value was entered incorrectly")
        );
      }

      if (!code || !validate.validateCode(code) || code != userReg.code) {
        return next(
          ApiError.badRequest("The sms code value was entered incorrectly")
        );
      }

      const user = await Users.findOne({
        where: {
          // status: 'pending',
          id: userReg.user_id,
        },
      });

      userReg.status = "inactive";
      await userReg.save();

      const resData = {
        id: user.id,
        role: user.role,
        user_pasword_update: true,
      };

      return res.json(resData);
    } catch (error) {
      console.log(error.stack);
      return next(ApiError.badRequest(error));
    }
  }
}

module.exports = new UserControllers();
