'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Maps', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      position: {
        type: Sequelize.STRING,
        defaultValue: '[0, 0]',
      },
      route: {
        type: Sequelize.STRING,
        defaultValue: '[0, 0, 0, 0]',
      },
      cityId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      adventureId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      state: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      isAllowedWalk: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      ownCountryId: {
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
    }).then(() => {
      queryInterface.addIndex('Maps', ['ownCountryId']);
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Maps').then(() => {
      queryInterface.removeIndex('Maps', ['ownCountryId']);
    });
  }
};