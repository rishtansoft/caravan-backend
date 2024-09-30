const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Admin = sequelize.define("admin", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userid: {
    type: DataTypes.STRING,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      is: /^\+?[1-9]\d{1,14}$/,
    },
  },
  phone_2: {
    type: DataTypes.STRING,
    validate: {
      is: /^\+?[1-9]\d{1,14}$/,
    },
  },
  lastname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM("admin", "superadmin"),
    defaultValue: "admin",
  },
  user_img: DataTypes.STRING,
});

module.exports = Admin;
