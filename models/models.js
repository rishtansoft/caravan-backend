const sequelize = require("../db");

const { DataTypes, Model } = require("sequelize");
const { Sequelize } = require("../db");
const Users = sequelize.define("users", {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    password: { type: DataTypes.STRING },
    userid: { type: DataTypes.STRING, },
    lastname: { type: DataTypes.STRING },
    firstname: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    phone_2: { type: DataTypes.STRING },
    birthday: { type: DataTypes.STRING },
    user_img: {
        type: DataTypes.BLOB('long'),
        allowNull: true
    },
    address: { type: DataTypes.STRING },
    role: { type: Sequelize.ENUM('driver', 'cargo_owner'), allowNull: false },
    status: { type: Sequelize.ENUM('pending', 'active', 'inactive', 'confirm_phone'), defaultValue: "confirm_phone" },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
});
const Driver = sequelize.define('drivers', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    car_type: { type: Sequelize.STRING, },
    name: { type: Sequelize.STRING, },
    user_id: { type: DataTypes.STRING },
    tex_pas_ser: { type: DataTypes.STRING },
    prava_ser: { type: DataTypes.STRING },
    tex_pas_num: { type: DataTypes.STRING },
    prava_num: { type: DataTypes.STRING },

    car_img: {
        type: DataTypes.BLOB('long'),
        allowNull: true
    },
    prava_img: {
        type: DataTypes.BLOB('long'),
        allowNull: true
    },
    tex_pas_img: {
        type: DataTypes.BLOB('long'),
        allowNull: true
    },
    dr_status: { type: Sequelize.ENUM('empty', 'at_work', 'resting', 'offline', 'on_break'), },
    status: { type: DataTypes.STRING, defaultValue: "active" },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
});
const Load = sequelize.define("loads", {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    user_id: { type: DataTypes.STRING },
    name: { type: DataTypes.STRING },
    cargo_type: { type: DataTypes.STRING },
    weight: { type: DataTypes.STRING },
    length: { type: DataTypes.STRING },
    load_img: {
        type: DataTypes.BLOB('long'),
        allowNull: true
    },
    width: { type: DataTypes.STRING },
    height: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: "active" },
    load_status: { type: Sequelize.ENUM('posted', 'assigned', 'picked_up', 'in_transit', 'delivered'), defaultValue: 'posted' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
});
const Assignment = sequelize.define('assignments', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    load_id: { type: DataTypes.STRING },
    driver_id: { type: DataTypes.STRING },
    assignment_status: { type: Sequelize.ENUM('assigned', 'picked_up', 'in_transit', 'delivered'), defaultValue: 'assigned' },
    status: { type: DataTypes.STRING, defaultValue: "active" },
    pickUpTime: { type: DataTypes.STRING },
    deliveryTime: { type: DataTypes.STRING },
    location_id: { type: DataTypes.TEXT },
    driver_stop_id: { type: DataTypes.TEXT },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },

});
const Location = sequelize.define('locations', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    assignment_id: { type: DataTypes.STRING, },
    start_latitude: { type: DataTypes.STRING, allowNull: false },
    start_longitude: { type: DataTypes.STRING, allowNull: false },
    end_latitude: { type: DataTypes.STRING, allowNull: false },
    end_longitude: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: "active" },
    order: { type: DataTypes.FLOAT, defaultValue: 1 },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
});
const DriverStop = sequelize.define('driver_stops', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    assignment_id: { type: DataTypes.STRING, },
    latitude: { type: DataTypes.STRING, allowNull: false },
    longitude: { type: DataTypes.STRING, allowNull: false },
    start_time: { type: DataTypes.STRING, allowNull: false },
    end_time: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: "active" },
    order: { type: DataTypes.FLOAT, defaultValue: 1 },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
});
const LocationCron = sequelize.define('location_crons', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    assignment_id: { type: DataTypes.STRING, },
    time: { type: DataTypes.STRING, },
    latitude: { type: DataTypes.STRING, allowNull: false },
    longitude: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: "active" },
    order: { type: DataTypes.FLOAT, defaultValue: 1 },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
});
const Notification = sequelize.define('notifications', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    load_id: { type: DataTypes.STRING },
    user_id: { type: DataTypes.STRING },
    message: { type: DataTypes.TEXT, },
    status: { type: DataTypes.STRING, defaultValue: "active" },
    order: { type: DataTypes.FLOAT, defaultValue: 1 },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
});
const UserRegister = sequelize.define("user_registers", {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    code: { type: DataTypes.STRING },
    user_id: { type: DataTypes.STRING },
    time: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: "active" },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },

});


module.exports = {
    Users,
    Driver,
    Load,
    Assignment,
    Location,
    Notification,
    DriverStop,
    UserRegister,
    LocationCron
};






































// const UserCargoOwner = sequelize.define("user_cargo_owners", {
//     id: {
//         type: Sequelize.UUID,
//         defaultValue: Sequelize.UUIDV4,
//         allowNull: false,
//         primaryKey: true,
//     },
//     password: { type: DataTypes.STRING },
//     lastname: { type: DataTypes.STRING },
//     firstname: { type: DataTypes.STRING },
//     phone: { type: DataTypes.STRING },
//     birthday: { type: DataTypes.STRING },
//     address: { type: DataTypes.STRING },
//     status: { type: DataTypes.STRING, defaultValue: "active" },
//     updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
//     createdAt: { type: DataTypes.DATE, field: 'created_at' },
// });
// user_img: {
// type: DataTypes.BLOB('long'),
//     allowNull: true
// },
