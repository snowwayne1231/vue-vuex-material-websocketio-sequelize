'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RecordLogins', {
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
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      ip: {
        type: Sequelize.STRING,
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
      queryInterface.addIndex('RecordLogins', ['userId']);
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('RecordLogins').then(() => {
      queryInterface.removeIndex('RecordLogins', ['userId']);
    });
  }
};