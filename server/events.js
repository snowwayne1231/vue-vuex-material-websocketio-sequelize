const enums = require('../src/enum');
const models = require('./models');
const hash = {};
const eventRecordDomesticMap = {};
let eventRecords = [];
let memoBroadcast;

function init(memo) {
    memoBroadcast = memo;
    return models.Event.findAll({attributes: {exclude: ['createdAt', 'updatedAt']}, where: {}}).then(events => {
        events.map(e => {
            let _json = e.toJSON();
            hash[_json.staticKey] = _json;
        });
        const promise1 = models.RecordEvent.findAll({attributes: ['detail', 'timestamp'], limit: 32, order: [ ['id', 'DESC'] ]}).then(revts => {
            const notis = revts.map(e => [e.timestamp, e.detail]);
            eventRecords = notis;
            return true;
        });
        const promise2 = models.RecordEventDomestic.findAll({attributes: ['detail', 'timestamp', 'countryId'], limit: 200, order: [ ['id', 'DESC'] ]}).then(revts => {
            revts.map(e => {
                if (eventRecordDomesticMap[e.countryId]) {
                    eventRecordDomesticMap[e.countryId].push([e.timestamp, e.detail]);
                } else {
                    eventRecordDomesticMap[e.countryId] = [[e.timestamp, e.detail]];
                }
            });
            return true;
        });
        return Promise.all([promise1, promise2]);
    });
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
    const countryId = data.countryId || 0;
    if (skey == enums.EVENT_DOMESTIC) {
        await models.RecordEventDomestic.create({
            round,
            eventId,
            countryId,
            detail,
            timestamp,
        });
    } else {
        await models.RecordEvent.create({
            round,
            eventId,
            detail,
            timestamp,
        });
        const payload = [timestamp, detail];
        eventRecords.unshift(payload);
        if (eventRecords.length > 32) {
            eventRecords.splice(-1, 1);
        }
        memoBroadcast(enums.MESSAGE, {act: enums.ACT_NOTIFICATION, payload});
    }
    return payload;
}


module.exports = {
    init,
    getInfo,
    getId,
    broadcastInfo,
    pushRecord,
    getRecords,
}