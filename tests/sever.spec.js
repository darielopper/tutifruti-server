const expect = require('chai').expect;
const server = require('../src/server');
const WebSocket = require('ws');
let ws, ws2, ws3;

describe('Websocket server unit tests', () => {
    before(() => {
        server.start();
        ws = new WebSocket(`ws://localhost:${server.port()}`);
        ws2 = new WebSocket(`ws://localhost:${server.port()}`);
        ws3 = new WebSocket(`ws://localhost:${server.port()}`);
    });

    after(() => {
        if (ws && ws.readyState === ws.OPEN) {
            ws.close();
        }
        if (ws2 && ws.readyState === ws2.OPEN) {
            ws2.close();
        }
        if (ws3 && ws.readyState === ws3.OPEN) {
            ws3.close();
        }
        server.stop();
    })

    it('Check server start successfully', (done) => {
        const listener = (message) => {
            expect(message).to.equal('Connection successfully');
            ws.off('message', listener);
            done();
        };
        ws.on('message', listener);
    });

    it('Show close board if client is not connected yet', (done) => {
        const listener = (message) => {
            expect(message).to.contain('CLOSE_BOARD');
            ws.off('message', listener);
            done();
        };
        ws.on('message', listener);
        ws.send('$WHO');
    });

    it('Check client start successfully a board', (done) => {
        const listener = (message) => {
            const data = JSON.parse(message);
            expect(data.board).to.match(/^\w{6,}$/);
            expect(data.client).to.match(/^\w{3,}(-\w{3,}){2,}$/);
            ws.off('message', listener);
            done();
        };
        ws.on('message', listener);
        ws.send('$START_BOARD');
    });

    it('Check invalid command send a message to the client', (done) => {
        const listener = (message) => {
            expect(message).to.contain('COMMAND_INCORRECT');
            ws.off('message', listener);
            done();
        };
        ws.on('message', listener);
        ws.send('$SOME_COMMAND');
    });

    it('Check client can join to a board', (done) => {
        const listener = (message) => {
            const jsonData = JSON.parse(message);
            expect(!!jsonData).to.true;
            ws.off('message', listener);
            ws2.send(`$JOIN_BOARD:${jsonData.board}`)
        };
        const listener2 = (message) => {
            expect(message).to.contain('ClientId');
            ws2.off('message', listener2);
            done();
        };
        ws.on('message', listener);
        ws2.on('message', listener2);
        ws.send('$START_BOARD');
    });

    it.skip('Check server show error if try to join wrong board', () => {
        /*const messages = [],
            secondMessages = [];
        ws.on('open', () => {
            console.log('here');
            ws.send('$START_BOARDs');
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
            });
        })*/
        /*ws.on('open', (done) => {
            ws.on('message', () => {
                console.log('here');
                //done();
            });
            ws.send('$START_BOARDs');
            expect(2).to.eq(23);
        });*/
    });

    it.skip('Check server start board correctly', (done) => {
        const messages = [],
            secondMessages = [];

        ws.on('open', () => {
            console.log('open');
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
    })
});