// const sequelize = require("../db");
// const {
//   Users,
//   Driver,
//   Load,
//   Assignment,
//   Location,
//   DriverStop,
//   LocationCron,
//   Notification,
// } = require("./models")(sequelize);

// const models = {
//   Users,
//   Driver,
//   Load,
//   Assignment,
//   Location,
//   DriverStop,
//   LocationCron,
//   Notification,
// };

// // Agar modelda assotsiatsiyalar bo'lsa, ularni chaqirish
// Object.keys(models).forEach((modelName) => {
//   if (models[modelName].associate) {
//     models[modelName].associate(models);
//   }
// });

// module.exports = models;
const sequelize = require("../db");
const { DataTypes } = require("sequelize");
const defineModels = require("./models");

const models = defineModels(sequelize, DataTypes);

// If the models have associations, call them
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
