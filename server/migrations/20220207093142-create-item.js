'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
      },
      detail: {
        type: Sequelize.STRING,
      },
      lv: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      when: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      object: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      timeTerm: {
        type: Sequelize.INTEGER,
        defaultValue: 30,
      },
      staticKey: {
        type: Sequelize.STRING,
        defaultValue: '__statickey__',
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
    await queryInterface.dropTable('Items');
  }
};