"use strict";
const db = require('../models');
const column = ["id", "name", "sign", "peopleMax", "color", "cityName", "emperorName"];
const dataset = [
  [ 1, '好煩', '好煩', 15, '#白', '漢中', '施琲琲' ],
  [ 2, '風', '風', 15, '#紫', '汝南', '李維克' ],
  [ 3, '空幹', '空幹', 15, '#黑', '鄴', '許維克' ],
  [ 4, '音悅', '音悅', 10, '#藍', '梓潼', '黃杰夫' ],
  [ 5, '鬆露', '鬆露', 15, '#靛', '北平', '黃龜龜' ],
  [ 6, '影', '影', 10, '#紅', '武陵', '許山姆' ],
  [ 7, '琥', '琥', 15, '#橙', '鄱陽', '趙強森' ],
  [ 8, '叡迅', '叡迅', 15, '#綠', '雲南', '謝小白' ],
];
const template = {
  name: '',
  sign: '',
  money: 0,
  emperorId: 0,
  peopleMax: 5,
  color: '',
  originCityId: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};


module.exports = {
  up: async (queryInterface, Sequelize) => {
    const insertCountryData = [];
    const loc = await queryInterface.rawSelect("Countries", {}, ["id"]);
    if (loc) { return false; }

    const hash_map_city = {};
    const hash_map_user = {};
    const users = await db.User.findAll();
    
    users.map(user => {
      hash_map_user[user.nickname] = user.id;
    });
    const cities = await db.City.findAll();
    cities.map(city => {
      hash_map_city[city.name] = city.id;
    });

    const next_dataset = dataset.map(data => {
      let id = data[0];
      let name = data[1];
      let sign = data[2];
      let peopleMax = data[3];
      let color = data[4];
      let cityName = data[5];
      let emperorName = data[6];

      return {
        ...template,
        id,
        name,
        sign,
        peopleMax,
        color,
        originCityId: hash_map_city[cityName],
        emperorId: hash_map_user[emperorName],
      }
    });

    for (let i = 0; i < next_dataset.length; i+=1) {
      let data = next_dataset[i];
      await db.Country.create(data, {include: [db.City, db.User]});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Countries", null, {truncate: true, cascade: true, restartIdentity: true});
  }
};

