
const  {CarType} = require("../../models/index");
const ApiError = require("../../error/ApiError");
require("dotenv").config();

const createCarType = async (req, res, next) => {
    try {
        const { title, icon, max_weight, dim_x, dim_y, dim_z } = req.body;

        if (!title || !icon || !max_weight || !dim_x || !dim_y || !dim_z) {
            return next(ApiError.badRequest("All fields are required"));
        }

        const newCarType = await CarType.create({
            name: title,
            icon,
            max_weight,
            dim_x,
            dim_y,
            dim_z,
        });

        return res.status(201).json({
            message: "Car type created successfully",
            carType: newCarType,
        });
    } catch (error) {
        console.error(error);
        return next(ApiError.internal("Error creating car type: " + error.message));
    }
}

const getAllCarTypes = async (req, res, next) => {
    try {
        const carTypes = await CarType.findAll();

        return res.status(200).json({
            message: "Car types retrieved successfully",
            carTypes,
        });
    } catch (error) {
        console.error(error);
        return next(ApiError.internal("Error fetching car types: " + error.message));
    }
}

const getCarType = async (req, res, next) => {
    try {
        const { id } = req.params;

        const carType = await CarType.findByPk(id);

        if (!carType) {
            return next(ApiError.badRequest("Car type not found"));
        }

        return res.status(200).json({
            message: "Car type retrieved successfully",
            carType,
        });
    } catch (error) {
        console.error(error);
        return next(ApiError.internal("Error fetching car type: " + error.message));
    }
}

const updateCarType = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, icon, max_weight, dim_x, dim_y, dim_z } = req.body;

        const carType = await CarType.findByPk(id);

        if (!carType) {
            return next(ApiError.badRequest("Car type not found"));
        }

        await carType.update({
            title: title || carType.title,
            icon: icon || carType.icon,
            max_weight: max_weight || carType.max_weight,
            dim_x: dim_x || carType.dim_x,
            dim_y: dim_y || carType.dim_y,
            dim_z: dim_z || carType.dim_z,
        });

        return res.status(200).json({
            message: "Car type updated successfully",
            carType,
        });
    } catch (error) {
        console.error(error);
        return next(ApiError.internal("Error updating car type: " + error.message));
    }
}

const deleteCarType = async (req, res, next) => {
    try {
        const { id } = req.params;

        const carType = await CarType.findByPk(id);

        if (!carType) {
            return next(ApiError.badRequest("Car type not found"));
        }

        await carType.destroy();

        return res.status(200).json({
            message: "Car type deleted successfully",
        });
    } catch (error) {
        console.error(error);
        return next(ApiError.internal("Error deleting car type: " + error.message));
    }
}


module.exports = {
    createCarType,
    getAllCarTypes,
    getCarType,
    updateCarType,
    deleteCarType
};
