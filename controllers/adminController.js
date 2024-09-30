const { Admin } = require("../models/admin");
const ApiError = require("../error/ApiError");

class AdminController {
  async addAdmin(req, res, next) {
    try {
      const { phone, phone_2, lastname, firstname, address } = req.body;

      if (!lastname) {
        return next(ApiError.badRequest("lastname was not entered"));
      }
      if (!firstname) {
        return next(ApiError.badRequest("firstname was not entered"));
      }

      if (!phone) {
        return next(ApiError.badRequest("phone was not entered"));
      }

      const existingAdmin = await Admin.findOne({ where: { phone } });
      if (existingAdmin) {
        return next(
          ApiError.badRequest("Admin with this phone already exists")
        );
      }

      const newAdmin = await Admin.create({
        phone,
        phone_2,
        lastname,
        firstname,
        address,
      });

      return res.json(newAdmin);
    } catch (error) {
      console.error(error);
      return next(ApiError.internal("Error adding admin"));
    }
  }

  async getAllAdmins(req, res, next) {
    try {
      const admins = await Admin.findAll();
      return res.json(admins);
    } catch (error) {
      console.error(error);
      return next(ApiError.internal("Error fetching admin list"));
    }
  }

  async updateAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const { phone, phone_2, lastname, firstname, address } = req.body;

      const admin = await Admin.findByPk(id);
      if (!admin) {
        return next(ApiError.notFound("Admin not found"));
      }

      admin.phone = phone || admin.phone;
      admin.phone_2 = phone_2 || admin.phone_2;
      admin.lastname = lastname || admin.lastname;
      admin.firstname = firstname || admin.firstname;
      admin.address = address || admin.address;

      await admin.save();

      return res.json(admin);
    } catch (error) {
      console.error(error);
      return next(ApiError.internal("Error updating admin details"));
    }
  }

  async deleteAdmin(req, res, next) {
    try {
      const { id } = req.params;

      const admin = await Admin.findByPk(id);
      if (!admin) {
        return next(ApiError.notFound("Admin not found"));
      }

      await admin.destroy();

      return res.json({ message: "Admin deleted successfully" });
    } catch (error) {
      console.error(error);
      return next(ApiError.internal("Error deleting admin"));
    }
  }
}

module.exports = new AdminController();
