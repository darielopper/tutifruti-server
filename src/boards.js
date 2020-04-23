const utils = require('./utils');
let boards = []
const inactivityTimeout = process.env.TIMEOUT || 30
const maxPlayers = process.env.MAX_PLAYER || 1

module.exports = {
    add(id) {
        boards.push({ id, time: new Date(), clients: [] })
    },

    addClient(id, client, restrict = false) {
        let board = boards.find(board => board.id === id);
        if (!board) {
            if (restrict) {
                return false;
            }
            this.add(id)
            board = boards.slice(-1).pop()
        }
        if (board.clients.length + 1 > maxPlayers) {
            return false;
        }
        board.clients.push(client)
        board.time = new Date();

        return true;
    },

    find(id) {
        return boards.find(board => board.id === id);
    }
};

const removeBoard = (id) => {
    boards = boards.filter(board => board.id !== id);
}

const automaticClean = () => {
    setInterval(() => {
        // Obtain the boards with an inactivity bigger than the time stablished on TIMEOUT var
        // @TODO And the game is not paused
        const toRemove = boards.filter(board => utils.diffInSeconds(board.time, new Date()) > inactivityTimeout)
        toRemove.forEach(board => {
            board.clients.forEach(client => client.send('END CONNECTION FOR INACTIVITY'))
            removeBoard(board.id);
        })
    }, 1000);
}

automaticClean();