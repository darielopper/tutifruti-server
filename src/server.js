const WebSocket = require('ws');
const utils = require('./utils');
const boards = require('./boards');
const constants = require('./constants');

let ws;
const port = process.env.PORT || 8081

module.exports = {
    start() {
        ws = new WebSocket.Server({
            port
        });

        ws.on('connection', function open(client) {
            console.log('Connected 1 client');
            client.send('Connection successfully');
            console.log('Send data');

            client.on('message', function incomming(message) {
                console.log(message);
                if (message === constants.START_BOARD) {
                    const id = utils.uniqueId();
                    boards.addClient(id, client)
                    client.send(id)
                    return;
                }

                if (message.startsWith(constants.JOIN_BOARD)) {
                    const [msg, boardId] = message.split(':')
                    if (!boards.addClient(boardId, client)) {
                        client.send(constants.CLOSE_BOARD);
                    }
                }
            })
        });
    }
}