const expect = require('chai').expect
const server = require('../src/server')
const { types, answers } = require('../src/constants')
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
})