const utils = require('./utils')
const { messages, errors, types: GameTypes, gameLetters, classifyMode } = require('./constants')
const boards = new Map()
const inactivityTimeout = process.env.TIMEOUT || (process.env.NODE_ENV === 'test' ? 2000 : 60)
const pauseTimeout = process.env.PAUSE_TIMEOUT || (process.env.NODE_ENV === 'test' ? 5 : 40)
const maxPlayers = process.env.MAX_PLAYER || 2
const pointsForAnswer = process.env.POINTS_FOR_ANSWER || 10
const mode = process.env.GAME_MODE || classifyMode.democratic
const selectedType = process.env.SELECTED_TYPE || 'simple'

module.exports = {
  add (id) {
    boards.set(id, {
      id,
      letter: 'A',
      letterIndex: 0,
      time: new Date(),
      timeout: inactivityTimeout,
      clients: [],
      answers: new Map(),
      mode
    })
  },

  addClient (id, client, restrict = false) {
    if (!boards.has(id)) {
      if (restrict) {
        return false
      }
      this.add(id)
    }
    const board = boards.get(id)
    if (board.clients.length + 1 > maxPlayers) {
      return false
    }
    client.id = utils.clientId()
    client.board = id
    board.clients.push(client)
    updateTime(board)

    return true
  },

  setTimeout (id, timeout) {
    if (!boards.has(id)) {
      return false
    }
    const board = boards.get(id)
    board.timeout = timeout
    updateTime(board)
    return true
  },

  setMode (boardId, clientId, modeId) {
    if (![classifyMode.democratic, classifyMode.strict].includes(Number(modeId))) {
      return errors.INVALID_MODE
    }
    if (!boards.has(boardId) || !this.getClient(boards.get(boardId), clientId)) {
      return false
    }
    boards.get(boardId).mode = modeId
    return true
  },

  getMode (boardId) {
    if (!boards.has(boardId)) {
      return false
    }
    return boards.get(boardId).mode
  },

  getClients (id) {
    if (!boards.has(id)) {
      return false
    }
    const board = boards.get(id)
    return board.clients.map(item => item.id)
  },

  getClient (board, clientId) {
    return board ? board.clients.find(client => client.id === clientId) : null
  },

  setAnswer (boardId, clientId, answer) {
    if (!boards.has(boardId)) {
      return false
    }
    const board = boards.get(boardId)
    const client = this.getClient(board, clientId)
    if (!client) {
      return errors.CLIENT_NOT_FOUND
    }
    // <answer_types>|<answer_values>
    const typeData = answer.split('|')
    const answerTypes = typeData[0].split(',')
    const answerValues = typeData[1].split(',')
    if (typeData.length < 2 ||
            (typeData.length === 2 && !validTypes(typeData[0])) ||
            (typeData.length === 2 && typeData[1].split(',').length !== typeData[0].split(',').length)
    ) {
      return errors.INVALID_TYPES
    }
    const letter = board.letter
    if (!board.answers.has(letter)) {
      board.answers.set(letter, new Map())
    }
    const answersData = board.answers.get(letter)
    const answerObj = {}
    let i = 0
    for (const key of answerTypes) {
      // Start with all points until the clients start disclasiffying
      answerObj[key] = { value: answerValues[i++], points: pointsForAnswer * (board.clients.length - 1), voted: [] }
    }
    answersData.set(clientId, answerObj)
    // If all client get their answers
    if (answersData.keys().length === board.clients.length) {
      this.updateLetter(board)
      return true
    }

    return true
  },

  /**
   *
   * @param boardId
   * @param clientId
   * @param type Which type of question will be disclassify (name, country, animal, plant, etc) based on game type selected
   * @param wrongs Client Ids that whe want to disclassify in this format: id1,id2,id3
   * @returns {boolean|number}
   */
  disclassify (boardId, clientId, type, wrongs) {
    if (!boards.has(boardId)) {
      return false
    }
    const board = boards.get(boardId)
    const client = this.getClient(board, clientId)
    if (!client) {
      return errors.CLIENT_NOT_FOUND
    }
    if (!validTypes(type)) {
      return errors.INVALID_TYPES
    }
    if (!wrongs) {
      return errors.NOT_CLIENTS_PROVIDED
    }
    const wrongClients = wrongs.split(',')
    for (const client of wrongClients) {
      if (!this.getClient(board, client)) {
        return errors.CLIENT_NOT_FOUND
      }
    }
    let answers
    for (const client of wrongClients) {
      if (wrongClients === clientId) continue
      answers = [...board.answers.values()].pop()
      if (!answers) {
        return errors.NOT_ANSWERS_YET
      }
      const answerData = answers.get(client)
      if (answerData[type].voted.includes(clientId)) {
        return errors.VOTED_BEFORE
      }
      answerData[type].points -= pointsForAnswer
      answerData[type].voted.push(clientId)
    }
    return true
  },

  getLastClassify (boardId, clientId) {
    if (!boards.has(boardId) || !this.getClient(boards.get(boardId), clientId)) {
      return false
    }
    const board = boards.get(boardId)
    const answers = [...board.answers.values()].pop()
    const clients = [...answers.keys()]
    const lastAnswer = [...answers.values()]
    return lastAnswer.map((answer, index) => ({ client: clients[index], points: Object.values(answer).reduce((total, item) => (total += item.points), 0) }))
  },

  updateLetter (board) {
    if (board.letterIndex < gameLetters.length) {
      board.letter = gameLetters[++board.letterIndex]
    }
    // TODO Game Over show how wins
  },

  setType (boardId, type) {
    if (!boards.has(boardId)) {
      return false
    }
    if (!validTypes(type)) {
      return errors.INVALID_TYPES
    }
    boards.get(boardId).type = type
    return true
  },

  getType (boardId) {
    if (!boards.has(boardId)) {
      return false
    }
    return boards.get(boardId).type
  },

  hasClient (boardId, clientId) {
    if (!boards.has(boardId)) {
      return false
    }
    const board = boards.get(boardId)
    return board.clients.some(client => client.id === clientId)
  },

  find (id) {
    return boards.has(id) ? boards.get(id) : false
  },

  banClient (id, clientId) {
    if (!boards.has(id)) {
      return false
    }
    const board = boards.get(id)
    const clients = board.clients.filter(boardClient => boardClient.id !== clientId)
    const foundClient = clients.length < board.clients.length
    if (!foundClient) {
      return errors.CLIENT_NOT_FOUND
    }
    const clientToBan = board.clients.find(client => client.id === clientId)
    board.clients = clients
    return clientToBan
  },

  pauseGame (id, clientId) {
    // @TODO Add who pause the game
    if (!boards.has(id)) {
      return false
    }
    const board = boards.get(id)
    if (board.paused) {
      return errors.INVALID_OPERATION
    }
    if (!board.clients.find(client => client.id === clientId)) {
      return false
    }
    updateTime(board)
    board.paused = true
    return board.clients || false
  },

  resumeGame (id, clientId) {
    // @TODO Add who resume the game
    if (!boards.has(id)) {
      return false
    }
    const board = boards.get(id)
    if (!board.paused) {
      return errors.INVALID_OPERATION
    }
    if (!board.clients.find(client => client.id === clientId)) {
      return false
    }
    updateTime(board)
    board.paused = false
    return board.clients || false
  }
}

const validTypes = (types) => types.split(',').every(type => GameTypes[selectedType].split(',').includes(type))

const updateTime = (board) => (board.time = new Date())

const automaticClean = () => {
  setInterval(() => {
    // Obtain the boards with an inactivity bigger than the time stablished on TIMEOUT var
    // @TODO And the game is not paused
    const toRemove = []
    for (var entry of boards.entries()) {
      const timeout = entry[1].paused ? pauseTimeout : entry[1].timeout
      if (utils.diffInSeconds(entry[1].time, new Date()) > timeout) {
        toRemove.push(entry[1])
      }
    }
    toRemove.forEach(board => {
      if (board.paused) {
        board.paused = false
        updateTime(board)
        board.clients.forEach(client => client.send(messages.GAME_RESUMED))
        return
      }
      board.clients.forEach(client => client.send(messages.INACTIVITY))
      boards.delete(board.id)
    })
  }, 1000)
}

automaticClean()
