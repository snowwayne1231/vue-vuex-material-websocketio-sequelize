"use strict";
const db = require('../models');
const dataset = [
  { name: '下野', detail: '【下野】{nickname} 已經自請浪跡天涯', staticKey: '_LEAVE_COUNTRY_'},
  { name: '入仕', detail: '【入仕】{nickname} 成功加入 {countryName} 成為武將', staticKey: '_ENTER_COUNTRY_'},
  { name: '戰役', detail: '', staticKey: '_WAR_'},
  { name: '野戰', detail: '【野戰】{atkCountryName} 與 {defCountryName} 於 {mapName} 發生戰役', staticKey: '_WAR_WILD_'},
  { name: '攻城戰', detail: '【攻城戰】{atkCountryName} 與 {defCountryName} 於 {mapName} 發生戰役', staticKey: '_WAR_CITY_'},
  { name: '建國', detail: '【建國】{nickname} 位於 {mapName} 自封為王 國號為 {countrySign}', staticKey: '_CREATE_COUNTRY_'},
  { name: '叛亂', detail: '【叛亂】{nickname} 位於 {mapName} 叛亂 {whether}', staticKey: '_CHAOS_'},
  { name: '滅國', detail: '【滅國】{defCountryName} 已被 {atkCountryName} 消滅', staticKey: '_DESTROY_COUNTRY_'},
  { name: '起義', detail: '【起義】{users} 已於 {mapName} 起義', staticKey: '_GROUP_UP_'},
  { name: '外交', detail: '【外交】{atkCountryName} 已與 {defCountryName} 結成同盟', staticKey: '_COUNTRY_RELATIONSHIP_'},
  { name: '官職', detail: '【任命】{countryName} {nickname} 已被任命為 {occupationName}', staticKey: '_OCCUPATION_'},
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const evts = await queryInterface.rawSelect('Events', {plain: false}, ['id']);
    if (evts && evts.length > 0) {
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

    await queryInterface.bulkInsert("Events", insertData);

  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Events", null, {truncate: true, cascade: true, restartIdentity: true});
  }
};

