"use strict";
const db = require('../models');


module.exports = {
  up: async (queryInterface, Sequelize) => {
    
    const hash_map_user = {};
    const hash_map_name_map = {};
    const hash_map_id_map = {};
    const hash_map_cityid_map = {};
    const hash_map_country = {};

    const user_template = {
      mapNowId: 0,
      role: 0,
    }

    const users = await db.User.findAll();
    users.map(user => {
      hash_map_user[user.id] = user;
    });
    const maps = await db.Map.findAll();
    maps.map(m => {
      hash_map_name_map[m.name] = m;
      hash_map_id_map[m.id] = m;
      if (m.cityId > 0) {
        hash_map_cityid_map[m.cityId] = m;
      }
    });
    const countries = await db.Country.findAll();
    countries.map(c => {
      hash_map_country[c.id] = c;
      // originCityId
    });

    for (let i = 0; i < users.length; i += 1) {
      let ins = users[i];
      let my_country = hash_map_country[ins.countryId];
      if (my_country) {
        let imEmperor = ins.id == my_country.emperorId;
        let originCityMap = hash_map_cityid_map[my_country.originCityId];
        if (imEmperor) {
          ins.role = 1;
        }
        ins.mapNowId = originCityMap.id;
        await ins.save();
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.bulkDelete("Countries", null, {truncate: true, cascade: true, restartIdentity: true});
  }
};

