const { Users } = require("../../models/index");
const ApiError = require("../../error/ApiError");

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
}

module.exports = new UserControllers();
