const sequelize = require('../db');
const { Users, Driver,
    Load,
    Assignment,
    Location,
    DriverStop,
    LocationCron,
    Notification } = require('./models')(sequelize); // model.js faylingizdagi Users modelini import qilish

const models = {
    Users,
    Driver,
    Load,
    Assignment,
    Location,
    DriverStop,
    LocationCron,
    Notification
};

// Agar modelda assotsiatsiyalar bo'lsa, ularni chaqirish
Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

module.exports = models;
