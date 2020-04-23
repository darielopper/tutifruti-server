const utils = require('./utils');
let boards = []
const inactivityTimeout = process.env.TIMEOUT || 5

module.exports = {
    add(id) {
        boards.push({ id, time: new Date(), clients: [] })
    },

    addClient(id, client) {
        let board = boards.find(board => board.id === id);
        if (!board) {
            this.add(id)
            board = boards.slice(-1).pop()
        }
        board.clients.push(client)
        board.time = new Date();
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