const sequelize = require('../db'); 
const User = require('./models')(sequelize); 

sequelize.sync()
  .then(() => {
    console.log('Jadvallar muvaffaqiyatli yaratildi.');
  })
  .catch((error) => {
    console.error('Jadvallarni yaratishda xatolik yuz berdi:', error);
  });

module.exports = {
  sequelize,
  User,
  // boshqa modellaringiz
};
