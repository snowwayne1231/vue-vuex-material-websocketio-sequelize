'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RecordMoves', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      round: {
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
      },
      fromMapId: {
        type: Sequelize.INTEGER,
      },
      toMapId: {
        type: Sequelize.INTEGER,
      },
      spendPoint: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
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
      queryInterface.addIndex('RecordMoves', ['round']);
      queryInterface.addIndex('RecordMoves', ['userId']);
      queryInterface.addIndex('RecordMoves', ['toMapId']);
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('RecordMoves').then(() => {
      queryInterface.removeIndex('RecordMoves', ['round']);
      queryInterface.removeIndex('RecordMoves', ['userId']);
      queryInterface.removeIndex('RecordMoves', ['toMapId']);
    });
  }
};