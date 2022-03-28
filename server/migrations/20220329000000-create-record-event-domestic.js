'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RecordEventDomestics', {
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
        defaultValue: '',
      },
      countryId: {
        type: Sequelize.INTEGER,
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
      queryInterface.addIndex('RecordEventDomestics', ['round']);
      queryInterface.addIndex('RecordEventDomestics', ['countryId']);
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('RecordEventDomestics');
  }
};