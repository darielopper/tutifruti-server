const WebSocket = require('ws');
const utils = require('./utils');

let ws;
const port = process.env.PORT || 8081

module.exports = {
    start() {
        ws = new WebSocket.Server({
            port
        });

        ws.on('connection', onConnection);
    }
}

const onConnection = (client) => {
    console.log('Connected 1 client');
    client.send(utils.uniqueId());
}