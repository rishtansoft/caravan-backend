const { Sequelize } = require('sequelize');

// PostgreSQL uchun Sequelize ulanishi
const sequelize = new Sequelize('caravan3', 'postgres', '1', {
  host: 'localhost', // Yoki ma'lumotlar bazasi serverining IP manzili
  dialect: 'postgres', // Dialekt sifatida 'postgres' ni ko'rsatamiz
  port: 5432, // PostgreSQL-ning standart porti, agar o'zgartirilmagan bo'lsa
  logging: false // Konsolga log yozishni o'chirish uchun
});

module.exports = sequelize;
