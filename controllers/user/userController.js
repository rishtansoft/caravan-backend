const { Users, Driver, UserRegister } = require("../../models/index");
const ApiError = require("../../error/ApiError");
const validateFun = require("./validateFun");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require("dotenv").config();

class UserControllers {
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await Users.findByPk(userId, {
        attributes: [
          "id",
          "firstname",
          "lastname",
          "phone",
          "email",
          "birthday",
          "user_img",
          "address",
        ],
      });
      if (!user) {
        return next(ApiError.notFound("User not found"));
      }
      return res.status(200).json(user);
    } catch (error) {
      next(ApiError.internal("Error fetching profile: " + error.message));
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const { firstname, lastname, phone, email, birthday, address, user_img } =
        req.body;

      const user = await Users.findByPk(userId);
      if (!user) {
        return next(ApiError.notFound("User not found"));
      }

      user.firstname = firstname || user.firstname;
      user.lastname = lastname || user.lastname;
      user.phone = phone || user.phone;
      user.email = email || user.email;
      user.birthday = birthday || user.birthday;
      user.address = address || user.address;
      user.user_img = user_img || user.user_img;

      await user.save();

      return res
        .status(200)
        .json({ message: "Profile updated successfully", user });
    } catch (error) {
      next(ApiError.internal("Error updating profile: " + error.message));
    }
  }

  async initialRegistration(req, res, next) {
    try {
      const { phone, password, lastname, firstname, password_rep } = req.body;

       // Validate inputs
      if (!lastname) {
        return next(ApiError.badRequest("Lastname was not entered"));
      }
      if (!firstname) {
        return next(ApiError.badRequest("Firstname was not entered"));
      }
      if (!password) {
        return next(ApiError.badRequest("password was not entered"));
      }
       if (!password_rep) {
        return next(ApiError.badRequest("password_rep was not entered"));
      }

      if (password !== password_rep) {
        return next(
          ApiError.badRequest("Passwords do not match")
        );
      }

      if (!validateFun.validatePhoneNumber(phone)) {
        return next(
          ApiError.badRequest("Phone number is not formatted correctly")
        );
      }


      const existingUser = await Users.findOne({
        where: {
          phone: phone,
          [Op.or]: [
            { user_status: "active" },
            { user_status: "pending" },
            { user_status: "confirm_phone" },
          ],
          },
      });

      if (existingUser) {
        return next(ApiError.badRequest("This phone number is already registered."));
      }


      req.session.initialRegistration = { phone, password, lastname, firstname };

      return res.json({ message: "Initial registration successful. Please complete your profile." });
      
    } catch (error) {
      console.log(error);
      return next(ApiError.internal("User registration error " + error.message))
      
    }
  }

  async completeRegistration(req, res, next) {
    try {

        const { phone_2, birthday, role } = req.body;
    const { phone, password, lastname, firstname } = req.session.initialRegistration;
      
       // Validate inputs
      if (!role) {
        return next(ApiError.badRequest("role was not entered"));
      }
      if (!birthday) {
        return next(ApiError.badRequest("birthday was not entered"));
      }
     

      if (!validateFun.validatePhoneNumber(phone_2)) {
        return next(
          ApiError.badRequest("Phone number is not formatted correctly")
        );
      }

    const smsCode = helperFunctions.generateRandomCode();

    const newUser = await Users.create({
      lastname,
      firstname,
      phone,
      phone_2,
      password,
      birthday,
      role,
      verification_code: smsCode,
      user_status: "confirm_phone",
    });

     if (role === 'driver') {
      await Driver.create({
        user_id: newUser.id,
        birthday: birthday,
        car_type: '',
        name: '',
        tex_pas_ser: '',
        prava_ser: '',
        tex_pas_num: '',
        prava_num: '',
        driver_status: 'offline',
        is_approved: false,
      });
    }

    await UserRegister.create({
      code: smsCode,
      user_id: newUser.id,
    });

    delete req.session.initialRegistration;


    return res.json({
      message: "Registration complete. Please verify your phone number.",
      user_id: newUser.id,
      smsCode: smsCode
    });
      
      
    } catch (error) {
      console.log(error);
      return next(ApiError.internal("User registration error " + error.message))
      
    }
  }

  async  verifyPhone(req, res, next) {
    try {
      const { user_id, code } = req.body;

      const user = await Users.findByPk(user_id);
      if (!user) {
        return next(ApiError.badRequest("User not found"));
      }

      const userRegister = await UserRegister.findOne({
        where: { user_id, code, status: 'active' }
      });

      if (!userRegister) {
        return next(ApiError.badRequest("Invalid or expired verification code"));
      }


      await user.update({ user_status: "active" });
      await userRegister.update({ status: "inactive" });

      return res.json({ message: "Phone number verified successfully. You can now log in." });
    } catch (error) {
      console.error(error);
      return next(ApiError.internal("Phone verification error"));
    }
  }

  async login(req, res, next) {
    try {
      const { phone, password } = req.body;

      const user = await Users.findOne({where: {phone}})

      if(!user) {
        return next(ApiError.badRequest("User not found"))
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if(!isPasswordValid)  return next(ApiError.badRequest("Invalid password"));

      
      const token = jwt.sign(
        { id: user.id, phone: user.phone, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({ token, user_id: user.id, role: user.role });
      
    } catch (error) {
      console.log("Login error " + error.message);
      return next(ApiError.internal("Login error " + error.message))
    }
  }

}

module.exports = new UserControllers();
