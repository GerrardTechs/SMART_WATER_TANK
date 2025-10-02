const { EventEmitter } = require('events');
const bus = new EventEmitter();

// tingkatkan batas listener biar gak warning kalau banyak client SSE
bus.setMaxListeners(0);

module.exports = bus;
