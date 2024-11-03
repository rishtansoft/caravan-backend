const { Assignment, Driver, Load } = require("../../models/index");
const ApiError = require("../../error/ApiError");


class AssignmentController {
  async assignLoadToDriver(req, res) {
    try {
      const { user_id, load_id, pickUpTime, deliveryTime } = req.body;

      const driver = await Driver.findOne({where: {user_id}});
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

}



module.exports = new AssignmentController();
