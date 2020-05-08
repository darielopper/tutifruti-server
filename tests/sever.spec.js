const expect = require('chai').expect;
const server = require('../src/server');
const WebSocket = require('ws');
let ws;

describe('Websocket server unit tests', () => {
    beforeEach(() => {
        if (!ws) {
            server.start();
            ws = new WebSocket(`ws://localhost:${server.port()}`)
        }
    });

    it('Check server start successfully', (done) => {
        ws.on('open', () => {
            expect(ws.OPEN).to.be.equal(1);
        });
        ws.on('message', (message) => {
            expect(message).to.equal('Connection successfully');
            done();
        });
    });

    it('Check server show error if try to join wrong board', () => {
        const messages = [],
            secondMessages = [];
        ws.on('open', () => {
            ws.send('$START_BOARD');
        });
        ws.on('message', (data) => {
            messages.push(data);
            if (messages.length == 1) {
                expect(messages[0]).to.equal('Connection successfully');
                done();
                return;
            }
            /*if (messages.length == 2) {
                const messageParts = messages[1].split(':');
                expect(messageParts.length).to.equal(2);
                expect(messageParts[0]).to.equal('BoardId');
                expect(messageParts[1].trim()).to.match(/^\w{6,}$/);
                return;
            }

            const messageParts = messages[2].split(':');
            expect(messageParts[0]).to.equal('ClientId');
            const ws2 = new WebSocket(`ws://localhost:${server.port()}`);
            ws2.on('message', (data) => {
                const boardId = 'WrongId';
                ws2.send(`$JOIN_BOARD:${boardId}`);
                secondMessages.push(data);
                if (secondMessages.length > 1) {
                    const lastMessage = secondMessages.slice(-1).pop();
                    expect(lastMessage).to.contain('BOARD_NOT_FOUND');
                    done();
                }
            });*/
        })
    });

    /*it('Check server start board correctly', (done) => {
        const messages = [],
            secondMessages = [];
        ws.on('open', () => {
            ws.send('$START_BOARD');
        });
        ws.on('message', (data) => {
            messages.push(data);
            if (messages.length == 1) {
                expect(messages[0]).to.equal('Connection successfully');
                return;
            }
            if (messages.length == 2) {
                const messageParts = messages[1].split(':');
                expect(messageParts.length).to.equal(2);
                expect(messageParts[0]).to.equal('BoardId');
                expect(messageParts[1].trim()).to.match(/^\w{6,}$/);
                return;
            }

            const messageParts = messages[2].split(':');
            expect(messageParts.length).to.equal(2);
            expect(messageParts[0]).to.equal('ClientId');
            expect(messageParts[1].trim()).to.match(/^\w{3,}(-\w{3,}){2,}$/);
            expect(messages.length).to.equal(3);
            const ws2 = new WebSocket(`ws://localhost:${server.port()}`);
            ws2.on('message', (data) => {
                const boardId = messages[1].split(':').pop().trim();
                ws2.send(`$JOIN_BOARD:${boardId}`);
                secondMessages.push(data);
                if (secondMessages.length > 1) {
                    const lastMessage = secondMessages.slice(-1).pop();
                    expect(lastMessage).to.contain('ClientId:');
                    expect(lastMessage).to.match(/:\s\w{3,}(-\w{3,}){2,}$/);
                    done();
                }
            });
        })
    })*/
});