'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Cities', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      money: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
      },
      ownCountryId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      addResource: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      timeBeAttacked: {
        type: Sequelize.STRING,
      },
      jsonConstruction: {
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
      queryInterface.addIndex('Cities', ['ownCountryId']);
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Cities').then(() => {
      queryInterface.removeIndex('Cities', ['ownCountryId']);
    });
  }
};