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
                    eventRecordDomesticMap[e.countryId].length < 32 && eventRecordDomesticMap[e.countryId].push([e.timestamp, e.detail]);
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
    let detail = event.detail;
    if (event) {
        
    } else if (typeof key == 'string') {
        detail = key;
    }
    return detail.replace(/\{(.+?)\}/gi, function(m, m1) {
        return data[m1] || '?';
    });
}

function getId(key) {
    return hash[key] ? hash[key].id : 0;
}

function getRecords(countryId = 0) {
    return countryId == 0 ? eventRecords : (eventRecordDomesticMap[countryId] || []);
}

async function broadcastInfo(skey, data = {}) {
    const timestamp = new Date();
    const round = data.round || 0;
    const eventId = getId(skey);
    const detail = getInfo(skey, data);
    const countryId = data.countryId || 0;
    const payload = [timestamp, detail];
    switch(skey) {
        case enums.EVENT_OCCUPATION:
        case enums.EVENT_DOMESTIC:
            if (countryId) {
                await models.RecordEventDomestic.create({
                    round,
                    eventId,
                    countryId,
                    detail,
                    timestamp,
                });
                if (eventRecordDomesticMap[countryId]) {
                    eventRecordDomesticMap[countryId].unshift(payload);
                    if (eventRecordDomesticMap[countryId].length > 32) {
                        eventRecordDomesticMap[countryId].splice(-1, 1);
                    }
                } else {
                    eventRecordDomesticMap[countryId] = [payload];
                }
                memoBroadcast(enums.MESSAGE, {act: enums.ACT_NOTIFICATION_DOMESTIC, payload}, countryId);
            } else {
                console.log('[Event Error] broadcastInfo not has countryId.')
            }
            break
        default:
            await models.RecordEvent.create({
                round,
                eventId,
                detail,
                timestamp,
            });
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
    getRecords,
}