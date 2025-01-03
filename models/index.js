const sequelize = require("../db");
const defineModels = require("./models");

const models = defineModels(sequelize);

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

console.log(  "  my models  " , models);

module.exports = models;
