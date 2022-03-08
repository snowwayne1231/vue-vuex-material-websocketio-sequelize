const enums = require('../src/enum');
const models = require('./models');

const hash = {}

function init() {
    models.Event.findAll({attributes: {exclude: ['createdAt', 'updatedAt']}, where: {}}).then(events => {
        events.map(e => {
            let _json = e.toJSON();
            hash[_json.staticKey] = _json;
        });
        return true
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


module.exports = {
    init,
    getInfo,
    getId,
}