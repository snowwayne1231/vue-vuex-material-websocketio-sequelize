'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Stages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      round: {
        type: Sequelize.INTEGER,
      },
      warIds: {
        type: Sequelize.TEXT,
        defaultValue: '{}',
      },
      userDetail: {
        type: Sequelize.TEXT,
        defaultValue: '{}',
      },
      countryDetail: {
        type: Sequelize.TEXT,
        defaultValue: '{}',
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
    }).then(() => {
      queryInterface.addIndex('Stages', ['round']);
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Stages').then(() => {
      queryInterface.removeIndex('Stages', ['round']);
    });
  }
};