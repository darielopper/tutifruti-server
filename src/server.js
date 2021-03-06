const WebSocket = require('ws')
const utils = require('./utils')
const boardController = require('./boards')
const { messages, errors } = require('./constants')
const Logger = require('./log')

let ws
const port = process.env.PORT || 8081

module.exports = {
  start () {
    ws = new WebSocket.Server({
      port
    })

    ws.on('connection', function open (client) {
      Logger.info('Connected 1 client')
      client.send('Connection successfully')

      client.on('message', function incomming (message) {
        Logger.info(message)

        // Start the Board
        if (message === messages.START_BOARD) {
          const id = utils.uniqueId()
          boardController.addClient(id, client)
          client.send(JSON.stringify({ board: id, client: client.id }))
          return
        }

        // Join to a board
        if (message.startsWith(messages.JOIN_BOARD)) {
          const boardId = message.split(':').pop()
          if (!boardController.addClient(boardId, client, true)) {
            client.send(messages.CLOSE_BOARD)
          }
          client.send('ClientId: ' + client.id)
          return
        }

        // Change inactivity timeout to a board
        if (message.startsWith(messages.SET_TIMEOUT)) {
          const timeout = message.split(':').pop().trim()
          if (!client.board || !boardController.setTimeout(client.board, timeout)) {
            client.send(messages.CLOSE_BOARD)
            return
          }
          client.send(messages.SET_TIMEOUT)
          return
        }

        // Get client id
        if (message === messages.CLIENT) {
          if (!client.board) {
            client.send(messages.CLOSE_BOARD)
            return
          }
          client.send('ClientId: ' + client.id)
          return
        }

        // Pause the Game
        if (message === messages.PAUSE_GAME) {
          const playerForPause = boardController.pauseGame(client.board, client.id)
          if (utils.isInvalidClientsResult(playerForPause)) {
            client.send(!playerForPause ? messages.BOARD_NOT_FOUND : messages.INVALID_OPERATION)
            return
          }
          for (const clientPlayer of playerForPause) {
            clientPlayer.send(messages.GAME_PAUSED)
          }
          return
        }

        // Resume the Game
        if (message === messages.RESUME_GAME) {
          const playerForResume = boardController.resumeGame(client.board, client.id)
          if (utils.isInvalidClientsResult(playerForResume)) {
            client.send(!playerForResume ? messages.BOARD_NOT_FOUND : messages.INVALID_OPERATION)
            return
          }
          for (const clientPlayer of playerForResume) {
            clientPlayer.send(messages.GAME_RESUMED)
          }
          return
        }

        // Ban a Client from the Board
        if (message.startsWith(messages.BAN_CLIENT)) {
          const clientId = message.split(':').pop()
          const banUser = boardController.banClient(client.board, clientId)
          if (banUser) {
            [client, banUser].forEach(item => item.send(messages.BAN_CLIENT))
            return
          }
          client.send(!banUser ? messages.BOARD_NOT_FOUND : messages.CLIENT_NOT_FOUND)
          return
        }

        // Leave the Board
        if (message.startsWith(messages.LEAVE_BOARD)) {
          const banUser = boardController.banClient(client.board, client.id)
          if (banUser) {
            const clients = [...boardController.find(client.board).clients]
            clients.push(banUser)
            clients.forEach(item => item.send(messages.BAN_CLIENT + ': ' + client.id))
            return
          }
          client.send(!banUser ? messages.BOARD_NOT_FOUND : messages.CLIENT_NOT_FOUND)
          return
        }

        // Show all clients connected to the same board
        if (message === messages.CLIENTS) {
          const clients = boardController.getClients(client.board)
          if (!clients || !boardController.hasClient(client.board, client.id)) {
            client.send(!clients ? messages.BOARD_NOT_FOUND : messages.CLOSE_BOARD)
            return
          }
          client.send('Clients: ' + clients.join(', '))
          return
        }

        // Change Game Type by a client
        if (message.startsWith(messages.SET_TYPE)) {
          const types = message.split(':').pop()
          const validType = boardController.setType(client.board, types)
          if (validType !== true) {
            client.send(!validType ? messages.BOARD_NOT_FOUND : messages.INVALID_TYPES)
            return
          }
          client.send(messages.SET_TYPE)
          return
        }

        // Get Game Type by a client
        if (message === messages.TYPE) {
          const type = boardController.getType(client.board)
          if (!type) {
            client.send(messages.BOARD_NOT_FOUND)
            return
          }
          client.send(messages.TYPE + ' ' + type)
          return
        }

        // Send the answer for a client
        if (message.startsWith(messages.ANSWER)) {
          const anwser = message.split(':').pop().trim()
          const operationSuccess = boardController.setAnswer(client.board, client.id, anwser)
          if (operationSuccess !== true) {
            switch (operationSuccess) {
              case errors.INVALID_TYPES:
                client.send(messages.INVALID_TYPES)
                break
              case errors.CLIENT_NOT_FOUND:
                client.send(messages.CLOSE_BOARD)
                break
              default:
                client.send(messages.BOARD_NOT_FOUND)
                break
            }
            return
          }
          client.send(messages.ANSWER)
          return
        }

        // Desclassify the answer of some clients
        if (message.startsWith(messages.DISCLASSIFY)) {
          const messageParts = message.split(':')
          const [type, clientsToDesclassify] = messageParts.pop().split('|')
          const desclassifyResult = boardController.disclassify(client.board, client.id, type, clientsToDesclassify)
          if (desclassifyResult !== true) {
            const errorMessages = {
              [false]: messages.BOARD_NOT_FOUND,
              [errors.CLIENT_NOT_FOUND]: messages.CLIENT_NOT_FOUND,
              [errors.NOT_ANSWERS_YET]: messages.NOT_ANSWERS_YET,
              [errors.INVALID_TYPES]: messages.INVALID_TYPES,
              [errors.NOT_CLIENTS_PROVIDED]: messages.NOT_CLIENTS_PROVIDED,
              [errors.VOTED_BEFORE]: messages.VOTED_BEFORE
            }
            client.send(errorMessages[desclassifyResult])
            return
          }
          client.send(messages.DISCLASSIFY + ':' + JSON.stringify(boardController.getLastClassify(client.board, client.id)))
          return
        }

        // Set the mode of classification for a board
        if (message.startsWith(messages.SET_MODE)) {
          const modeId = message.split(':').pop().trim()
          const operationResult = boardController.setMode(client.board, client.id, modeId)
          if (operationResult !== true) {
            client.send(!operationResult ? messages.CLOSE_BOARD : messages.INVALID_MODE)
            return
          }
          client.send(messages.SET_MODE)
          return
        }

        // Get the mode of classification for a board
        if (message === messages.MODE) {
          const mode = boardController.getMode(client.board)
          if (!mode) {
            client.send(messages.CLOSE_BOARD)
            return
          }
          const board = boardController.find(client.board)
          client.send(messages.MODE + ':' + board.mode)
          return
        }

        client.send(message + ': ' + messages.COMMAND_INCORRECT)
      })
    })
  },

  stop () {
    ws.close()
  },

  port () {
    return port
  }
}
