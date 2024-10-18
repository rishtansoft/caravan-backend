const { Users, Driver, UserRegister } = require("../../models/index");
const ApiError = require("../../error/ApiError");
const validateFun = require("./validateFun");
const { Op } = require("sequelize");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helperFunctions = require("./helperFunctions");
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
        return next(ApiError.badRequest("Password was not entered"));
      }
      if (!password_rep) {
        return next(ApiError.badRequest("Password_rep was not entered"));
      }
      if (password !== password_rep) {
        return next(ApiError.badRequest("Passwords do not match"));
      }

      if (!validateFun.validatePhoneNumber(phone)) {
        return next(ApiError.badRequest("Phone number is not formatted correctly"));
      }

      // Foydalanuvchining mavjudligini tekshirish
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
        if (existingUser.user_status === "pending" || existingUser.user_status === "confirm_phone") {
          return res.status(400).json({
            message: "You have already started the registration process. Please complete it.",
            user_id: existingUser.id
          });
        }
        return next(ApiError.badRequest("This phone number is already registered and active."));
      }

      const newUser = await Users.create({
        lastname,
        firstname,
        phone,
        // password: hashedPassword, // Hashed parolni saqlaymiz
        password: password, // Hashed parolni saqlaymiz
        user_status: "pending" // Foydalanuvchi hali ro'yxatdan to'liq o'tmagan
      });

      return res.json({
        message: "Initial registration successful. Please complete your profile.",
        user_id: newUser.id
      });


    } catch (error) {
      console.error("Registration error: ", error);
      return next(ApiError.internal("User registration error " + error.message));
    }
  }

  async completeRegistration(req, res, next) {
    try {
      const { user_id, phone_2, birthday, role } = req.body;

      const user = await Users.findOne({
        where: {
          id: user_id
        }
      });

      if (!user) {
        return next(ApiError.badRequest("User not found or registration not started."));
      }

      // Tekshirish: foydalanuvchi hali `confirm_phone` holatida bo'lsa
      if (user.user_status === "confirm_phone") {
        const currentTime = new Date();

        // SMS kod muddati tugaganligini tekshirish
        if (user.verification_code_expiration && currentTime > user.verification_code_expiration) {
          // SMS kod muddati tugagan bo'lsa, yangi kod generatsiya qilish
          const smsCode = helperFunctions.generateRandomCode();
          const expirationTime = new Date();
          expirationTime.setMinutes(expirationTime.getMinutes() + 1); // SMS kod 1 daqiqa davomida amal qiladi

          // Yangi SMS kod va muddatni yangilash
          await user.update({
            verification_code: smsCode,
            verification_code_expiration: expirationTime,
          });

          // Tasdiqlash kodini alohida jadvalga yozish
          await UserRegister.create({
            code: smsCode,
            user_id: user.id,
            expiration: expirationTime,
          });

          return res.json({
            message: "Your previous SMS code has expired. A new SMS code has been sent. Please verify your phone number.",
            user_id: user.id,
            smsCode: smsCode // SMS kodni API javobida yubormaslik tavsiya qilinadi, lekin bu testlash uchun kiritilgan
          });
        } else {
          // Agar SMS kod hali amal qilsa, tasdiqlashni talab qiluvchi xabar qaytarish
          return next(ApiError.badRequest("You have already completed this step. Please verify your phone number using the SMS code."));
        }
      }

      // Tekshirish: foydalanuvchi holati `pending` bo'lmasa, ro'yxat davom ettirilmasin
      if (user.user_status !== "pending") {
        return next(ApiError.badRequest("You have already completed this registration step or your status has changed."));
      }

      // Validate inputs
      if (!role) {
        return next(ApiError.badRequest("Role was not entered"));
      }
      if (!birthday) {
        return next(ApiError.badRequest("Birthday was not entered"));
      }

    if (phone_2 && !validateFun.validatePhoneNumber(phone_2)) {
      return next(ApiError.badRequest("Phone number is not formatted correctly"));
    }

      // Unik ID generatsiya qilish
      let uniqueId;
      let isUnique = false;

      // Unik ID yaratish va uni tekshirish
      while (!isUnique) {
        uniqueId = helperFunctions.generateUniqueId(); // generateUniqueId o'z tasodifiy raqamlarni yaratadigan funksiya bo'lishi kerak
        const existingUser = await Users.findOne({ where: { unique_id: uniqueId } });

        // Agar bunday ID mavjud bo'lmasa, bu ID unik ekanini tasdiqlash
        if (!existingUser) {
          isUnique = true;
        }

      }

      // SMS kod va muddati
      const smsCode = helperFunctions.generateRandomCode();
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 1); // SMS kod 1 daqiqa davomida amal qiladi

      // Foydalanuvchini yangilash va "confirm_phone" holatiga o'tkazish
      await user.update({
        phone_2: phone_2 || null,
        birthday,
        role,
        unique_id: uniqueId, // Generatsiya qilingan unik raqam
        verification_code: smsCode,
        verification_code_expiration: expirationTime,
        user_status: "confirm_phone"
      });

      // Tasdiqlash kodini alohida jadvalga yozish
      await UserRegister.create({
        code: smsCode,
        user_id: user.id,
        expiration: expirationTime,
      });

      return res.json({
        message: "Registration complete. Please verify your phone number.",
        user_id: user.id,
        smsCode: smsCode // SMS kodni API javobida yubormaslik tavsiya qilinadi, lekin bu testlash uchun kiritilgan

      });
    } catch (error) {
      console.error(error);
      return next(ApiError.internal("User registration error " + error.message));
    }
  }

  async verifyPhone(req, res, next) {
    try {
      const { user_id, code } = req.body;

      // Foydalanuvchini ID bo'yicha olish
      const user = await Users.findByPk(user_id);
      if (!user) {
        return next(ApiError.badRequest("User not found"));
      }

      // Foydalanuvchi "confirm_phone" holatida ekanligini tekshirish
      if (user.user_status !== "confirm_phone") {
        return next(ApiError.badRequest("The user is not in the phone confirmation stage"));
      }

      // Foydalanuvchi registratsiyasi bo'yicha kodni tekshirish
      const userRegister = await UserRegister.findOne({
        where: {
          user_id,
          code,
          status: 'active',
          expiration: {
            [Op.gt]: new Date(),  // Kod muddati tugamagan bo'lishi kerak
          },
        },
      });

      if (!userRegister) {
        return next(ApiError.badRequest("Invalid or expired verification code"));
      }

      // Foydalanuvchi holatini yangilash (tasdiqlangan deb belgilash)
      await user.update({
        user_status: "active",
      });

      // Tasdiqlash kodi statusini "inactive" qilib yangilash
      await userRegister.update({ status: "inactive" });

      // Sessiya yoki token generatsiya qilish (agar kerak bo'lsa)
      // Bu qismda siz sessiya yoki JWT token yaratishingiz mumkin, agar foydalanuvchi tizimga kirganda token kerak bo'lsa.

      return res.json({
        message: "Phone number verified successfully. You can now log in.",
        unique_id: user.unique_id,  // Foydalanuvchi ID sini javobga qo'shish
      });
    } catch (error) {
      console.error(error);
      return next(ApiError.internal("Phone verification error: " + error.message));
    }
  }

  async login(req, res, next) {
    try {
      const { phone, password, unique_id } = req.body;

      let user;

      // Foydalanuvchini telefon yoki unique_id orqali qidirish
      if (phone) {
        user = await Users.findOne({ where: { phone } });
      } else if (unique_id) {
        user = await Users.findOne({ where: { unique_id } });
      }

      // Agar foydalanuvchi topilmasa, xatolik qaytarish
      if (!user) {
        return next(ApiError.badRequest("User not found"));
      }

      // Kiritilgan parolni saqlangan hash bilan solishtirish
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return next(ApiError.badRequest("Invalid password"));
      }

      // Foydalanuvchi uchun JWT token yaratish

      const token = jwt.sign(
        { id: user.id, unique_id: user.unique_id, phone: user.phone, role: user.role },
        process.env.SECRET_KEY,  // Token uchun maxfiy kalit
        { expiresIn: '24h' }     // Token muddati
      );

      // Muvaffaqiyatli login holatida token va foydalanuvchi ma'lumotlarini qaytarish
      return res.json({
        token,
        user_id: user.id,
        unique_id: user.unique_id,
        role: user.role
      });

    } catch (error) {
      console.error("Login error: " + error.message);
      return next(ApiError.internal("Login error: " + error.message));
    }
  }

  async checkDriverInfo(req, res, next) {
    try {
      const { user_id } = req.query; // user_id ni URL dan olish

      // Foydalanuvchini tekshirish
      const user = await Users.findByPk(user_id);

      if (!user) {
        return next(ApiError.badRequest("Foydalanuvchi topilmadi"));
      }

      // Agar foydalanuvchi driver bo'lsa
      if (user.role === 'driver') {
        const driverInfo = await Driver.findOne({ where: { user_id } });

        if (!driverInfo) {

        }

        // Kerakli ma'lumotlarni tekshirish
        const {
          tex_pas_ser,
          prava_ser,
          tex_pas_num,
          prava_num,
          is_approved,
          blocked,
          car_type
        } = driverInfo;

        // Ma'lumotlarni tekshirish
        if (!tex_pas_ser) {
          return res.json({ success: false, message: "Texnik pasport seriyasi kiritilmagan" });
        }
        if (!prava_ser) {
          return res.json({ success: false, message: "Haydovchilik guvohnomasi seriyasi kiritilmagan" });
        }
        if (!tex_pas_num) {
          return res.json({ success: false, message: "Texnik pasport raqami kiritilmagan" });
        }
        if (!prava_num) {
          return res.json({ success: false, message: "Haydovchilik guvohnomasi raqami kiritilmagan" });
        }
        if (is_approved !== true) {
          return res.json({ success: false, message: "Haydovchilik ma'lumotlari tasdiqlanmagan" });
        }
        if (blocked === true) {
          return res.json({ success: false, message: "Haydovchi bloklangan" });
        }
        if (!car_type) {
          return res.json({ success: false, message: "Avtomobil turi kiritilmagan" });
        }

        // Agar barcha ma'lumotlar to'g'ri bo'lsa
        return res.json({ success: true, message: "Hammasi joyida" });
      } else {
        return res.json({ success: false, message: "Foydalanuvchi driver emas" });
      }
    } catch (error) {
      console.error("Driver ma'lumotlarini tekshirishda xato: ", error);
      return next(ApiError.internal("Xatolik yuz berdi: " + error.message));
    }
  }

  async resendVerification(req, res, next) {
    try {
      const { user_id } = req.body;

      const user = await Users.findByPk(user_id);
      if (!user) {
        return next(ApiError.badRequest("User not found"));
      }

      const userRegister = await UserRegister.findOne({
        where: {
          user_id,
          status: "active",
          expiration: {
            [Op.lte]: new Date(),
          },
        },
      });

      if (userRegister) {
        await userRegister.update({ status: "inactive" });
      }

      const newCode = helperFunctions.generateRandomCode();
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 5);

      await UserRegister.create({
        user_id: user.id,
        code: newCode,
        status: "active",
        expiration: expirationTime,
      });

      return res.json({
        message: "Verification code resent successfully. Please check your phone.",
        code: newCode
      });
    } catch (error) {
      console.error("Resend verification error: ", error);
      return next(ApiError.internal("Resend verification error: " + error.message));
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { phone } = req.body;

      const user = await Users.findOne({
        where: { phone },
      });

      if (!user) {
        return next(ApiError.badRequest("User with this phone number not found"));
      }

      const resetCode = helperFunctions.generateRandomCode();
      const expiration = new Date();
      expiration.setMinutes(expiration.getMinutes() + 1);

      await UserRegister.create({
        user_id: user.id,
        code: resetCode.toString(),
        expiration: expiration,
        status: 'active',
      });

      console.log(`Password reset code sent to ${phone}: ${resetCode}`);

      return res.json({
        message: "Password reset code has been sent to your phone number",
        code: resetCode
      });

    } catch (error) {
      console.error("Forgot password error: ", error);
      return next(ApiError.internal("Forgot password error: " + error.message));
    }
  }

  async verifyResetCode(req, res, next) {
    try {
      const { phone, code } = req.body;

      const user = await Users.findOne({
        where: { phone },
      });

      if (!user) {
        return next(ApiError.badRequest("User with this phone number not found"));
      }

      const userRegister = await UserRegister.findOne({
        where: {
          user_id: user.id,
          code,
          status: 'active',
          expiration: {
            [Op.gt]: new Date(),
          },
        },
      });

      if (!userRegister) {
        return next(ApiError.badRequest("Invalid or expired reset code"));
      }

      return res.json({
        message: "Reset code is valid. You can now reset your password.",
        user_id: user.id,
      });

    } catch (error) {
      console.error("Verification error: ", error);
      return next(ApiError.internal("Verification error: " + error.message));
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { user_id, new_password, confirm_password } = req.body;

      if (!new_password || !confirm_password) {
        return next(ApiError.badRequest("New password and confirm password are required"));
      }
      if (new_password !== confirm_password) {
        return next(ApiError.badRequest("Passwords do not match"));
      }

      const user = await Users.findByPk(user_id);
      if (!user) {
        return next(ApiError.badRequest("User not found"));
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);

      await user.update({ password: hashedPassword });

      return res.json({
        message: "Password has been reset successfully",
      });

    } catch (error) {
      console.error("Reset password error: ", error);
      return next(ApiError.internal("Reset password error: " + error.message));
    }
  }



}

module.exports = new UserControllers();
