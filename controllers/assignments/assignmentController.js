const { Assignment, Driver, Load } = require("../../models/index");
const ApiError = require("../../error/ApiError");


class assignmentController {
  async  createAssignment(req, res, next) {
    try {
    
      const { load_id, driver_id } = req.body;

      const load = await Load.findByPk(load_id);
      // const driver = await Driver.findByPk(driver_id);
      const drivers = await Driver.findAll()
      console.log("drivers  " + drivers);
      console.log("Load " + load);
      console.log("driver  " + driver);
      

       if (!load || !driver) {
        return next(ApiError.badRequest('Invalid load or driver ID'));
      }

      //  if (req.user.role !== 'admin' && req.user.id !== load.user_id) {
      //   return next(ApiError.forbidden('You are not authorized to assign this load'));
      // }


      const assignment = await Assignment.create({
        load_id,
        driver_id,
        assignment_status: 'assigned'
      });

      res.status(201).json({ message: 'Assignment created successfully', assignment });

   
    } catch (error) {
      next(ApiError.internal('Error creating assignment: ' + error.message));
    }
  }

}



module.exports = new assignmentController();
