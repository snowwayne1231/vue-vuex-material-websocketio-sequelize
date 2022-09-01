const models = require('./models');
const enums = require('../src/enum');
const sellerMap = {
    '劉備': 0,
    '趙雲': 0,
    '諸葛亮': 0,
    '曹操': 0,
    '老子': 0,
    '魯智深': 0,
    '許攸': 0,
    '陸遜': 0,
    '韓信': 0,
    '劉邦': 0,
    '魏延': 0,
    '張良': 0,
    '貂蟬': 0,
    '黃蓋': 0,
    '周瑜': 0,
    '龐統': 0,
}
const items = [
    {name: '三顧茅廬', seller: '劉備', price: 1500},
    {name: '七進七出', seller: '趙雲', price: 1250},
    {name: '七擒七縱', seller: '諸葛亮', price: 2750},
    {name: '五穀豐登', seller: '曹操', price: 1450},
    {name: '無中生有', seller: '老子', price: 3500},
    {name: '順手牽羊', seller: '魯智深', price: 1500},
    {name: '兵糧寸斷', seller: '許攸', price: 1450},
    {name: '火燒連營', seller: '陸遜', price: 3000},
    {name: '趁火打劫', seller: '韓信', price: 1500},
    {name: '調虎離山', seller: '韓信', price: 1000},
    {name: '聲東擊西', seller: '劉邦', price: 1500},
    {name: '子午谷奇襲', seller: '魏延', price: 2500},
    {name: '暗度陳倉', seller: '張良', price: 4500},
    {name: '石兵八陣', seller: '諸葛亮', price: 6000},
    {name: '空城計', seller: '諸葛亮', price: 3000},
    {name: '美人計', seller: '貂蟬', price: 3000},
    {name: '苦肉計', seller: '黃蓋', price: 4500},
    {name: '反間計', seller: '周瑜', price: 4500},
    {name: '連環計', seller: '龐統', price: 2500},
]

const setting = {
    hashAdventureId: {},
    userSockets: [],
    maxMapId: 100
}

function init(userSockets, mapLength = 100, itemMap = {}) {
    setting.userSockets = userSockets
    setting.maxMapId = mapLength
    const reversIdMap = {}
    itemMap && Object.values(itemMap).map(item => {
        reversIdMap[item.name] = item.id;
    });
    items.map(item => {
        item.itemId = reversIdMap[item.name] || 0;
    })
    return load().then(e => {
        return sellerMap
    })
}

async function reset() {
    const keys = Object.keys(sellerMap);
    for(let i =0; i< keys.length; i++) {
        await save(keys[i], 0);
    }
    return true
}

function getSellerMap() {
    return sellerMap
}

function getItems() {
    return items
}

async function search(mapId) {
    let success = Math.floor(Math.random() * 100) <= 15
    let name = ''
    if (success && mapId <= setting.maxMapId) {
        const _keys = Object.keys(sellerMap);
        const names = _keys.filter(key => sellerMap[key] == 0);
        if (names.length == 0) {
            success = false
        } else {
            const _randidx = Math.floor(Math.random() * names.length);
            name = names[_randidx]
            await save(name, mapId)
        }
    } else {
        success = false
    }
    return {success, name}
}

async function load() {
    const advs = await models.Adventure.findAll();
    advs.map(adv => {
        const name = adv.name;
        const _ary = name.split('-');
        if (_ary.length == 2) {
            const sellerName = _ary[0].trim();
            const sellerMapId = parseInt(_ary[1]);
            if (sellerMapId > 0 && sellerMap.hasOwnProperty(sellerName)) {
                sellerMap[sellerName] = sellerMapId
                setting.hashAdventureId[sellerName] = adv.id
            }
        }
    });
    return true
}

async function save(name = '', value = 0) {
    if (sellerMap.hasOwnProperty(name)) {
        const id = setting.hashAdventureId[name];
        const saveName = `${name}-${value}`;
        sellerMap[name] = value
        if (id && id > 0) {
            await models.Adventure.update({
                name: saveName,
            }, {where: {id}});
        } else {
            await models.Adventure.create({
                name: saveName
            });
        }
        return true
    } else {
        console.log('[Business] save failed: ', name, value)
    }
    return false
}

async function buy(itemName, userinfo) {
    const item = items.find(e => e.name == itemName);
    if (item) {
        const seller = item.seller || 'none'
        const smapid = sellerMap[seller]
        if (smapid == userinfo.mapNowId) {
            const pkItem = await models.PacketItem.create({
                userId: userinfo.id,
                itemId: item.itemId,
                timestampDeadline: null,
                timestampUse: null,
                userTarget: 'none',
                status: 1,
            });
            const result = pkItem.toJSON();
            result.price = item.price;
            return result;
        }
    }
    return false
}


module.exports = {
    init,
    reset,
    search,
    buy,
    getSellerMap,
    getItems,
}