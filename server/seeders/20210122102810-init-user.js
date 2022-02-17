'use strict';

const dataset = [
  {
      "nickname": "張理查",
      "nameEn": "Richard Chang",
      "nameZh": "張裕",
      "department": "資料庫管理處",
      "code": "R002"
  },
  {
      "nickname": "侯米奇",
      "nameEn": "Mickey Hou",
      "nameZh": "侯統揚",
      "department": "運維中心",
      "code": "R001"
  },
  {
      "nickname": "全彼得",
      "nameEn": "Peter Chuang",
      "nameZh": "全士芃",
      "department": "值班技術一組",
      "code": "R006"
  },
  {
      "nickname": "黃龜龜",
      "nameEn": "Turtle Huang",
      "nameZh": "黃海威",
      "department": "值班技術一組",
      "code": "R008"
  },
  {
      "nickname": "林波奇",
      "nameEn": "Poki Lin",
      "nameZh": "林子翔",
      "department": "值班技術二組",
      "code": "R007"
  },
  {
      "nickname": "楊哈子",
      "nameEn": "Hako Yang",
      "nameZh": "楊劭儀",
      "department": "客戶服務部",
      "code": "R009"
  },
  {
      "nickname": "何噠噠",
      "nameEn": "Dada Ho",
      "nameZh": "何俊達",
      "department": "值班技術四組",
      "code": "R011"
  },
  {
      "nickname": "焦婕西",
      "nameEn": "Jessie Chiao",
      "nameZh": "焦小紅",
      "department": "聊天管理組",
      "code": "R013"
  },
  {
      "nickname": "甘肯",
      "nameEn": "Ken Kan",
      "nameZh": "甘博仁",
      "department": "值班客服二組",
      "code": "R015"
  },
  {
      "nickname": "黃杰夫",
      "nameEn": "Jeff Huang",
      "nameZh": "黃忠信",
      "department": "值班客服二組",
      "code": "R017"
  },
  {
      "nickname": "邱鬼客",
      "nameEn": "Quake Chiu",
      "nameZh": "邱柏洋",
      "department": "值班技術三組",
      "code": "R018"
  },
  {
      "nickname": "楊祿",
      "nameEn": "Luke Yang",
      "nameZh": "楊伯麟",
      "department": "運維中心",
      "code": "R021"
  },
  {
      "nickname": "許瑞塔",
      "nameEn": "Rita Hsu",
      "nameZh": "許雅玲",
      "department": "值班客服一組",
      "code": "R024"
  },
  {
      "nickname": "楊水晶",
      "nameEn": "Crystal Yang",
      "nameZh": "楊麗萍",
      "department": "聊天管理組",
      "code": "R023"
  },
  {
      "nickname": "林強壯",
      "nameEn": "Strong Lin",
      "nameZh": "林世創",
      "department": "值班客服一組",
      "code": "R022"
  },
  {
      "nickname": "林欣欣",
      "nameEn": "Shin Lin",
      "nameZh": "林欣馨",
      "department": "值班客服三組",
      "code": "R027"
  },
  {
      "nickname": "趙強森",
      "nameEn": "Johnson Chao",
      "nameZh": "趙祐晟",
      "department": "系統管理組",
      "code": "R026"
  },
  {
      "nickname": "林桑",
      "nameEn": "Eric Lin",
      "nameZh": "林子雲",
      "department": "客戶服務部",
      "code": "R031"
  },
  {
      "nickname": "陳羅壹",
      "nameEn": "Roy Chen",
      "nameZh": "陳孟成",
      "department": "值班客服二組",
      "code": "R035"
  },
  {
      "nickname": "朱凱文",
      "nameEn": "Kevin Chu",
      "nameZh": "朱書賢",
      "department": "值班客服三組",
      "code": "R033"
  },
  {
      "nickname": "黃義鯊",
      "nameEn": "Ruiza Huang",
      "nameZh": "黃子寧",
      "department": "值班客服三組",
      "code": "R037"
  },
  {
      "nickname": "陳杰德",
      "nameEn": "Jader Chen",
      "nameZh": "陳家德",
      "department": "值班技術二組",
      "code": "R040"
  },
  {
      "nickname": "張華特",
      "nameEn": "Walter Chang",
      "nameZh": "張振華",
      "department": "風險管理處",
      "code": "R045"
  },
  {
      "nickname": "余鱗",
      "nameEn": "Peilin Yu",
      "nameZh": "余佩霖",
      "department": "值班客服三組",
      "code": "R044"
  },
  {
      "nickname": "鄒墾丁",
      "nameEn": "Candy Tsou",
      "nameZh": "鄒宜君",
      "department": "值班客服二組",
      "code": "R043"
  },
  {
      "nickname": "林特",
      "nameEn": "Matt Lin",
      "nameZh": "林育賢",
      "department": "值班客服二組",
      "code": "R046"
  },
  {
      "nickname": "鍾沙亞",
      "nameEn": "Saya Zhun",
      "nameZh": "鍾瀅",
      "department": "值班客服三組",
      "code": "R047"
  },
  {
      "nickname": "宋萊恩",
      "nameEn": "Ryan Sung",
      "nameZh": "宋長洲",
      "department": "值班技術二組",
      "code": "R049"
  },
  {
      "nickname": "林單單",
      "nameEn": "Dennis Lin",
      "nameZh": "林永鋒",
      "department": "系統管理組",
      "code": "R052"
  },
  {
      "nickname": "吳玫",
      "nameEn": "Mavis Wu",
      "nameZh": "吳美君",
      "department": "架構發展事業部",
      "code": "R050"
  },
  {
      "nickname": "高茯苓",
      "nameEn": "Evelyn Kao",
      "nameZh": "高薇雯",
      "department": "值班客服一組",
      "code": "R056"
  },
  {
      "nickname": "譚雅各",
      "nameEn": "Jacob Tan",
      "nameZh": "譚奇勝",
      "department": "值班客服三組",
      "code": "R055"
  },
  {
      "nickname": "徐司",
      "nameEn": "Leo Hsu",
      "nameZh": "徐銘鴻",
      "department": "資料庫管理組",
      "code": "R053"
  },
  {
      "nickname": "陳爩繘戫",
      "nameEn": "Yuchen Chen",
      "nameZh": "陳昱丞",
      "department": "值班技術一組",
      "code": "R059"
  },
  {
      "nickname": "程寶寶",
      "nameEn": "Castle Cheng",
      "nameZh": "程晉鴻",
      "department": "開發組",
      "code": "R064"
  },
  {
      "nickname": "王福康",
      "nameEn": "Falcon Wang",
      "nameZh": "王嘉偉",
      "department": "資料庫管理組",
      "code": "R067"
  },
  {
      "nickname": "許維克",
      "nameEn": "Vic Hsu",
      "nameZh": "許嘉維",
      "department": "值班技術三組",
      "code": "R069"
  },
  {
      "nickname": "洪零",
      "nameEn": "Lin Hong",
      "nameZh": "洪廷霖",
      "department": "值班技術四組",
      "code": "R075"
  },
  {
      "nickname": "林森",
      "nameEn": "Alison Lin",
      "nameZh": "林宛諭",
      "department": "值班客服三組",
      "code": "R082"
  },
  {
      "nickname": "王筆的",
      "nameEn": "Peter Wang",
      "nameZh": "王智威",
      "department": "值班技術一組",
      "code": "R094"
  },
  {
      "nickname": "葉威力",
      "nameEn": "Willie Yeh",
      "nameZh": "葉庭瑋",
      "department": "值班客服二組",
      "code": "R100"
  },
  {
      "nickname": "李莫爾",
      "nameEn": "Moore Lee",
      "nameZh": "李洪彰",
      "department": "值班客服一組",
      "code": "R109"
  },
  {
      "nickname": "張灰",
      "nameEn": "Grey Chang",
      "nameZh": "張士駿",
      "department": "值班技術一組",
      "code": "R113"
  },
  {
      "nickname": "郭杜克",
      "nameEn": "Duke Kuo",
      "nameZh": "郭庭維",
      "department": "值班技術一組",
      "code": "R120"
  },
  {
      "nickname": "賴克西亞",
      "nameEn": "Exia Lai",
      "nameZh": "賴佳昌",
      "department": "值班技術二組",
      "code": "R123"
  },
  {
      "nickname": "李提姆",
      "nameEn": "Tim Lee",
      "nameZh": "李政庭",
      "department": "值班客服三組",
      "code": "R133"
  },
  {
      "nickname": "蔡迪桑",
      "nameEn": "Andy Tsai",
      "nameZh": "蔡偉豪",
      "department": "值班技術一組",
      "code": "R147"
  },
  {
      "nickname": "謝多南",
      "nameEn": "Donem Hsieh",
      "nameZh": "謝文中",
      "department": "值班技術一組",
      "code": "R164"
  },
  {
      "nickname": "李維克",
      "nameEn": "Vic Lee",
      "nameZh": "李家維",
      "department": "值班技術四組",
      "code": "R179"
  },
  {
      "nickname": "陳苓苓",
      "nameEn": "Lynn Chen",
      "nameZh": "陳孟伶",
      "department": "值班客服一組",
      "code": "R178"
  },
  {
      "nickname": "于凱琳",
      "nameEn": "Cailin Yu",
      "nameZh": "余采疄",
      "department": "值班客服三組",
      "code": "R176"
  },
  {
      "nickname": "許亨利",
      "nameEn": "Henry Hsu",
      "nameZh": "許玉暉",
      "department": "值班技術一組",
      "code": "R185"
  },
  {
      "nickname": "王大衛",
      "nameEn": "David Wang",
      "nameZh": "王彥翔",
      "department": "值班技術四組",
      "code": "R187"
  },
  {
      "nickname": "黃賓娜",
      "nameEn": "Sabrina Huang",
      "nameZh": "黃冠",
      "department": "值班客服三組",
      "code": "R192"
  },
  {
      "nickname": "李戎龍",
      "nameEn": "Arron Lee",
      "nameZh": "李晏青",
      "department": "值班技術一組",
      "code": "R198"
  },
  {
      "nickname": "柯安格斯",
      "nameEn": "Angus Ko",
      "nameZh": "柯力元",
      "department": "值班客服三組",
      "code": "R196"
  },
  {
      "nickname": "方傑克",
      "nameEn": "Jack Fun",
      "nameZh": "方科登",
      "department": "聊天管理組",
      "code": "R205"
  },
  {
      "nickname": "郭棣",
      "nameEn": "Steven Kuo",
      "nameZh": "郭誠馥",
      "department": "值班客服二組",
      "code": "R209"
  },
  {
      "nickname": "李雪倫",
      "nameEn": "Sharon Lee",
      "nameZh": "李修鳳",
      "department": "值班技術三組",
      "code": "R231"
  },
  {
      "nickname": "劉厄普頓",
      "nameEn": "Upton Liu",
      "nameZh": "劉祥軒",
      "department": "值班客服一組",
      "code": "R230"
  },
  {
      "nickname": "曾吉米",
      "nameEn": "Jimmy Tseng",
      "nameZh": "曾彥志",
      "department": "值班技術三組",
      "code": "R235"
  },
  {
      "nickname": "黃霍華德",
      "nameEn": "Howard Huang",
      "nameZh": "黃瑋顥",
      "department": "聊天管理組",
      "code": "R246"
  },
  {
      "nickname": "廖姆濕",
      "nameEn": "James Liao",
      "nameZh": "廖川賢",
      "department": "值班技術三組",
      "code": "R251"
  },
  {
      "nickname": "黃史改",
      "nameEn": "Sky Huang",
      "nameZh": "黃忠政",
      "department": "聊天管理組",
      "code": "R255"
  },
  {
      "nickname": "陳安柏",
      "nameEn": "Amber Chen",
      "nameZh": "陳玉青",
      "department": "值班客服三組",
      "code": "R264"
  },
  {
      "nickname": "吳琳達",
      "nameEn": "Linda Wu",
      "nameZh": "吳婉寧",
      "department": "值班客服一組",
      "code": "R269"
  },
  {
      "nickname": "林阿翔",
      "nameEn": "Gene Lin",
      "nameZh": "林毅翔",
      "department": "聊天管理組",
      "code": "R272"
  },
  {
      "nickname": "楊傑",
      "nameEn": "Jeffrey Yang",
      "nameZh": "楊嘉進",
      "department": "值班客服二組",
      "code": "R276"
  },
  {
      "nickname": "趙斯特",
      "nameEn": "Chester Chao",
      "nameZh": "趙御尊",
      "department": "值班客服一組",
      "code": "R279"
  },
  {
      "nickname": "古曼蒂",
      "nameEn": "Mandy Gu",
      "nameZh": "古淑華",
      "department": "聊天管理組",
      "code": "R281"
  },
  {
      "nickname": "謝謝泥",
      "nameEn": "Jenny Hsieh",
      "nameZh": "謝蕓楨",
      "department": "值班客服二組",
      "code": "R285"
  },
  {
      "nickname": "廖尚恩",
      "nameEn": "Sean Liao",
      "nameZh": "廖尚緯",
      "department": "值班技術二組",
      "code": "R289"
  },
  {
      "nickname": "許山姆",
      "nameEn": "Sam Hsu",
      "nameZh": "許恩振",
      "department": "值班技術三組",
      "code": "R293"
  },
  {
      "nickname": "施琲琲",
      "nameEn": "Bella Shih",
      "nameZh": "施佩儀",
      "department": "值班客服二組",
      "code": "R297"
  },
  {
      "nickname": "葉尚恩",
      "nameEn": "Hsiang Yeh",
      "nameZh": "葉相余",
      "department": "值班技術二組",
      "code": "R300"
  },
  {
      "nickname": "張艾比",
      "nameEn": "Abby Chang",
      "nameZh": "張若凡",
      "department": "聊天管理組",
      "code": "R305"
  },
  {
      "nickname": "歐陽子",
      "nameEn": "Teresa Ouyang",
      "nameZh": "歐陽霆",
      "department": "值班客服二組",
      "code": "R306"
  },
  {
      "nickname": "謝小白",
      "nameEn": "White Hsieh",
      "nameZh": "謝智宇",
      "department": "值班技術四組",
      "code": "R307"
  },
  {
      "nickname": "葉蘿拉",
      "nameEn": "Lora Yeh",
      "nameZh": "葉雅齡",
      "department": "值班客服二組",
      "code": "R313"
  },
  {
      "nickname": "楊薇薇",
      "nameEn": "Vivian Yang",
      "nameZh": "楊馥華",
      "department": "值班客服一組",
      "code": "R312"
  },
  {
      "nickname": "高湯米",
      "nameEn": "Tommy Kao",
      "nameZh": "高意修",
      "department": "總務行政處",
      "code": "R323"
  },
  {
      "nickname": "楊斯坦",
      "nameEn": "Stan Yang",
      "nameZh": "楊昀岳",
      "department": "值班客服一組",
      "code": "R322"
  },
  {
      "nickname": "張傑瑞",
      "nameEn": "Jerry Chang",
      "nameZh": "張振嘉",
      "department": "值班技術二組",
      "code": "R330"
  },
  {
      "nickname": "魏漢克",
      "nameEn": "Hank Wei",
      "nameZh": "魏詠霖",
      "department": "聊天管理組",
      "code": "R332"
  },
  {
      "nickname": "王燁妲",
      "nameEn": "Yetta Wang",
      "nameZh": "王彥穎",
      "department": "值班客服一組",
      "code": "R335"
  },
  {
      "nickname": "盧瑞秋",
      "nameEn": "Rachel Lu",
      "nameZh": "盧瑞琳",
      "department": "值班客服三組",
      "code": "R339"
  },
  {
      "nickname": "曾海倫",
      "nameEn": "Helen Tseng",
      "nameZh": "曾若慈",
      "department": "系統管理組",
      "code": "R341"
  },
  {
      "nickname": "莊雪",
      "nameEn": "Snow Jhung",
      "nameZh": "莊格維",
      "department": "開發組",
      "code": "R343"
  },
  {
      "nickname": "徐凱",
      "nameEn": "Kai Hsu",
      "nameZh": "徐鵬凱",
      "department": "值班技術三組",
      "code": "R342"
  },
  {
      "nickname": "駱傑克",
      "nameEn": "Jack Lo",
      "nameZh": "駱文傑",
      "department": "值班技術二組",
      "code": "R348"
  },
  {
      "nickname": "曾文森",
      "nameEn": "Vincent Tseng",
      "nameZh": "曾靖倫",
      "department": "系統管理組",
      "code": "R350"
  },
  {
      "nickname": "楊艾倫",
      "nameEn": "Alan Yang",
      "nameZh": "楊東諺",
      "department": "聊天管理組",
      "code": "R349"
  },
  {
      "nickname": "吳阿爾維斯",
      "nameEn": "Alvis Wu",
      "nameZh": "吳建逸",
      "department": "值班技術三組",
      "code": "R356"
  },
  {
      "nickname": "林布萊恩",
      "nameEn": "Brian Lin",
      "nameZh": "林楷聖",
      "department": "值班技術四組",
      "code": "R357"
  },
  {
      "nickname": "楊凱文",
      "nameEn": "Kevin Yang",
      "nameZh": "楊深有",
      "department": "值班技術四組",
      "code": "R358"
  },
  {
      "nickname": "林利歐",
      "nameEn": "Leo Lin",
      "nameZh": "林孟鴻",
      "department": "系統管理組",
      "code": "R359"
  },
  {
      "nickname": "黃塞蒙",
      "nameEn": "Simon Huang",
      "nameZh": "黃嘉界",
      "department": "資料庫管理組",
      "code": "R363"
  },
  {
      "nickname": "周尚恩",
      "nameEn": "Sean Chou",
      "nameZh": "周爾宣",
      "department": "風險管理處",
      "code": "R366"
  },
  {
      "nickname": "葉魏詩",
      "nameEn": "Wesley Yeh",
      "nameZh": "葉廷軒",
      "department": "風險管理處",
      "code": "R368"
  },
  {
      "nickname": "陳大衛",
      "nameEn": "David Chen",
      "nameZh": "陳仕家",
      "department": "風險管理處",
      "code": "R369"
  },
  {
      "nickname": "林愛文",
      "nameEn": "Ivan Lin",
      "nameZh": "林育弘",
      "department": "值班技術二組",
      "code": "R370"
  }
];





module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = await queryInterface.rawSelect('Users', {plain: false}, ['code']);
    let insertData = [];
    if (users) {
      // console.log('users: ',users );
      const codes = users.map(u => u['code']);
      dataset.map(d => {
        let idx = codes.indexOf(d['code']);
        if (idx == -1) {
          insertData.push(d);
        }
      });
    } else {
      insertData = dataset;
    }
    insertData = insertData.map(e => {
      return {code: e.code, nameEn: e.nameEn, nameZh: e.nameZh, createdAt: new Date(), updatedAt: new Date()};
    })
    return queryInterface.bulkInsert('Users', insertData);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {truncate: true, cascade: true, restartIdentity: true});
  }
};
