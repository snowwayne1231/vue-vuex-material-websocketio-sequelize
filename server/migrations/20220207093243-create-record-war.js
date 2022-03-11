'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RecordWars', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      attackCountryIds: {
        type: Sequelize.TEXT,
        defaultValue: '[]',
      },
      defenceCountryId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      winnerCountryId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      mapId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      judgeId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      toolmanId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      atkUserIds: {
        type: Sequelize.STRING,
        defaultValue: '[]',
      },
      defUserIds: {
        type: Sequelize.STRING,
        defaultValue: '[]',
      },
      timestamp: {
        type: Sequelize.DATE,
      },
      round: {
        type: Sequelize.INTEGER,
      },
      detail: {
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
      queryInterface.addIndex('RecordWars', ['mapId']);
      queryInterface.addIndex('RecordWars', ['judgeId']);
      queryInterface.addIndex('RecordWars', ['round']);
      queryInterface.addIndex('RecordWars', ['defenceCountryId']);
      queryInterface.addIndex('RecordWars', ['timestamp']);
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('RecordWars').then(() => {
      queryInterface.removeIndex('RecordWars', ['mapId']);
      queryInterface.removeIndex('RecordWars', ['judgeId']);
      queryInterface.removeIndex('RecordWars', ['round']);
      queryInterface.removeIndex('RecordWars', ['defenceCountryId']);
      queryInterface.removeIndex('RecordWars', ['timestamp']);
    });
  }
};