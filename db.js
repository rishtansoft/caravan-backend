require("dotenv").config();
const { Sequelize } = require("sequelize");

module.exports = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        dialect: "postgres",
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialectOptions: {
            //   ssl: {
            //       require: true,
            //       rejectUnauthorized: false,
            //   },
<<<<<<< HEAD
            // useUTC: false,
=======
            useUTC: false,
>>>>>>> b2c56335480d23a60f289a9c898b4c3b7caa4e63
        },
        timezone: '+05:00'
    }
);

