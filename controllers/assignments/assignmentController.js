const { Assignment, Driver, Load, Users } = require("../../models/index");
const ApiError = require("../../error/ApiError");


class AssignmentController {
  async assignLoadToDriver(req, res) {
    try {
      const { user_id, load_id, pickUpTime, deliveryTime } = req.body;

      const driver = await Driver.findOne({ where: { user_id } });
      const load = await Load.findByPk(load_id);

      if (load.load_status == 'assigned' || load.load_status == 'picked_up' || load.load_status == 'in_transit' || load.load_status == 'delivered') {
        return res.status(404).json({ error: "Load already assigned" });
      }

      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }

      if (!load) {
        return res.status(404).json({ error: "Load not found" });
      }

      // Assignment yaratish
      const assignment = await Assignment.create({
        driver_id: driver.id,
        load_id,
        pickUpTime: pickUpTime || null,
        deliveryTime: deliveryTime || null,
        assignment_status: "assigned"
      });

      driver.driver_status = 'at_work';
      await driver.save();

      // Yuk holatini yangilash
      load.load_status = "assigned";
      await load.save();

      return res.status(201).json({
        message: "Load successfully assigned to driver",
        assignment
      });
    } catch (error) {
      console.error("Error assigning load to driver:", error);
      return res.status(500).json({ error: "Failed to assign load to driver" });
    }
  }

  async loadLocationBatch(req, res) {
    const { user_id, locations } = req.body;

    if (!user_id || !Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ error: 'Foydalanuvchi ID yoki joylashuvlar kiritilmagan yoki noto‘g‘ri formatda.' });
    }

    try {
      const driver = Driver.findOne({ where: { user_id } })

      const assignment = await Assignment.findOne({
        where: { driver_id: driver.id }
      });

      if (!assignment) {
        return res.status(404).json({ error: 'Aktiv topshiriq topilmadi.' });
      }

      const locationData = await Promise.allSettled(locations.map(async (location, index) => {
        const lastLocation = await Location.findOne({
          where: { assignment_id: assignment.id },
          order: [['order', 'DESC']]
        });

        const newOrder = lastLocation ? lastLocation.order + 1 + index : 1 + index;

        return {
          assignment_id: assignment.id,
          latitude: location.latitude,
          longitude: location.longitude,
          recordedAt: location.recordedAt || new Date(),
          order: newOrder
        };
      }));

      await Location.bulkCreate(locationData);

      res.status(201).json({ message: 'Joylashuvlar muvaffaqiyatli saqlandi.' });
    } catch (error) {
      console.error('Joylashuvlarni saqlashda xatolik:', error);
      res.status(500).json({ error: 'Joylashuvlarni saqlashda server xatosi yuz berdi.' });
    }
  }

  async getLastLocationDriver(req, res) {
    const { load_id, user_id } = req.query;

    if (!load_id || !user_id) {
      return res.status(400).json({ error: 'load_id va user_id kiritilishi shart.' });
    }

    try {
      const user = await Users.findByPk(user_id);
      if (!user || user.role !== 'cargo_owner') {
        return res.status(403).json({ error: 'Foydalanuvchi cargo_owner emas yoki topilmadi.' });
      }

      const assignment = await Assignment.findOne({
        where: {
          id: load_id,
          user_id: user.id
        }
      });

      if (!assignment) {
        return res.status(404).json({ error: 'Bu yuk foydalanuvchiga tegishli emas yoki topilmadi.' });
      }

      const latestLocation = await Location.findOne({
        where: { assignment_id: assignment.id },
        order: [['recordedAt', 'DESC']]
      });

      if (!latestLocation) {
        return res.status(404).json({ error: 'Joylashuv topilmadi.' });
      }

      res.status(200).json(latestLocation);
    } catch (error) {
      console.error('Xato:', error);
      res.status(500).json({ error: 'Server xatosi yuz berdi.' });
    }
  }

  async changeLoadStatus(req, res) {
    const { user_id, status, role, load_id } = req.body;

    if (!user_id || !status || !role || !load_id) {
      return res.status(400).json({ error: 'user_id, status, role, va load_id kiritilishi shart.' });
    }

    try {
      const user = await Users.findByPk(user_id);
      if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
      }

      const load = await Assignment.findOne({ where: { id: load_id } });
      if (!load) {
        return res.status(404).json({ error: 'Yuk topilmadi.' });
      }

      if (user.role == 'cargo_owner' && load.user_id !== user.id) {
        return res.status(403).json({ error: 'Bu yuk sizga tegishli emas.' });
      }

      if (user.role == 'driver') {
        const driver = Driver.findOne({ where: { user_id: user.id } })

        if (driver && load.driver_id != driver.id) {
          return res.status(403).json({ error: 'Bu yuk sizga tegishli emas.' });
        }
      }

      const allowedStatusesForCargoOwner = ['posted', 'picked_up'];
      const allowedStatusesForDriver = ['assigned', 'picked_up', 'in_transit', 'delivered'];

      if (role === 'cargo_owner') {
        if (!allowedStatusesForCargoOwner.includes(status)) {
          return res.status(400).json({ error: 'Cargo owner uchun ruxsat etilgan statuslar: posted, picked_up.' });
        }
      } else if (role === 'driver') {
        if (!allowedStatusesForDriver.includes(status)) {
          return res.status(400).json({ error: 'Driver uchun ruxsat etilgan statuslar: assigned, picked_up, in_transit, delivered.' });
        }
      } else {
        return res.status(403).json({ error: 'Ruxsat etilmagan rol.' });
      }

      load.load_status = status;
      await load.save();

      res.status(200).json({ message: 'Yuk statusi muvaffaqiyatli o\'zgartirildi.', load });
    } catch (error) {
      console.error('Xato:', error);
      res.status(500).json({ error: 'Server xatosi yuz berdi.' });
    }
  }
}



module.exports = new AssignmentController();
