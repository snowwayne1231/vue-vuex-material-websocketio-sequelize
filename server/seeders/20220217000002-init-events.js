"use strict";
const db = require('../models');
const dataset = [
  { name: '下野', detail: '{nickname} 已經自請浪跡天涯', staticKey: '_LEAVE_COUNTRY_'},
  { name: '入仕', detail: '{nickname} 成功加入 {countryName} 成為武將', staticKey: '_ENTER_COUNTRY_'},
  { name: '戰役', detail: '', staticKey: '_WAR_'},
  { name: '野戰', detail: '', staticKey: '_WAR_WILD_'},
  { name: '攻城戰', detail: '', staticKey: '_WAR_CITY_'},
  { name: '建國', detail: '', staticKey: '_CREATE_COUNTRY_'},
  { name: '叛亂', detail: '', staticKey: '_CHAOS_'},
  { name: '滅國', detail: '', staticKey: '_DESTROY_COUNTRY_'},
  { name: '起義', detail: '', staticKey: '_GROUP_UP_'},
  { name: '外交', detail: '', staticKey: '_COUNTRY_RELATIONSHIP_'},
  { name: '官職', detail: '', staticKey: '_OCCUPATION_'},
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const evts = await queryInterface.rawSelect('Events', {plain: false}, ['id']);
    if (evts && evts.length > 0) {
        return false;
    }



  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Events", null, {truncate: true, cascade: true, restartIdentity: true});
  }
};

