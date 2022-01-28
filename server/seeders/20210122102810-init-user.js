'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const user = await queryInterface.rawSelect('Users', {}, ['id']);
    if (user) {
      return false;
    }
    const template = {
      firstName: 'Snow',
      lastName: 'Jhung',
      name: '',
      nickname: '',
      code: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const insertData = [template];

    return queryInterface.bulkInsert('Users', insertData);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {truncate: true, cascade: true, restartIdentity: true});
  }
};
