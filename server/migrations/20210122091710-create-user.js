'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      firstName: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      lastName: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      name: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      nickname: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};