'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CountryGroups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      masterCountryId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      followerCountryId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      timestampStart: {
        type: Sequelize.DATE,
      },
      timestampEnd: {
        type: Sequelize.DATE,
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
      queryInterface.addIndex('CountryGroups', ['masterCountryId']);
      queryInterface.addIndex('CountryGroups', ['followerCountryId']);
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CountryGroups').then(() => {
      queryInterface.removeIndex('CountryGroups', ['masterCountryId']);
      queryInterface.removeIndex('CountryGroups', ['followerCountryId']);
    });
  }
};