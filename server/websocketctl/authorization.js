const md5 = require('md5');

const sst = {};
const hashToken = {};

module.exports = {
    makeToken: function(id, code, timestamp, address) {
        const _sessionToken = sst[id];
        const _nextToken = md5(`${id}r${code}v${timestamp}_${address}`);
        if (_sessionToken && _sessionToken != _nextToken) {
            delete hashToken[_sessionToken];
        }
        sst[id] = _nextToken;
        hashToken[_nextToken] = {id, code, timestamp, address};
        return _nextToken
    },
    getDateByToekn: function(token) {
        return hashToken[token] || {};
    },
    
}