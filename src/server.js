const WebSocket = require('ws');
const utils = require('./utils');
const boardController = require('./boards');
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

                // Start the Board
                if (message === messages.START_BOARD) {
                    const id = utils.uniqueId();
                    boardController.addClient(id, client);
                    client.send('BoardId: ' + id);
                    client.send('ClientId: ' + client.id);
                    return;
                }

                // Join to a board
                if (message.startsWith(messages.JOIN_BOARD)) {
                    const [msg, boardId] = message.split(':');
                    if (!boardController.addClient(boardId, client, true)) {
                        client.send(messages.CLOSE_BOARD);
                    }
                    client.send('ClientId: ' + client.id);
                    return;
                }

                // Pause the Game
                if (message.startsWith(messages.PAUSE_GAME)) {
                    const playerForPause = boardController.pauseGame(client.board, client.id);
                    if (utils.isInvalidClientsResult(playerForPause)) {
                        client.send(!playerForPause ? messages.BOARD_NOT_FOUND: messages.INVALID_OPERATION);
                        return;
                    }
                    for (clientPlayer of playerForPause) {
                        clientPlayer.send(messages.GAME_PAUSED);
                    }
                    return;
                }

                // Resume the Game
                if (message.startsWith(messages.RESUME_GAME)) {
                    const playerForResume = boardController.resumeGame(client.board, client.id);
                    if (utils.isInvalidClientsResult(playerForResume)) {
                        client.send(!playerForResume ? messages.BOARD_NOT_FOUND : messages.INVALID_OPERATION);
                        return;
                    }
                    for (clientPlayer of playerForResume) {
                        clientPlayer.send(messages.GAME_RESUMED);
                    }
                    return;
                }

                // Ban a Client from the Board
                if (message.startsWith(messages.BAN_CLIENT)) {
                    const [msg, clientId] = message.split(':');
                    const banUser = boardController.banClient(client.board, clientId)
                    if (banUser) {
                        [client, banUser].forEach(item => item.send(messages.BAN_CLIENT));
                        return;
                    }
                    client.send(!banUser ? messages.BOARD_NOT_FOUND : messages.CLIENT_NOT_FOUND);
                    return;
                }

                // Leave the Board
                if (message.startsWith(messages.LEAVE_BOARD)) {
                    const banUser = boardController.banClient(client.board, client.id)
                    if (banUser) {
                        const clients = [...boardController.find(client.board).clients];
                        clients.push(banUser);
                        clients.forEach(item => item.send(messages.BAN_CLIENT + ': ' + client.id));
                        return;
                    }
                    client.send(!banUser ? messages.BOARD_NOT_FOUND : messages.CLIENT_NOT_FOUND);
                    return;
                }

                // Show all clients connected to the same board
                if (message.startsWith(messages.CLIENTS)) {
                    const clients = boardController.getClients(client.board);
                    if (!clients || !boardController.hasClient(client.board, client.id)) {
                        client.send(!clients ? messages.BOARD_NOT_FOUND: messages.CLOSE_BOARD);
                        return;
                    }
                    client.send('Clients: ' + clients.join(', '));
                    return;
                }

                if (message.startsWith(messages.SET_TYPE)) {
                    const [msg, boardId, types] = message.split(':');
                    const validType = boardController.setType(boardId, types);
                    if (validType !== true) {
                        client.send(!validType ? messages.BOARD_NOT_FOUND : messages.INVALID_TYPES);
                        return;
                    }
                    client.send(messages.SET_TYPE);
                    return;
                }

                if (message.startsWith(messages.ANSWER)) {
                    const [msg, anwser] = message.split(':');
                    const answerParts = anwser.split('|');
                    const validType = boardController.setType(client.board, answerParts[messages.TYPE]);
                    if (validType !== true) {
                        client.send(!validType ? messages.BOARD_NOT_FOUND : messages.INVALID_TYPES);
                        return;
                    }
                    client.send(messages.SET_TYPE);
                    return;
                }

                client.send(message + ': ' + messages.COMMAND_INCORRECT);
            })
        });
    }
}