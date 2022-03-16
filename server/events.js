const enums = require('../src/enum');
const models = require('./models');
const hash = {};
let eventRecords = [];
let memoBroadcast;

function init(memo) {
    models.Event.findAll({attributes: {exclude: ['createdAt', 'updatedAt']}, where: {}}).then(events => {
        events.map(e => {
            let _json = e.toJSON();
            hash[_json.staticKey] = _json;
        });
        return true
    });
    memoBroadcast = memo;
}

function getInfo(key, data = {}) {
    const event = hash[key];
    if (event) {
        let detail = event.detail.replace(/\{(.+?)\}/gi, function(m, m1) {
            return data[m1] || '?';
        });
        return detail;
    }
    return null
}

function getId(key) {
    return hash[key] ? hash[key].id : 0;
}

function setRecords(records) {
    eventRecords = records;
}

function pushRecord(record) {
    eventRecords.push(record);
}

function getRecords() {
    return eventRecords;
}

async function broadcastInfo(skey, data = {}) {
    const timestamp = new Date();
    const round = data.round || 0;
    const eventId = getId(skey);
    const detail = getInfo(skey, data);
    await models.RecordEvent.create({
        round,
        eventId,
        detail,
        timestamp,
    });
    const payload = [timestamp, detail];
    eventRecords.unshift(payload);
    if (eventRecords.length > 20) {
        eventRecords.splice(-1, 1);
    }
    memoBroadcast(enums.MESSAGE, {act: enums.ACT_NOTIFICATION, payload});
    return payload;
}


module.exports = {
    init,
    getInfo,
    getId,
    broadcastInfo,
    setRecords,
    pushRecord,
    getRecords,
}