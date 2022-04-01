'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Games', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      name: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      b1v1: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      b2v2: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      b3v3: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      b4v4: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      b1v2: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      b1v3: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      b1v4: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      b2v3: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      b2v4: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      b3v4: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
      queryInterface.addIndex('Games', ['type']);
    });

    await queryInterface.addColumn(
      'Maps',
      'gameType',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    );

    await queryInterface.addColumn(
      'RecordWars',
      'gameId',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Games');
    await queryInterface.removeColumn('Maps', 'gameType');
    await queryInterface.removeColumn('RecordWars', 'gameId');
  }
};