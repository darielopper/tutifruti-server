const WebSocket = require('ws');
const utils = require('./utils');
const boards = require('./boards');
const {messages, errors} = require('./constants');

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
                if (message === messages.START_BOARD) {
                    const id = utils.uniqueId();
                    boards.addClient(id, client);
                    client.send('BoardId: ' + id);
                    client.send('ClientId: ' + client.id);
                    return;
                }

                if (message.startsWith(messages.JOIN_BOARD)) {
                    const [msg, boardId] = message.split(':');
                    if (!boards.addClient(boardId, client, true)) {
                        client.send(messages.CLOSE_BOARD);
                    }
                    client.send('ClientId: ' + client.id);
                    return;
                }

                if (message.startsWith(messages.PAUSE_GAME)) {
                    const [msg, boardId, clientId] = message.split(':');
                    const playerForPause = boards.pauseGame(boardId, clientId);
                    if (utils.isInvalidClientsResult(playerForPause)) {
                        client.send(!playerForPause ? messages.BOARD_NOT_FOUND: messages.INVALID_OPERATION);
                        return;
                    }
                    for (clientPlayer of playerForPause) {
                        clientPlayer.send(messages.GAME_PAUSED);
                    }
                    return;
                }

                if (message.startsWith(messages.RESUME_GAME)) {
                    const [msg, boardId, clientId] = message.split(':');
                    const playerForResume = boards.resumeGame(boardId, clientId);
                    if (utils.isInvalidClientsResult(playerForResume)) {
                        client.send(!playerForResume ? messages.BOARD_NOT_FOUND : messages.INVALID_OPERATION);
                        return;
                    }
                    for (clientPlayer of playerForResume) {
                        clientPlayer.send(messages.GAME_RESUMED);
                    }
                    return;
                }
            })
        });
    }
}