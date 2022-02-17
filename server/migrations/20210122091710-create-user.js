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


      nameZh: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      nameEn: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      nickname: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      code: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      pwd: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      countryId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      loyalUerId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      loyalty: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      contribution: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      occupationId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      money: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
      },
      actPoint: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      actPointMax: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      mapTargetId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      mapNowId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      mapNextId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      mapPathIds: {
        type: Sequelize.TEXT,
        defaultValue: '{}',
      },
      destoryByCountryIds: {
        type: Sequelize.TEXT,
        defaultValue: '{}',
      },
      soldier: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      captiveDate: {
        type: Sequelize.DATE,
        defaultValue: null,
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
      queryInterface.addIndex('Users', ['code']);
      queryInterface.addIndex('Users', ['countryId']);
      queryInterface.addIndex('Users', ['mapTargetId']);
      queryInterface.addIndex('Users', ['mapNowId']);
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users').then(() => {
      queryInterface.removeIndex('Users', ['code']);
      queryInterface.removeIndex('Users', ['countryId']);
      queryInterface.removeIndex('Users', ['mapTargetId']);
      queryInterface.removeIndex('Users', ['mapNowId']);
    });
  }
};