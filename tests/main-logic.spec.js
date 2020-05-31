const expect = require('chai').expect
const server = require('../src/server')
const {types, answers, classifyMode} = require('../src/constants')
const webSocket = require('ws')
let ws, ws2, ws3

describe('Test to check the main logic of the game', () => {
    before(() => {
        server.start()
        const uri = `ws://localhost:${server.port()}`
        ws = new webSocket(uri)
        ws2 = new webSocket(uri)
        ws3 = new webSocket(uri)
    })

    after(() => {
        if (ws && ws.readyState === ws.OPEN) {
            ws.close()
        }
        if (ws2 && ws.readyState === ws2.OPEN) {
            ws2.close()
        }
        if (ws3 && ws.readyState === ws3.OPEN) {
            ws3.close()
        }
        server.stop()
    })

    it('Check server start successfully', (done) => {
        ws.once('message', (message) => expect(message).to.equal('Connection successfully'))
        done()
    })

    it('Show error if client send his answer and doesn\'t join to a board', (done) => {
        ws.board = null
        const listener = (message) => {
            expect(message).to.contain('BOARD_NOT_FOUND')
            ws.off('message', listener)
            done()
        }
        ws.on('message', listener)
        ws.send('$ANSWER:' + types.simple + '|' + answers.simple)
    })

    it('Client can change game type successfully', (done) => {
        const messages = []
        const listener = (message) => {
            messages.push(message)
            if (messages.length === 1) {
                const jsonData = JSON.parse(message)
                expect(!!jsonData).to.true
                ws.send('$SET_TYPE:' + types.simple)
                return
            }
            if (messages.length === 2) {
                expect(message).to.contain('SET_TYPE')
                ws.send('$TYPE')
                return
            }
            expect(message).to.contain('TYPE')
            expect(message.split(' ').pop()).to.eq(types.simple)
            ws.off('message', listener)
            done()
        }
        ws.on('message', listener)
        ws.send('$START_BOARD')
    })

    it('Client can send his answer successfully', (done) => {
        const messages = []
        const listener = (message) => {
            messages.push(message)
            if (messages.length === 1) {
                const jsonData = JSON.parse(message)
                expect(!!jsonData).to.true
                ws.send('$ANSWER:alfa|beta')
                return
            }
            if (messages.length === 2) {
                expect(message).to.contain('INVALID_TYPES')
                ws.send('$ANSWER:' + types.simple + '|' + answers.simple)
                return
            }
            expect(message).to.equal('$ANSWER')
            ws.off('message', listener)
            done()
        }
        ws.on('message', listener)
        ws.send('$START_BOARD')
    })

    it('Client can change the classification mode', (done) => {
        const messages = []
        const listener = (message) => {
            messages.push(message)
            if (messages.length === 1) {
                const jsonData = JSON.parse(message)
                expect(!!jsonData).to.true
                ws.send('$MODE')
                return
            }
            if (messages.length === 2) {
                expect(message).to.equal('$MODE:' + classifyMode.democratic)
                ws.send('$SET_MODE:' + (classifyMode * 2))
                return
            }
            if (messages.length === 3) {
                expect(message).to.contain('INVALID_MODE')
                ws.send('$SET_MODE:' + classifyMode.strict)
                return
            }
            if (messages.length === 4) {
                expect(message).to.contain('SET_MODE')
                ws.send('$MODE')
                return
            }
            expect(message).to.equal('$MODE:' + classifyMode.strict)
            ws.off('message', listener)
            done()
        }
        ws.on('message', listener)
        ws.send('$START_BOARD')
    })

    it('Client can disclassify another', (done) => {
        const messages = []
        const messages2 = []
        let firstClient
        const listener = (message) => {
            messages.push(message)
            if (messages.length === 1) {
                const jsonData = JSON.parse(message)
                expect(!!jsonData).to.true
                firstClient = jsonData.client
                ws2.send('$JOIN_BOARD:' + jsonData.board)
                return
            }
            expect(message).to.equal('$ANSWER')
            ws2.send('$DISCLASSIFY:name|' + firstClient)
            ws.off('message', listener)
        }
        const listener2 = (message) => {
            messages2.push(message)
            if (messages2.length === 1) {
                expect(message).to.contains('ClientId')
                ws2.send('$DISCLASSIFY')
                return
            }
            if (messages2.length === 2) {
                expect(message).to.contains('INVALID_TYPES')
                ws2.send('$DISCLASSIFY:name')
                return
            }
            if (messages2.length === 3) {
                expect(message).to.contains('NOT_CLIENTS_PROVIDED')
                ws2.send('$DISCLASSIFY:peach')
                return
            }
            if (messages2.length === 4) {
                expect(message).to.contains('INVALID_TYPES')
                ws2.send('$DISCLASSIFY:name|abc-def-ghi')
                return
            }
            if (messages2.length === 5) {
                expect(message).to.contains('USER_NOT_FOUND')
                ws2.send('$DISCLASSIFY:name|' + firstClient)
                return
            }
            if (messages2.length === 6) {
                expect(message).to.contains('NOT_ANSWERS_YET')
                ws.send('$ANSWER:' + types.simple + '|' + answers.simple)
                return
            }
            if (messages2.length === 7) {
                expect(message).to.contains('DISCLASSIFY')
                const jsonData = JSON.parse(message.substr(message.indexOf(':') + 1))
                expect(!!jsonData).to.true
                for(let clientData of jsonData) {
                    if (clientData.client === firstClient) {
                        // Is 20 because originally was 30 and after disclasiffy is 10 points less
                        expect(clientData.points).to.equal(20)
                    }
                }
                ws2.send('$DISCLASSIFY:name|' + firstClient)
                return
            }
            expect(message).to.equal('$VOTED_BEFORE')
            ws2.off('message', listener2)
            done()
        }
        ws.on('message', listener)
        ws2.on('message', listener2)
        ws.send('$START_BOARD')
    })
})
