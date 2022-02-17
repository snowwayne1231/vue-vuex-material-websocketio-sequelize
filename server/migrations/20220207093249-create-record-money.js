'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RecordMoneys', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      giveUserId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      giveCityId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      reason: {
        type: Sequelize.STRING,
      },
      round: {
        type: Sequelize.INTEGER,
      },
      money: {
        type: Sequelize.DOUBLE,
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
      queryInterface.addIndex('RecordMoneys', ['userId']);
      queryInterface.addIndex('RecordMoneys', ['giveUserId']);
      queryInterface.addIndex('RecordMoneys', ['giveCityId']);
      queryInterface.addIndex('RecordMoneys', ['round']);
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('RecordMoneys').then(() => {
      queryInterface.removeIndex('RecordMoneys', ['userId']);
      queryInterface.removeIndex('RecordMoneys', ['giveUserId']);
      queryInterface.removeIndex('RecordMoneys', ['giveCityId']);
      queryInterface.removeIndex('RecordMoneys', ['round']);
    });
  }
};