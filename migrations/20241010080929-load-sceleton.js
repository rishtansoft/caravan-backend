'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Load', 'car_type', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Load', 'receiver_phone', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Load', 'payer', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Load', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Load', 'car_type');
    await queryInterface.removeColumn('Load', 'receiver_phone');
    await queryInterface.removeColumn('Load', 'payer');
    await queryInterface.removeColumn('Load', 'description');
  }
};