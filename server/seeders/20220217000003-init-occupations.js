"use strict";
const db = require('../models');
const dataset = [
  { name: '左丞相', contributionCondi: 0, addActPoint: 0, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: true, isAllowedShare: true, isAllowedPk: true },
  { name: '右丞相', contributionCondi: 0, addActPoint: 0, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: true, isAllowedShare: true, isAllowedPk: true },
  { name: '大將軍', contributionCondi: 0, addActPoint: 0, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: true, isAllowedShare: true, isAllowedPk: true },
  { name: '驃騎將軍', contributionCondi: 0, addActPoint: 0, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: true, isAllowedShare: true, isAllowedPk: true },
  { name: '車騎將軍', contributionCondi: 0, addActPoint: 0, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: true, isAllowedShare: true, isAllowedPk: true },
  { name: '衛將軍', contributionCondi: 0, addActPoint: 0, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: true, isAllowedShare: true, isAllowedPk: true },
  { name: '鎮衛將軍', contributionCondi: 0, addActPoint: 0, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: true, isAllowedShare: true, isAllowedPk: true },
  { name: '鎮前將軍', contributionCondi: 0, addActPoint: 0, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: true, isAllowedShare: true, isAllowedPk: true },
  { name: '軍師', contributionCondi: 0, addActPoint: 0, addPeopleLimit: 0, isAllowedItem: true, isAllowedRecurit: true, isAllowedShare: true, isAllowedPk: true },
];










module.exports = {
  up: async (queryInterface, Sequelize) => {
    const loc = await queryInterface.rawSelect('Occupations', {plain: false}, ['id']);
    if (loc && loc.length > 0) {
        return false;
    }



  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Occupations", null, {truncate: true, cascade: true, restartIdentity: true});
  }
};

