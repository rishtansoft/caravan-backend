const { Server } = require('socket.io')
const server = require('./http')

const io = new Server(server, {
    cors: {
        origin: '*',
        method: ['*']
    }
});

module.exports = io;
