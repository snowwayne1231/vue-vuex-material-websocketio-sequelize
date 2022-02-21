function arrayBufferToJSON(buffer) {
    let result = null;
    try {
        let _str = '';
        let _uint8 = new Uint8Array(buffer);
        let _i = 0;
        let _len = _uint8.length;
        let c, c2, c3;
        while (_i < _len) {
            let _decoded = '';
            c = _uint8[_i++];
            switch (c >> 4) {
                case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                    _decoded = String.fromCharCode(c);
                break;
                case 12: case 13:
                    c2 = _uint8[_i++];
                    _decoded = String.fromCharCode(((c & 0x1F) << 6) | (c2 & 0x3F));
                    break;
                case 14:
                    c2 = _uint8[_i++];
                    c3 = _uint8[_i++];
                    _decoded = String.fromCharCode(((c & 0x0F) << 12) | ((c2 & 0x3F) << 6) | ((c3 & 0x3F) << 0));
                default:
            }
            _str += _decoded;
        }
        result = JSON.parse(_str);
        
    } catch (err) {
        clog('arrayBufferToJSON failed: ', err);
    }
    return result;
}


module.exports = {
    arrayBufferToJSON,
}