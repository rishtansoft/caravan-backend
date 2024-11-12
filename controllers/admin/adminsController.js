const Admin = require("../../models/admin");
const {  Driver, Assignment } = require("../../models/index");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const ApiError = require("../../error/ApiError");

class AdminsController {

    async updateAdmin (req, res, next) {
        try {
            const adminId = req.query.id;  
            const { firstname, lastname, phone, phone_2, address, email, password } = req.body;
            
            if (!adminId) {
                return next(ApiError.badRequest('Admin ID is required'));
            }

            // Fetch the admin details
            const admin = await Admin.findByPk(adminId);
            if (!admin) return next(ApiError.notFound('Admin not found'));

            const hashedPassword = password ? await bcrypt.hash(password, 10) : admin.password;
            await admin.update({ firstname, lastname, phone, phone_2, address, email, password: hashedPassword });

            return res.json({ message: "Admin ma'lumotlari yangilandi", id: admin.id });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Admin ma'lumotlarini yangilashda xatolik: " + error.message));
        }
    };

   async getAdminProfile (req, res, next)  {
         try {
            const admin = await Admin.findByPk(req.params.id , {
                attributes: ['id', 'firstname', 'lastname', 'phone', 'phone_2', 'address']
            });
            if (!admin) return next(ApiError.notFound('Admin not found'));

            return res.json(admin);
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Error retrieving admin profile: " + error.message));
        } 
    }

    async updateAdminPassword (req, res, next) {
        try {
            const { oldPassword, newPassword } = req.body;

            const admin = await Admin.findByPk(req.params.id);
            if (!admin) return next(ApiError.notFound('Admin not found'));

            const isMatch = await bcrypt.compare(oldPassword, admin.password);
            if (!isMatch) return next(ApiError.badRequest('Old password is incorrect'));

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await admin.update({ password: hashedPassword });

            return res.json({ message: "Parol yangilandi" });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Parolni yangilashda xatolik: " + error.message));
        }
    }

    async getAllDrivers(req, res, next) {
        try {
            console.log("ss ");
            
            const drivers = await Driver.findAll();
            res.json(drivers);
            
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Error fetching drivers: " + error.message));
        }
    }

    async getDrivers(req, res, next) {
        try {
             const {
                name,
                driver_status,
                car_type_id,
                is_approved,
                page = 1,
                limit = 10
            } = req.query;

            const whereClause = {};
;
            if(name) whereClause.name = { [Op.like]: `%${name}%` };
            if(driver_status) whereClause.driver_status = driver_status;
            if(car_type_id) whereClause.car_type_id = car_type_id;
            if(is_approved !== undefined) whereClause.is_approved  = is_approved === "true";

            const offset = (page - 1) * limit;
            const drivers = await Driver.findAndCountAll({
                where: whereClause,
                limit: parseInt(limit),
                offset,
            });

            res.json({
                data: drivers.rows,
                totalDrivers: drivers.count,
                currentPage: parseInt(page),
                totalPages: Math.ceil(drivers.count / limit),
            });
            
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Error fetching drivers: " + error.message));
        }
    }

    async getDriverById(req, res, next) {
        try {
            const driver = await Driver.findByPk(req.params.driverId);
            if (!driver) return next(ApiError.notFound("Driver not found"));
            res.json(driver);
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Error fetching driver: " + error.message));
        }
    }

    async deleteDriver(req, res, next) {
        try {
            const { driverId } = req.params;
            const deleted = await Driver.destroy({ where: { id: driverId } });
            if (!deleted) return next(ApiError.notFound("Driver not found"));
            res.json({ message: "Driver deleted successfully" });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Error deleting driver: " + error.message));
        }
    }

    async getDriverOrders(req, res, next) {
        try {
            const { driverId } = req.params;
            const orders = await Assignment.findAll({ where: { driverId } });
            if (!orders.length) return next(ApiError.notFound("No orders found for this driver"));
            res.json(orders);
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Error fetching driver orders: " + error.message));
        }
    }

    async blockDriver(req, res, next) {
        try {
            const { driverId } = req.params;
            const driver = await Driver.findByIdAndUpdate(driverId, { blocked: true }, { new: true });
            if (!driver) return res.status(404).json({ error: 'Driver not found' });
            res.json({ message: 'Driver blocked successfully', driver });
        } catch (error) {
            console.error(error);
            next(ApiError.internal("Error fetching driver orders: " + error.message));
        }
    }
}

module.exports = new AdminsController();
