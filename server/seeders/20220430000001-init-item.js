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
// lv: 距離限制
// when: 0 -> 無限制  1 -> 被俘虜不行
// object 0 -> 立即  1 -> 任何領地  2 -> 友方領地  3 -> 敵方領地  4 -> 任何城池  5 -> 友方城池  6 -> 敵方城池  7 -> 任何野區  8 -> 友方野區  9 -> 敵方野區
const dataset = [
  {name: '三顧茅廬', detail: '招募任一據點全部浪人，成功機率100%', lv: 0, when: 1, object: 1, timeTerm: 0, staticKey: '_STRATEGY_RECRUIT_'},
  {name: '七進七出', detail: '即刻前往指定友方據點，如是俘虜則會100%逃脫', lv: 0, when: 0, object: 2, timeTerm: 0, staticKey: '_STRATEGY_MOVE_'},
  {name: '七擒七縱', detail: '指定鄰近一格敵方據點，俘虜據點裡貢獻值最低的"無加入戰役武將"', lv: 1, when: 1, object: 3, timeTerm: 0, staticKey: '_STRATEGY_CATCH_'},
  {name: '五穀豐登', detail: '永久增加所在城池的商業收入 15點', lv: 0, when: 1, object: 0, timeTerm: 0, staticKey: '_STRATEGY_ADD_RESOURCE_'},
  {name: '無中生有', detail: '升級所在城池所有建築物 (可突破上限lv 10)', lv: 0, when: 1, object: 0, timeTerm: 0, staticKey: '_STRATEGY_BUILDING_UP_'},
  {name: '順手牽羊', detail: '指定鄰近一格據點，奪走隨機一位武將的所有錦囊', lv: 1, when: 0, object: 1, timeTerm: 0, staticKey: '_STRATEGY_STEAL_'},
  {name: '兵糧寸斷', detail: '指定敵方據點，該據點所有武將的黃金減少 (國家領地數 x 2%)', lv: 0, when: 1, object: 3, timeTerm: 0, staticKey: '_STRATEGY_REDUCE_GOLD_'},
  {name: '火燒連營', detail: '指定鄰近一格敵方城池，該城池城牆等級減半且與其鄰近一格所有據點都必須修整一周無法出征(不影響已經發起的戰役，城牆等級減半後無條件進位)', lv: 1, when: 0, object: 6, timeTerm: 0, staticKey: '_STRATEGY_FIRE_'},
  {name: '趁火打劫', detail: '指定鄰近一格修整中的敵方據點 奪取其所有武將的 所有黃金', lv: 1, when: 0, object: 3, timeTerm: 0, staticKey: '_STRATEGY_FIRE_STEAL_'},
  {name: '調虎離山', detail: '指定任一敵方據點，強制其所有武將 隨機移動到該國的其他據點 (已經加入戰役的武將不受地圖移動影響)', lv: 0, when: 1, object: 3, timeTerm: 0, staticKey: '_STRATEGY_KICK_'},
  {name: '聲東擊西', detail: '指定任一敵方野區 將其所有鄰近一格的據點中所有該國武將 移到指定野區 並扣除其行動力1點 (已經加入戰役的武將不受地圖移動影響)', lv: 0, when: 1, object: 9, timeTerm: 0, staticKey: '_STRATEGY_EAST_WEST_'},
  {name: '子午谷奇襲', detail: '指定任一敵方野區，若該據點無人則立即佔領並移動到該地', lv: 0, when: 1, object: 9, timeTerm: 0, staticKey: '_STRATEGY_SNEAK_'},
  {name: '暗度陳倉', detail: '指定鄰近一格敵方城池，若該城池無敵方武將則直接攻下並移動到該城池 (無需打開戰役)', lv: 1, when: 1, object: 6, timeTerm: 0, staticKey: '_STRATEGY_SEIZE_'},
  {name: '石兵八陣', detail: '指定任一敵方城池，將指定城池所有鄰近一格據點中所有該國武將 移到指定城池 並扣除全部行動力 (已經加入戰役的武將不受地圖移動影響)', lv: 0, when: 1, object: 6, timeTerm: 0, staticKey: '_STRATEGY_TRAPE_'},
  {name: '空城計', detail: '對自身當前所在城池之戰役 直接取消其出征 並將其出征此城池的武將全數撤回主城 (資源不返還，貢獻值會保留)', lv: 0, when: 1, object: 0, timeTerm: 0, staticKey: '_STRATEGY_EMPTY_CITY_'},
  {name: '美人計', detail: '取消自身所在地周圍鄰近一格內所有據點的戰役 (資源不返還，貢獻值會保留)', lv: 0, when: 0, object: 0, timeTerm: 0, staticKey: '_STRATEGY_BEAUTY_'},
  {name: '苦肉計', detail: '扣去自身所有兵力並對周圍鄰近一格的據點中 所有"無加入戰役的敵方武將"扣去同等兵力數', lv: 0, when: 0, object: 0, timeTerm: 0, staticKey: '_STRATEGY_BITTER_'},
  {name: '反間計', detail: '奪走自身所在地鄰近一格敵方據點中 一位兵力最多之"無加入戰役的敵方武將"一半兵力', lv: 0, when: 0, object: 0, timeTerm: 0, staticKey: '_STRATEGY_SOLDIER_STEAL_'},
  {name: '連環計', detail: '所在地鄰近一格內所有"修整中"的據點裡，所有"無加入戰役武將"兵力數全部平均 (小數點無條件捨去)', lv: 0, when: 0, object: 0, timeTerm: 0, staticKey: '_STRATEGY_AVERAGE_'},
];
// 三顧茅廬	任何 (除被俘虜)	己方領地	指定領地
// 七進七出		任何	任何	己方領地
// 七擒七縱	
// 五穀豐登		任何 (除被俘虜)	己方城池	自身
// 無中生有		任何 (除被俘虜)	己方城池	自身
// 順手牽羊		任何	任何	指定領地 (距離1格)
// 兵糧寸斷		任何 (除被俘虜)	己方領地	敵方領地
// 火燒連營		任何 (除被俘虜)	己方領地	指定城池 (距離1格)
// 趁火打劫		任何 (除被俘虜)	己方領地	指定敵方領地 (修整中) (距離1格)
// 調虎離山 	任何 (除被俘虜)	己方領地	敵方領地
// 聲東擊西		任何 (除被俘虜)	己方領地	敵方野區 (有國家所屬)
// 子午谷奇襲		任何 (除被俘虜)	己方領地	指定野區 (無人)
// 暗度陳倉		任何 (除被俘虜)	己方領地	指定敵方城池 (無人) (距離1格)
// 石兵八陣		任何 (除被俘虜)	己方領地	敵方城池
// 空城計		任何 (除被俘虜)	己方城池	自身
// 美人計		任何	任何	自身
// 苦肉計		任何	任何	自身
// 反間計	 	任何	任何	自身
// 連環計		任何 (除被俘虜)	己方領地	自身


module.exports = {
  up: async (queryInterface, Sequelize) => {
    const items = await db.Item.findAll();
    const names = items.map(i => i.name);
    for (let i = 0; i < dataset.length; i++) {
      let data = dataset[i];
      let name = data.name;
      let gidx = names.indexOf(name);
      if (gidx>= 0) {
        await items[gidx].update(data);
      } else {
        await db.Item.create(data);
      }
    }
    // for test
    // const users = await db.User.findAll({where: {code: ['R343', 'R307', 'R064']}});
    // const testItems = await db.Item.findAll();
    // for (let u = 0; u < users.length; u++) {
    //   let user = users[u];
    //   for (let i = 0; i < testItems.length; i++) {
    //     let item = testItems[i];
    //     await db.PacketItem.create({
    //       userId: user.id,
    //       itemId: item.id,
    //       timestampDeadline: null,
    //       timestampUse: null,
    //       userTarget: 'none',
    //       status: 1,
    //     });
    //   }
    // }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Items", null, {truncate: true, cascade: true, restartIdentity: true});
    await queryInterface.bulkDelete("PacketItems", null, {truncate: true, cascade: true, restartIdentity: true});
  }
};

