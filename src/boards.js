const utils = require('./utils');
const {messages, errors} = require('./constants');
let boards = new Map();
const inactivityTimeout = process.env.TIMEOUT || 60;
const pauseTimeout = process.env.PAUSE_TIMEOUT || 20;
const maxPlayers = process.env.MAX_PLAYER || 2;

module.exports = {
    add(id) {
        boards.set(id, { id, time: new Date(), clients: [] });
    },

    addClient(id, client, restrict = false) {
        if (!boards.has(id)) {
            if (restrict) {
                return false;
            }
            this.add(id);
        }
        const board = boards.get(id);
        if (board.clients.length + 1 > maxPlayers) {
            return false;
        }
        client.id = utils.clientId();
        board.clients.push(client);
        updateTime(board);

        return true;
    },

    banClient(id, clientId) {
        if (!boards.has(id)) {
            return false;
        }
        const board = board.get(id);
        const clients = board.clients.filter(boardClient => boardClient.id !== clientId);
        const foundClient = clients.length < board.clients.length;
        if (!foundClient) {
            return errors.CLIENT_NOT_FOUND;
        }
        const clientToBan = board.clients.find(client => client.id === clientId)
        board.clients = clients;
        return clientToBan;
    },

    pauseGame(id, clientId) {
        // @TODO Add who pause the game
        if (!boards.has(id)) {
            return false;
        }
        const board = boards.get(id);
        if (board.paused) {
            return errors.INVALID_OPERATION;
        }
        if (!board.clients.find(client => client.id === clientId)) {
            return false;
        }
        updateTime(board);
        board.paused = true;
        return board.clients || false;
    },

    resumeGame(id, clientId) {
        // @TODO Add who resume the game
        if (!boards.has(id)) {
            return false;
        }
        const board = boards.get(id);
        if (!board.paused) {
            return errors.INVALID_OPERATION;
        }
        if (!board.clients.find(client => client.id === clientId)) {
            return false;
        }
        updateTime(board);
        board.paused = false;
        return board.clients || false;
    }
};

const updateTime = (board) => board.time = new Date();

const automaticClean = () => {
    setInterval(() => {
        // Obtain the boards with an inactivity bigger than the time stablished on TIMEOUT var
        // @TODO And the game is not paused
        const toRemove = [];
        for (var entry of boards.entries()) {
            const timeout = entry[1].paused ? pauseTimeout : inactivityTimeout;
            if (utils.diffInSeconds(entry[1].time, new Date()) > timeout) {
                toRemove.push(entry[1]);
            }
        }
        /*const toRemove = boards.filter(board => {
            const timeout = board.paused ? pauseTimeout : inactivityTimeout;
            return utils.diffInSeconds(board.time, new Date()) > timeout;
        })*/
        toRemove.forEach(board => {
            if (board.paused) {
                board.paused = false;
                updateTime(board);
                board.clients.forEach(client => client.send(messages.GAME_RESUMED));
                return;
            }
            board.clients.forEach(client => client.send('END CONNECTION FOR INACTIVITY'))
            boards.delete(board.id);
        })
    }, 1000);
}

automaticClean();