"use strict";
const db = require('../models');
const dataset = [
  { name: '左丞相', contributionCondi: 96, addActPoint: 2, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: false, isAllowedShare: false, isAllowedPk: true },
  { name: '右丞相', contributionCondi: 96, addActPoint: 2, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: false, isAllowedShare: false, isAllowedPk: true },
  { name: '大將軍', contributionCondi: 154, addActPoint: 5, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: false, isAllowedShare: false, isAllowedPk: true },
  { name: '驃騎將軍', contributionCondi: 115, addActPoint: 3, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: false, isAllowedShare: false, isAllowedPk: true },
  { name: '車騎將軍', contributionCondi: 115, addActPoint: 3, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: false, isAllowedShare: false, isAllowedPk: true },
  { name: '衛將軍', contributionCondi: 115, addActPoint: 3, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: false, isAllowedShare: false, isAllowedPk: true },
  { name: '鎮衛將軍', contributionCondi: 134, addActPoint: 4, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: false, isAllowedShare: false, isAllowedPk: true },
  { name: '鎮前將軍', contributionCondi: 96, addActPoint: 2, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: false, isAllowedShare: false, isAllowedPk: true },
  { name: '軍師', contributionCondi: 76, addActPoint: 1, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: true, isAllowedShare: true, isAllowedPk: true },
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const loc = await queryInterface.rawSelect('Occupations', {plain: false}, ['id']);
    if (loc && loc.length > 0) {
        return false;
    }
    const createdAt = new Date();
    const insertData = [];
    dataset.map(data => {
      const _next_data = {
        ...data,
        createdAt: createdAt,
        updatedAt: createdAt,
      }
      insertData.push(_next_data);
    });

    await queryInterface.bulkInsert("Occupations", insertData);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Occupations", null, {truncate: true, cascade: true, restartIdentity: true});
  }
};

