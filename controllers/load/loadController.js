const { Users,  Load } = require("../../models/index");
const ApiError = require("../../error/ApiError");


class LoadController {
  // Loads
  async  createLoadStep1 (req, res, next) {
    try {
      const { origin_location, destination_location, stop_location } = req.body;
      const user_id = req.user.id;

      const user = await Users.findByPk(user_id);
      if (!user) {
        return next(ApiError.forbidden("User not found"));
      }

      if (user.role === "driver") {
        return next(ApiError.forbidden("Drivers are not allowed to create loads"));
      }

      const newLoad = await Load.create({
        user_id,
        origin_location,
        destination_location,
        stop_location,
      });

      return res.status(201).json({ message: "Load step 1 completed", load_id: newLoad.id });
    } catch (error) {
      next(ApiError.internal("Error creating load step 1: " + error.message));
    }
  }

  async createLoadStep2 (req, res, next) {
    try {
      const { load_id, cargo_type, weight, height, loading_time, car_type } = req.body;

      const load = await Load.findByPk(load_id);
      if (!load) {
        return next(ApiError.notFound("Load not found"));
      }

      await load.update({
        cargo_type,
        weight,
        height,
        loading_time,
        car_type,
      });

      return res.status(200).json({ message: "Load step 2 completed", load_id: load.id });
    } catch (error) {
      next(ApiError.internal("Error updating load step 2: " + error.message));
    }
  };

  async createLoadStep3 (req, res, next) {
    try {
      const { load_id, receiver_phone, payer, description, driver_return } = req.body;

      const load = await Load.findByPk(load_id);
      if (!load) {
        return next(ApiError.notFound("Load not found"));
      }

      await load.update({
        receiver_phone,
        payer,
        description,
        driver_return,
      });

      return res.status(200).json({ message: "Load created successfully", load: load });
    } catch (error) {
      next(ApiError.internal("Error completing load creation: " + error.message));
    }
  };

  async  getLoad(req, res, next) {
    try {
      const { loadId } = req.params;

      const load = await Load.findByPk(loadId);

      if (!load) {
        return next(ApiError.notFound("Load not found"));
      }

      return res.status(200).json(load);
    } catch (error) {
      next(ApiError.internal("Error fetching load: " + error.message));
    }
  }

  async  updateLoad(req, res, next) {
    try {
      const { loadId } = req.params;
      const { name, cargo_type, weight, length, width, height, load_img,description ,payer,receiver_phone} = req.body;

      const load = await Load.findByPk(loadId);

      if (!load) {
        return next(ApiError.notFound("Load not found"));
      }

  
      load.name = name || load.name;
      load.cargo_type = cargo_type || load.cargo_type;
      load.weight = weight || load.weight;
      load.length = length || load.length;
      load.width = width || load.width;
      load.height = height || load.height;
      load.load_img = load_img || load.load_img;
      load.description = description || load.description;
      load.payer = payer || load.payer;
      load.receiver_phone = receiver_phone || load.receiver_phone;

      await load.save();

      return res.status(200).json({ message: "Load updated successfully", load });
    } catch (error) {
      next(ApiError.internal("Error updating load: " + error.message));
    }
  }

  async  deleteLoad(req, res, next) {
    try {
      const { loadId } = req.params;

      const load = await Load.findByPk(loadId);

      if (!load) {
        return next(ApiError.notFound("Load not found"));
      }

      await load.destroy();

      return res.status(200).json({ message: "Load deleted successfully" });
    } catch (error) {
      next(ApiError.internal("Error deleting load: " + error.message));
    }
  }


  async  getUserLoads(req, res, next) {
    try {
      const user_id = req.user.id; 

      const loads = await Load.findAll({
        where: { user_id }
      });

      return res.status(200).json(loads);
    } catch (error) {
      next(ApiError.internal("Error fetching loads: " + error.message));
    }

  }

}



module.exports = new LoadController();
