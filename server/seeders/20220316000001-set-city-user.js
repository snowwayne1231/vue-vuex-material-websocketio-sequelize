"use strict";
const db = require('../models');
const citydataset = [
  { id: 3, add: 20, },
  { id: 4, add: 20, },
  { id: 5, add: 20, },
  { id: 6, add: 20, },
  { id: 15, add: 20, },
  { id: 18, add: 20, },
  { id: 22, add: 20, },
  { id: 25, add: 20, },
  { id: 26, add: 20, },
  { id: 31, add: 20, },
  { id: 38, add: 20, },
  { id: 39, add: 20, },
  { id: 41, add: 20, },
  { id: 21, add: 30, },
  { id: 27, add: 30, },
  { id: 40, add: 30, },
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let i = 0; i < citydataset.length; i++) {
      let loc = citydataset[i];
      await db.City.update({addResource: loc.add}, {where: {id: loc.id}});
    }
    
    const users = await db.User.findAll();
    for (let i = 0; i < users.length; i++) {
      let user = users[i];
      if (user.role == 1) {
        user.soldier = 500;
        user.actPoint = 5;
        user.money = 50;
        user.actPointMax = 10;
      } else if (user.role == 2) {
        user.soldier = 200;
        user.actPoint = 3;
        user.money = 0;
        user.actPointMax = 7;
      } else {
        user.soldier = 0;
        user.actPoint = 3;
        user.money = 0;
        user.actPointMax = 3;
      }
      
      user.pwd = '';
      user.contribution = 0;
      user.occupationId = 0;
      await user.save();
    }
  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.bulkDelete("City", null, {truncate: true, cascade: true, restartIdentity: true});
  }
};

