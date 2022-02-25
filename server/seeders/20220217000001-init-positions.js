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

const userLocations = [
  {
      "nickname": "張理查",
      "location": "江洲"
  },
  {
      "nickname": "侯祈",
      "location": "天水"
  },
  {
      "nickname": "全彼得",
      "location": "北平"
  },
  {
      "nickname": "黃龜龜",
      "location": "北平"
  },
  {
      "nickname": "林波奇",
      "location": "江洲"
  },
  {
      "nickname": "楊哈子",
      "location": "漢中"
  },
  {
      "nickname": "何噠噠",
      "location": "漢中"
  },
  {
      "nickname": "焦婕西",
      "location": "雲南"
  },
  {
      "nickname": "甘肯",
      "location": "梓潼"
  },
  {
      "nickname": "黃杰夫",
      "location": "梓潼"
  },
  {
      "nickname": "邱鬼客",
      "location": "鄱陽"
  },
  {
      "nickname": "楊祿",
      "location": "鄱陽"
  },
  {
      "nickname": "許瑞塔",
      "location": "鄱陽"
  },
  {
      "nickname": "楊水晶",
      "location": "江洲"
  },
  {
      "nickname": "林強壯",
      "location": "天水"
  },
  {
      "nickname": "林欣欣",
      "location": "梓潼"
  },
  {
      "nickname": "趙強森",
      "location": "鄱陽"
  },
  {
      "nickname": "林桑",
      "location": "江洲"
  },
  {
      "nickname": "陳羅壹",
      "location": "鄱陽"
  },
  {
      "nickname": "朱凱文",
      "location": "鄴"
  },
  {
      "nickname": "黃義鯊",
      "location": "代縣"
  },
  {
      "nickname": "陳杰德",
      "location": "武陵"
  },
  {
      "nickname": "張華特",
      "location": "零陵"
  },
  {
      "nickname": "余鱗",
      "location": "鄴"
  },
  {
      "nickname": "鄒墾丁",
      "location": "零陵"
  },
  {
      "nickname": "林特",
      "location": "汝南"
  },
  {
      "nickname": "鍾沙亞",
      "location": "新野"
  },
  {
      "nickname": "宋萊恩",
      "location": "鄴"
  },
  {
      "nickname": "林單單",
      "location": "漢中"
  },
  {
      "nickname": "吳玫",
      "location": "北平"
  },
  {
      "nickname": "高茯苓",
      "location": "梓潼"
  },
  {
      "nickname": "譚雅各",
      "location": "鄴"
  },
  {
      "nickname": "徐司",
      "location": "平原"
  },
  {
      "nickname": "陳爩繘戫",
      "location": "北平"
  },
  {
      "nickname": "程寶寶",
      "location": "北平"
  },
  {
      "nickname": "王福康",
      "location": "雲南"
  },
  {
      "nickname": "許維克",
      "location": "鄴"
  },
  {
      "nickname": "洪零",
      "location": "汝南"
  },
  {
      "nickname": "林森",
      "location": "桂陽"
  },
  {
      "nickname": "王筆的",
      "location": "北平"
  },
  {
      "nickname": "葉威力",
      "location": "平原"
  },
  {
      "nickname": "李莫爾",
      "location": "汝南"
  },
  {
      "nickname": "張灰",
      "location": "南皮"
  },
  {
      "nickname": "郭杜克",
      "location": "平原"
  },
  {
      "nickname": "賴克西亞",
      "location": "南皮"
  },
  {
      "nickname": "李提姆",
      "location": "汝南"
  },
  {
      "nickname": "蔡迪桑",
      "location": "南皮"
  },
  {
      "nickname": "謝多南",
      "location": "南皮"
  },
  {
      "nickname": "李維克",
      "location": "汝南"
  },
  {
      "nickname": "陳苓苓",
      "location": "桂陽"
  },
  {
      "nickname": "于凱琳",
      "location": "晉陽"
  },
  {
      "nickname": "許亨利",
      "location": "廬江"
  },
  {
      "nickname": "王大衛",
      "location": "南皮"
  },
  {
      "nickname": "黃賓娜",
      "location": "代縣"
  },
  {
      "nickname": "李戎龍",
      "location": "代縣"
  },
  {
      "nickname": "柯安格斯",
      "location": "晉陽"
  },
  {
      "nickname": "方傑克",
      "location": "廬江"
  },
  {
      "nickname": "郭棣",
      "location": "廬江"
  },
  {
      "nickname": "李雪倫",
      "location": "新野"
  },
  {
      "nickname": "劉厄普頓",
      "location": "廬江"
  },
  {
      "nickname": "曾吉米",
      "location": "廬江"
  },
  {
      "nickname": "黃霍華德",
      "location": "梓潼"
  },
  {
      "nickname": "廖姆濕",
      "location": "新野"
  },
  {
      "nickname": "黃史改",
      "location": "成都"
  },
  {
      "nickname": "陳安柏",
      "location": "成都"
  },
  {
      "nickname": "吳琳達",
      "location": "成都"
  },
  {
      "nickname": "林阿翔",
      "location": ""
  },
  {
      "nickname": "楊傑",
      "location": "桂陽"
  },
  {
      "nickname": "趙斯特",
      "location": "新野"
  },
  {
      "nickname": "古曼蒂",
      "location": "成都"
  },
  {
      "nickname": "謝謝泥",
      "location": "代縣"
  },
  {
      "nickname": "廖尚恩",
      "location": "武陵"
  },
  {
      "nickname": "許山姆",
      "location": "武陵"
  },
  {
      "nickname": "施琲琲",
      "location": "漢中"
  },
  {
      "nickname": "葉尚恩",
      "location": "平原"
  },
  {
      "nickname": "張艾比",
      "location": "新野"
  },
  {
      "nickname": "歐陽子",
      "location": "漢中"
  },
  {
      "nickname": "謝小白",
      "location": "雲南"
  },
  {
      "nickname": "葉蘿拉",
      "location": "天水"
  },
  {
      "nickname": "楊薇薇",
      "location": "桂陽"
  },
  {
      "nickname": "高湯米",
      "location": "天水"
  },
  {
      "nickname": "楊斯坦",
      "location": "雲南"
  },
  {
      "nickname": "張傑瑞",
      "location": "平原"
  },
  {
      "nickname": "魏漢克",
      "location": "雲南"
  },
  {
      "nickname": "王燁妲",
      "location": "上庸"
  },
  {
      "nickname": "盧瑞秋",
      "location": "代縣"
  },
  {
      "nickname": "曾海倫",
      "location": ""
  },
  {
      "nickname": "莊雪",
      "location": "西涼"
  },
  {
      "nickname": "徐凱",
      "location": "晉陽"
  },
  {
      "nickname": "駱傑克",
      "location": "晉陽"
  },
  {
      "nickname": "曾文森",
      "location": "桂陽"
  },
  {
      "nickname": "楊艾倫",
      "location": "永安"
  },
  {
      "nickname": "吳阿爾維斯",
      "location": "武陵"
  },
  {
      "nickname": "林布萊恩",
      "location": ""
  },
  {
      "nickname": "楊凱文",
      "location": "永安"
  },
  {
      "nickname": "林利歐",
      "location": "零陵"
  },
  {
      "nickname": "黃塞蒙",
      "location": "晉陽"
  },
  {
      "nickname": "周尚恩",
      "location": "上庸"
  },
  {
      "nickname": "葉魏詩",
      "location": "上庸"
  },
  {
      "nickname": "陳大衛",
      "location": "上庸"
  },
  {
      "nickname": "林愛文",
      "location": "武陵"
  }
];


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
      }
      let findLocation = userLocations.find(e => e.nickname == ins.nickname);
      if (findLocation) {
        let locationName = findLocation.location;
        let lomap = hash_map_name_map[locationName];
        if (lomap) {
          ins.mapNowId = lomap.id;
        }
      }
      await ins.save();
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

