const { Users, Driver, UserRegister } = require("../../models/index");
const ApiError = require("../../error/ApiError");
const validateFun = require("./validateFun");
const { Op } = require("sequelize");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helperFunctions = require("./helperFunctions");
const utilFunctions = require('../../utils/index');
require("dotenv").config();

const configService = require('../../config/configureService');
const { uploadFile, deleteFile } = require('../../utils/index');

class UserControllers {
  async getProfile(req, res, next) {
    try {
      const { user_id } = req.query;
      const user = await Users.findByPk(user_id, {
        attributes: [
          "id",
          "firstname",
          "lastname",
          "phone",
          "phone_2",
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

      console.log(req.body);


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

      const user = await Users.findByPk(user_id);
      if (!user) {
        return next(ApiError.badRequest("User not found"));
      }

      if (user.user_status !== "confirm_phone") {
        return next(ApiError.badRequest("The user is not in the phone confirmation stage"));
      }

      const userRegister = await UserRegister.findOne({
        where: {
          user_id,
          code,
          status: 'active',
          expiration: {
            [Op.gt]: new Date(),
          },
        },
      });

      if (!userRegister) {
        return next(ApiError.badRequest("Invalid or expired verification code"));
      }

      await user.update({
        user_status: "active",
      });

      await userRegister.update({ status: "inactive" });

      if (user.role === "driver") {

        await Driver.create({
          user_id: user.id,
          car_type: "unknown",
          name: `unknown`,
          tex_pas_ser: "unknown",
          prava_ser: "unknown",
          tex_pas_num: "unknown",
          prava_num: "unknown",
          car_img: "",
          prava_img: "",
          tex_pas_img: "",
          driver_status: "offline",
          is_approved: false,
          blocked: false,
        });
      }

      return res.json({
        message: "Phone number verified successfully. You can now log in.",
        unique_id: user.unique_id,
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
        return next(ApiError.userNotFound("User not found"));
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
          return next(ApiError.badRequest("Driver topilmadi"));
        }

        // Kerakli ma'lumotlarni tekshirish
        const {
          tex_pas_ser,
          prava_ser,
          tex_pas_num,
          prava_num,
          is_approved,
          blocked,
          car_type_id
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
        // if (is_approved !== true) {
        //   return res.json({ success: false, message: "Haydovchilik ma'lumotlari tasdiqlanmagan" });
        // }
        if (blocked === true) {
          return res.json({ success: false, message: "Haydovchi bloklangan" });
        }
        if (!car_type_id) {
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

  async resendResetForgotCode(req, res, next) {
    try {
      const { phone } = req.body;

      const user = await Users.findOne({
        where: { phone },
      });

      if (!user) {
        return next(ApiError.badRequest("User with this phone number not found"));
      }

      const lastResetCode = await UserRegister.findOne({
        where: { user_id: user.id, status: 'active' },
        order: [['expiration', 'DESC']],
      });

      if (lastResetCode) {
        const currentTime = new Date();
        if (currentTime < new Date(lastResetCode.expiration)) {
          return res.json({
            message: "A reset code has already been sent and is still valid.",
          });
        }
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

      console.log(`New password reset code sent to ${phone}: ${resetCode}`);

      return res.json({
        message: "New password reset code has been sent to your phone number",
        code: resetCode
      });

    } catch (error) {
      console.error("Resend password reset code error: ", error);
      return next(ApiError.internal("Resend password reset code error: " + error.message));
    }
  }

  async requestMainPhoneChange(req, res, next) {
    try {
      const { user_id, unique_id, new_phone } = req.body;

      const user = await Users.findOne({ where: { id: user_id, unique_id } });
      if (!user) {
        return next(ApiError.internal("User not found"));
      }

      const verificationCode = Math.floor(1000 + Math.random() * 9000);

      const isPhoneValid = utilFunctions.validatePhoneNumber(new_phone);

      if (!isPhoneValid) {
        return next(ApiError.internal("Phone is not valid"));
      }

      await UserRegister.update(
        { status: 'inactive' },
        { where: { user_id, status: 'active' } }
      );

      await UserRegister.create({
        user_id: user.id,
        code: verificationCode,
        status: 'active',
        expiration: new Date(Date.now() + 10 * 60 * 300),
      });

      // await smsService.send(new_phone, `Your verification code is: ${verificationCode}`);

      return res.json({ message: 'Verification code sent to new phone number', code: verificationCode });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  async verifyMainPhoneChange(req, res, next) {
    try {
      const { user_id, new_phone, sms_code } = req.body;

      console.log(669, user_id, new_phone, sms_code);

      const record = await UserRegister.findOne({
        where: {
          user_id,
          code: String(sms_code),
          status: 'active',
          expiration: { [Op.gt]: new Date() },
        },
      });

      console.log(678, record);


      if (!record) {
        return res.status(400).json({ message: 'Invalid or expired verification code' });
      }

      await Users.update(
        { phone: new_phone },
        { where: { id: user_id } }
      );

      await record.update({ status: 'inactive' });

      return res.json({ message: 'Phone number updated successfully' });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  async resendVerificationCodeChangePhone(req, res, next) {
    try {
      const { user_id, new_phone } = req.body;

      // Avval mavjud bo'lgan kodni tekshirish
      const existingRecord = await UserRegister.findOne({
        where: {
          user_id,
          status: 'active',
          expiration: { [Op.gt]: new Date() },  // Hozirgi vaqt tugagan bo'lsa
        },
      });

      // Agar kod hali ham amalda bo'lsa, qayta yuborish mumkin emas
      if (existingRecord) {
        return res.status(400).json({ message: 'Verification code is still valid. Please wait until it expires.' });
      }

      // Yangi kod yaratish
      const newCode = helperFunctions.generateRandomCode();
      const expiration = new Date();
      expiration.setMinutes(expiration.getMinutes() + 1); // 1 daqiqa amal qilish muddati

      // Yangi kodni saqlash
      await UserRegister.create({
        user_id: user_id,
        code: newCode.toString(),
        expiration: expiration,
        status: 'active',
      });

      // Yangi kodni telefon raqamga yuborish (yoki console.log orqali chiqarish)
      console.log(`New verification code sent to ${new_phone}: ${newCode}`);

      return res.json({
        message: 'New verification code has been sent to your phone number.',
        code: newCode, // Productionda kodni response'ga qaytarish maqsadga muvofiq emas. Bu faqat debugging uchun.
      });

    } catch (error) {
      console.error("Error resending verification code: ", error);
      return next(ApiError.internal("Error resending verification code: " + error.message));
    }
  }

  async uploadUserProfilePicture(req, res, next) {
    try {
      const { user_id } = req.query;
      const file = req.file;

      // Foydalanuvchini tekshirish
      const user = await Users.findByPk(user_id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Rasmni S3 ga yuklash
      const fileUrl = await uploadFile(file, configService);

      // Foydalanuvchining profile picture ma'lumotini yangilash
      await user.update({ user_img: fileUrl });

      return res.json({ message: 'Profile picture uploaded successfully', profile_picture: fileUrl });
    } catch (error) {
      console.error(error);
      next(error);  // Xatolikni ushlash
    }
  }

  async deleteAvatar(req, res, next) {
    try {
      const { user_id, fileUrl } = req.body;  // O'chiriladigan fayl URL'si va user_id

      if (!fileUrl) {
        return res.status(400).json({ message: 'File URL is required' });
      }

      // Faylni S3'dan o'chirish
      const result = await deleteFile(fileUrl, configService);

      // Users jadvalidan user_img'ni o'chirish
      const user = await Users.findByPk(user_id);  // user_id bo'yicha foydalanuvchini topamiz
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.user_img !== fileUrl) {
        return res.status(400).json({ message: 'Provided file URL does not match user image' });
      }

      // Userning user_img ni null qilib yangilaymiz
      await user.update({ user_img: null });

      return res.json({ message: 'File deleted successfully and user image removed' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting file', error: error.message });
    }
  }

  async replaceAvatar(req, res, next) {
    try {
      const { user_id } = req.query;
      const file = req.file;

      if (!file || !user_id) {
        return res.status(400).json({ message: 'File and user_id are required' });
      }

      const user = await Users.findByPk(user_id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const oldFileUrl = user.user_img;

      const newFileUrl = await uploadFile(file, configService);

      if (oldFileUrl) {
        await deleteFile(oldFileUrl, configService);
      }

      await user.update({ user_img: newFileUrl });

      return res.json({
        message: 'Avatar updated successfully',
        new_image_url: newFileUrl,
      });
    } catch (error) {
      console.error('Error replacing avatar:', error);
      return res.status(500).json({ message: 'Error replacing avatar', error: error.message });
    }
  }

  async updateOwnerProfile(req, res, next) {
    const { user_id } = req.query;
    const { lastname, firstname, phone_2 = null, birthday, address } = req.body;

    try {
      const user = await Users.findByPk(user_id);

      if (!user) {
        return next(ApiError.notFound('Foydalanuvchi topilmadi'));
      }

      await user.update({
        lastname,
        firstname,
        phone_2,
        birthday,
        address,
      });

      res.json({
        success: true,
        message: 'Foydalanuvchi muvaffaqiyatli yangilandi',
        data: user,
      });
    } catch (error) {
      next(ApiError.internal('Foydalanuvchini yangilashda xatolik yuz berdi'));
    }
  }

  async checkToken(req, res, next) {
    try {
      const { token } = req.body;
  
      if (!token) {
        return next(ApiError.badRequest("Token is required"));
      }
  
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.SECRET_KEY); 
      } catch (err) {
        return res.json({
          success: false,
          message: "Invalid token",
        });
      }

      console.log(881);
  
      const user = await Users.findOne({ where: { id: decoded.id } });
  
      if (!user) {
        return res.json({
          success: false,
          message: "User not found",
        });
      }
  
      return res.json({
        success: true,
        message: "Token is valid",
        user: {
          id: user.id,
          unique_id: user.unique_id,
          phone: user.phone,
          role: user.role,
        }
      });
    } catch (error) {
      console.error("Check token error: " + error.message);
      return next(ApiError.internal("Check token error: " + error.message));
    }
  }

}

module.exports = new UserControllers();
