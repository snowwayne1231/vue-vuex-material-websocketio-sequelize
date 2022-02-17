'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CountryRelationships', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      aCountryId: {
        type: Sequelize.INTEGER,
      },
      bCountryId: {
        type: Sequelize.INTEGER,
      },
      value: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
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
    await queryInterface.dropTable('CountryRelationships');
  }
};