'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Countries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(16),
      },
      sign: {
        type: Sequelize.STRING(8),
      },
      money: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
      },
      peopleMax: {
        type: Sequelize.INTEGER,
        defaultValue: 15,
      },
      color: {
        type: Sequelize.STRING(16),
        defaultValue: '#000000',
      },
      originCityId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Countries');
  }
};