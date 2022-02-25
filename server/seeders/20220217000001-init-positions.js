"use strict";
const db = require('../models');
const countryDataset = [
  { name: '風', mainCity: '汝南', otherCity: ['廬江', '新野']},
  { name: '覓', mainCity: '漢中', otherCity: ['上庸', '天水']},
  { name: '空幹', mainCity: '鄴', otherCity: ['平原', '晉陽']},
  { name: '音悅', mainCity: '梓潼', otherCity: ['成都']},
  { name: '鬆露', mainCity: '北平', otherCity: ['南皮', '代縣']},
  { name: '影', mainCity: '武陵', otherCity: []},
  { name: '琥', mainCity: '鄱陽', otherCity: ['桂陽', '零陵']},
  { name: '叡迅', mainCity: '雲南', otherCity: ['江洲', '永安']},
];

const userLocations = [];


module.exports = {
  up: async (queryInterface, Sequelize) => {
    
    const hash_map_user = {};
    const hash_map_name_map = {};
    const hash_map_id_map = {};
    const hash_map_cityid_map = {};
    const hash_map_country = {};

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


    for (let i = 0; i < countryDataset.length; i++) {
      const data = countryDataset[i];
      const country = data.name;
      const mainCity = data.mainCity;
      const otherCity = data.otherCity;
      const countryInstance = countries.find(e => e.name == country);
      const countryId = countryInstance.id;
      const mapInstance = maps.find(m => m.name == mainCity);
      mapInstance.ownCountryId = countryId;
      await mapInstance.save();
      for (let x = 0; x < otherCity.length; x++) {
        const city = otherCity[x];
        const mapIns = maps.find(m => m.name == city);
        mapIns.ownCountryId = countryId;
        await mapIns.save();
      }
    }

  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.bulkDelete("Countries", null, {truncate: true, cascade: true, restartIdentity: true});
  }
};

