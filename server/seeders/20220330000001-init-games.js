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
// ['typename', 'name', '1v1', '2v2', '3v3', '4v4', '1v2', '1v3', '1v4', '2v3', '2v4', '3v4'];
const typeIdMap = {'電競': 1, '運動': 2, '桌遊': 3, '棋類': 4}
const dataset = [
  [ '電競',	'瑪利歐賽車',	1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  [ '電競',	'躲避球大冒險',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '電競',	'Boomerang',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '電競',	'OverCooked',	1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  [ '電競',	'1-2-Switch',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '電競',	'Just Dance',	1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  [ '電競',	'靈活腦學校',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '電競',	'Beat Saber',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '電競',	'太豉達人',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '電競',	'超級雞馬',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '電競',	'全明星大亂鬥',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '運動',	'桌球',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '運動',	'弓箭靶',	1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  [ '運動',	'軟彈槍(射桶子)',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '運動',	'飛標機',	1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  [ '運動',	'粘球靶',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '運動',	'推啤酒',	1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  [ '運動',	'吹乒乓球',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '運動',	'搖擺計步器',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'骰子(比大小)',	1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  [ '桌遊',	'骰子(吹牛)',	1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  [ '桌遊',	'數獨',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'出包魔法師',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'傳情畫意',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'層層疊',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'搶狗骨頭',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'逃離亞克蘭提斯',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'九九',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'接龍',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'記憶力大考驗',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'UNO',	1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  [ '桌遊',	'心臟病',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'字字轉機',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'角角心機 CONEX',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'說書人',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'三國殺',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '桌遊',	'驚爆倫敦',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '棋類',	'西洋棋',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '棋類',	'五子棋',	1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  [ '棋類',	'象棋',	1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  [ '棋類',	'彈指棋',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '棋類',	'彈跳球',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '棋類',	'飛行棋',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '棋類',	'黑白棋',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '棋類',	'三國棋',	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ '棋類',	'拉密',	1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
];

const mapTypes = [
  ['覓', '漢中', '桌遊'],
  ['覓', '天水', '桌遊'],
  ['覓', '上庸', '運動'],
  ['風', '汝南', '電競'],
  ['風', '新野', '桌遊'],
  ['風', '廬江', '運動'],
  ['空幹', '鄴', '運動'],
  ['空幹', '晉陽', '運動'],
  ['空幹', '平原', '運動'],
  ['音悅', '梓潼', '電競'],
  ['音悅', '成都', '運動'],
  ['鬆露', '北平', '運動'],
  ['鬆露', '代縣', '桌遊'],
  ['鬆露', '南皮', '桌遊'],
  ['影', '武陵', '棋類'],
  ['琥', '鄱陽', '電競'],
  ['琥', '桂陽', '電競'],
  ['琥', '建業', '桌遊'],
  ['叡迅', '雲南', '棋類'],
]

const getObj = (ary) => {
  return {
    type: typeIdMap[ary[0]],
    name: ary[1],
    b1v1: ary[2],
    b2v2: ary[3],
    b3v3: ary[4],
    b4v4: ary[5],
    b1v2: ary[6],
    b1v3: ary[7],
    b1v4: ary[8],
    b2v3: ary[9],
    b2v4: ary[10],
    b3v4: ary[11],
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const games = await db.Game.findAll();
    const gameNames = games.map(g => g.name);
    for (let i = 0; i < dataset.length; i++) {
      let newgame = dataset[i];
      let gname = newgame[1];
      let gidx = gameNames.indexOf(gname);
      if (gidx>= 0) {
        await games[gidx].update(getObj(newgame));
      } else {
        await db.Game.create(getObj(newgame));
      }
    }

    const maps = await db.Map.findAll();
    const mapHash = {};
    maps.map(m => {mapHash[m.id] = m});
    const numleft = maps.filter(m => m.cityId > 0).length - mapTypes.length;
    const cityRandomAry = [];
    let it = 1;
    while (cityRandomAry.length < numleft) {
      let rand = Math.floor(Math.random() * cityRandomAry.length);
      cityRandomAry.splice(rand, 0, it);
      it +=1 ;
      if (it >= 5) { it = 1; }
    }

    for (let i = 0; i < maps.length; i++) {
      let map = maps[i];
      let mapName = map.name;

      let findedMapType = mapTypes.find(e => e[1] == mapName);
      if (findedMapType) {
        let typeName = findedMapType[2];
        let typeInt = typeIdMap[typeName];
        map.gameType = typeInt;
        await map.save();
      } else if (map.cityId > 0) {
        let drawOut = cityRandomAry.splice(0, 1)[0];
        if (drawOut) {
          map.gameType = drawOut;
          await map.save();
        }
      }
    }

    for (let i = 0; i < maps.length; i++) {
      let map = maps[i];

      if (map.cityId == 0) {
        let route = typeof map.route == 'string' ? map.route.split(',').map(_ => parseInt(_)) : map.route;
        let neighborTypes =  route.map(r => {
          let _map = mapHash[r];
          if (_map.cityId > 0) {
            return _map.gameType;
          }
          let _route = typeof _map.route == 'string' ? _map.route.split(',').map(_ => parseInt(_)) : _map.route;
          let _cityMapId =_route.find(_ => mapHash[_].cityId > 0);
          return _cityMapId ? mapHash[_cityMapId].gameType : 0;
        });
        neighborTypes.sort((a,b) => a - b);
        map.gameType = parseInt(neighborTypes.filter((n, idx, self) => n > 0 && self.indexOf(n) == idx).join(''), 10);
        await map.save();
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Game", null, {truncate: true, cascade: true, restartIdentity: true});
  }
};

