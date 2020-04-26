const utils = require('./utils');
const {messages, errors} = require('./constants');
let boards = [];
const inactivityTimeout = process.env.TIMEOUT || 60;
const pauseTimeout = process.env.PAUSE_TIMEOUT || 20;
const maxPlayers = process.env.MAX_PLAYER || 2;

module.exports = {
    add(id) {
        boards.push({ id, time: new Date(), clients: [] });
    },

    addClient(id, client, restrict = false) {
        let board = boards.find(board => board.id === id);
        if (!board) {
            if (restrict) {
                return false;
            }
            this.add(id);
            board = boards.slice(-1).pop();
        }
        if (board.clients.length + 1 > maxPlayers) {
            return false;
        }
        client.id = utils.clientId();
        board.clients.push(client);
        updateTime(board);

        return true;
    },

    banClient(id, clientId) {
        const board = this.find(id);
        if (!board) {
            return false;
        }
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
        board = this.find(id);
        if (!board) {
            return false;
        }
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
        board = this.find(id);
        if (!board) {
            return false;
        }
        if (!board.paused) {
            return errors.INVALID_OPERATION;
        }
        if (!board.clients.find(client => client.id === clientId)) {
            return false;
        }
        updateTime(board);
        board.paused = false;
        return board.clients || false;
    },

    find(id) {
        return boards.find(board => board.id === id);
    }
};

const removeBoard = (id) => {
    boards = boards.filter(board => board.id !== id);
}

const updateTime = (board) => board.time = new Date();

const automaticClean = () => {
    setInterval(() => {
        // Obtain the boards with an inactivity bigger than the time stablished on TIMEOUT var
        // @TODO And the game is not paused
        const toRemove = boards.filter(board => {
            const timeout = board.paused ? pauseTimeout : inactivityTimeout;
            return utils.diffInSeconds(board.time, new Date()) > timeout;
        })
        toRemove.forEach(board => {
            if (board.paused) {
                board.paused = false;
                updateTime(board);
                board.clients.forEach(client => client.send(messages.GAME_RESUMED));
                return;
            }
            board.clients.forEach(client => client.send('END CONNECTION FOR INACTIVITY'))
            removeBoard(board.id);
        })
    }, 1000);
}

automaticClean();