'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RecordEvents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      round: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      eventId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      timestamp: {
        type: Sequelize.DATE,
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
      queryInterface.addIndex('RecordEvents', ['round']);
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('RecordEvents').then(() => {
      queryInterface.removeIndex('RecordEvents', ['round']);
    });
  }
};