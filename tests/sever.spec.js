const expect = require('chai').expect
const server = require('../src/server')
const webSocket = require('ws')
let ws, ws2, ws3

describe('Test to check connection, game starts and joinments', () => {
    before(() => {
        server.start()
        const uri = `ws://localhost:${server.port()}`
        ws = new webSocket(uri)
        ws2 = new webSocket(uri)
        ws3 = new webSocket(uri)
    });

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

    it('Show close board if client is not connected yet', (done) => {
        const listener = (message) => {
            expect(message).to.contain('CLOSE_BOARD')
            ws.off('message', listener)
            done()
        }
        ws.on('message', listener)
        ws.send('$WHO')
    })

    it('Check client start successfully a board', (done) => {
        const listener = (message) => {
            const data = JSON.parse(message)
            expect(data.board).to.match(/^\w{6,}$/)
            expect(data.client).to.match(/^\w{3,}(-\w{3,}){2,}$/)
            ws.off('message', listener)
            done()
        }
        ws.on('message', listener)
        ws.send('$START_BOARD')
    })

    it('Check invalid command send a message to the client', (done) => {
        const listener = (message) => {
            expect(message).to.contain('COMMAND_INCORRECT')
            ws.off('message', listener)
            done()
        }
        ws.on('message', listener)
        ws.send('$SOME_COMMAND')
    })

    it('Check client can join to a board', (done) => {
        const listener = (message) => {
            const jsonData = JSON.parse(message)
            expect(!!jsonData).to.true
            ws.off('message', listener)
            ws2.send(`$JOIN_BOARD:${jsonData.board}`)
        }
        const listener2 = (message) => {
            expect(message).to.contain('ClientId')
            ws2.off('message', listener2)
            done()
        }
        ws.on('message', listener)
        ws2.on('message', listener2)
        ws.send('$START_BOARD')
    })

    it('Check server show error if try to join wrong board', (done) => {
        const listener = (message) => {
            const jsonData = JSON.parse(message)
            expect(!!jsonData).to.true
            ws2.send('$JOIN_BOARD:wrongBoard')
            ws.off('message', listener)
        }
        const listener2 = (message) => {
            expect(message).to.contain('CLOSE_BOARD')
            ws2.off('message', listener2)
            done()
        }
        ws.on('message', listener)
        ws2.on('message', listener2)
        ws.send('$START_BOARD')
    })

    it('Check that a client can change the board timeout', (done) => {
        const messages = []
        const listener = (message) => {
            messages.push(message)
            if (messages.length == 1) {
                const jsonData = JSON.parse(message)
                expect(!!jsonData).to.true
                ws.send('$SET_TIMEOUT:5')
                return
            }
            if (messages.length == 2) {
                expect(message).to.equal('$SET_TIMEOUT')
                let date = new Date()
                while ((new Date().getTime() - date.getTime()) / 1000 < 5) {
                    continue;
                }
                return
            }
            if (messages.length > 2) {
                expect(message).to.contain('END CONNECTION FOR INACTIVITY')
                ws.off('message', listener)
                done()
            }
        }
        ws.on('message', listener)
        ws.send('$START_BOARD')
    })
})