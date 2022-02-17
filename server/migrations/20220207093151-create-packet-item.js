'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PacketItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
      },
      itemId: {
        type: Sequelize.INTEGER,
      },
      timestampDeadline: {
        type: Sequelize.DATE,
      },
      timestampUse: {
        type: Sequelize.DATE,
      },
      userTarget: {
        type: Sequelize.STRING,
      },
      status: {
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
      queryInterface.addIndex('PacketItems', ['userId']);
      queryInterface.addIndex('PacketItems', ['itemId']);
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PacketItems').then(() => {
      queryInterface.removeIndex('PacketItems', ['userId']);
      queryInterface.removeIndex('PacketItems', ['itemId']);
    });
  }
};