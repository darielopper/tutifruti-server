const expect = require('chai').expect
const server = require('../src/server')
const webSocket = require('ws')
let ws, ws2, ws3

describe('Test to check board status and client connected', () => {
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

    it('Check client can pause the game and show error if It is paused already', (done) => {
        const messages = []
        const listener = (message) => {
            messages.push(messages)
            if (messages.length == 1) {
                const json = JSON.parse(message)
                expect(!!json).to.true
                ws.send("$PAUSE_GAME")
                return
            }
            if (messages.length == 2) {
                expect(message).to.contain('GAME_PAUSED')
                ws.send("$PAUSE_GAME")
                return
            }
            expect(message).to.contain('INVALID_OPERATION')
            ws.off('message', listener)
            done()
        }
        ws.on('message', listener)
        ws.send('$START_BOARD')
    })

    it('Check that a client can\'t resume a game that It isn\' paused', (done) => {
        const messages = [];
        const listener = (message) => {
            messages.push(message)
            if (messages.length == 1) {
                const json = JSON.parse(messages)
                expect(!!json).to.true
                ws.send('$RESUME_GAME')
                return
            }
            expect(message).to.contain('INVALID_OPERATION')
            ws.off('message', listener)
            done()
        }
        ws.on('message', listener)
        ws.send('$START_BOARD')
    })
})