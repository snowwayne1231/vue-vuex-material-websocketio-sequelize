'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Occupations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      contributionCondi: {
        type:Sequelize.INTEGER,
        defaultValue: 100,
      },
      addActPoint: {
        type:Sequelize.INTEGER,
        defaultValue: 1,
      },
      addPeopleLimit: {
        type:Sequelize.INTEGER,
        defaultValue: 0,
      },
      isAllowedItem: {
        type:Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isAllowedRecurit: {
        type:Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isAllowedShare: {
        type:Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isAllowedPk: {
        type:Sequelize.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.dropTable('Occupations');
  }
};