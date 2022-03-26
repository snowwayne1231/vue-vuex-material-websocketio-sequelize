"use strict";
const db = require('../models');
const dataset = [
  { name: '下野', detail: '【下野】{nickname} 已經自請浪跡天涯', staticKey: '_LEAVE_COUNTRY_'},
  { name: '入仕', detail: '【入仕】{nickname} 成功加入 {countryName} 成為武將', staticKey: '_ENTER_COUNTRY_'},
  { name: '戰役', detail: '【戰役】於 {mapName} 發生戰役', staticKey: '_WAR_'},
  { name: '野戰', detail: '【野戰】{atkCountryName} 與 {defCountryName} 於 {mapName} 發生戰役', staticKey: '_WAR_WILD_'},
  { name: '攻城戰', detail: '【攻城戰】{atkCountryName} 與 {defCountryName} 於 {mapName} 發生戰役', staticKey: '_WAR_CITY_'},
  { name: '戰役進攻', detail: '【戰役】{atkCountryName}({nicknames}) 成功奪下 {mapName} ', staticKey: '_WAR_WIN_'},
  { name: '戰役防守', detail: '【戰役】{defCountryName}({nicknames}) 成功守住 {mapName} ', staticKey: '_WAR_DEFENCE_'},
  { name: '建國', detail: '【建國】{nickname} 位於 {mapName} 自封為王 國號為 {countrySign}', staticKey: '_CREATE_COUNTRY_'},
  { name: '叛亂', detail: '【叛亂】{nickname} 位於 {mapName} 叛亂 {whether}', staticKey: '_CHAOS_'},
  { name: '滅國', detail: '【滅國】{defCountryName} 已被 {atkCountryName} 消滅', staticKey: '_DESTROY_COUNTRY_'},
  { name: '起義', detail: '【起義】{users} 已於 {mapName} 起義', staticKey: '_GROUP_UP_'},
  { name: '外交', detail: '【外交】{atkCountryName} 已與 {defCountryName} 結成同盟', staticKey: '_COUNTRY_RELATIONSHIP_'},
  { name: '官職', detail: '【任命】{countryName} {nickname} 已被任命為 {occupationName}', staticKey: '_OCCUPATION_'},
  { name: '系統恢復', detail: '【系統】所有人恢復每周行動力', staticKey: '_SYSTEM_RECOVER_'},
  { name: '俘虜逃脫', detail: '【俘虜】{nickname} 成功逃脫回主城', staticKey: '_CAPTIVE_ESCAPE_'},
  { name: '俘虜釋放', detail: '【俘虜】{nickname} 被 {emperor} 釋放並回到主城', staticKey: '_CAPTIVE_RELEASE_'},
  { name: '俘虜登庸', detail: '【俘虜】{nickname} 被 {emperor} 登庸成功', staticKey: '_CAPTIVE_RECRUIT_'},
  { name: '遷都', detail: '【遷都】{countryName} 已將主城遷移至 {mapName}', staticKey: '_MIGRATE_MAIN_CITY_'},
  { name: '招募', detail: '【招募】{countryName} 已成功招募 {nickname}', staticKey: '_RECRUIT_'},
  { name: '錦囊', detail: '【錦囊】{nickname} 已成功使用錦囊 {tips}}', staticKey: '_USE_TIPS_'},
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const evts = await queryInterface.rawSelect('Events', {plain: false}, ['id', 'staticKey']);
    const existKeys = evts.map(e => e.staticKey);
    const createdAt = new Date();

    const insertData = [];
    dataset.map(data => {
      if (existKeys.includes(data.staticKey)) { return }
      const _next_data = {
        ...data,
        createdAt: createdAt,
        updatedAt: createdAt,
      }
      insertData.push(_next_data);
    });
    if (insertData.length > 0) {
      await queryInterface.bulkInsert("Events", insertData);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Events", null, {truncate: true, cascade: true, restartIdentity: true});
  }
};

