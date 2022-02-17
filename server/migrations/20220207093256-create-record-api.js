'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RecordApis', {
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
      model: {
        type: Sequelize.STRING,
      },
      payload: {
        type: Sequelize.STRING,
     },
      curd: {
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
    }).then(() => {
      queryInterface.addIndex('RecordApis', ['userId']);
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('RecordApis').then(() => {
      queryInterface.removeIndex('RecordApis', ['userId']);
    });
  }
};