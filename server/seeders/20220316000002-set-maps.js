"use strict";
const db = require('../models');
  // [ 1, '覓',
  // [ 2, '風',
  // [ 3, '空幹',
  // [ 4, '音悅', 
  // [ 5, '鬆露', 
  // [ 6, '影',
  // [ 7, '琥',
  // [ 8, '叡迅', 

const dataset = {
  '涪水關': 4,
  '建宁': 8,
  '江洲坡': 8,
  '江洲谷': 8,
  '陽平關': 1,
  '漢中谷': 1,
  '新野': 2,
  '新野東城': 2,
  '合肥新城': 2,
  '鄱陽西境': 7,
  '鄱陽東境': 7,
  '建業西境': 7,
  '晉陽關': 3,
  '平原西境': 3,
  '代縣南境': 5,
  '北平南境': 5,
  '北平關': 5,
  '北平': 5,
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const maps = await db.Map.findAll();
    for (let i = 0; i < maps.length; i++) {
      let map = maps[i];
      let mapNameCountryId = dataset[map.name];
      if (mapNameCountryId && mapNameCountryId > 0) {
        map.ownCountryId = mapNameCountryId;
      } else if (map.cityId == 0) {
        map.ownCountryId = 0;
      } else {
        let users = await db.User.findAll({where: {mapNowId: map.id}, limit: 1});
        if (users.length > 0) {
          map.ownCountryId = users[0].countryId;
        }
      }
      await map.save();
    }
  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.bulkDelete("City", null, {truncate: true, cascade: true, restartIdentity: true});
  }
};

