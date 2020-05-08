const expect = require('chai').expect;
const server = require('../src/server');
const WebSocket = require('ws');

describe('Websocket server unit tests', () => {
    beforeEach(() => {
        server.start(process.env);
    });

    afterEach(() => {
        if (server) {
            server.stop();
        }
    })

    it('Check server start successfully', (done) => {
        const ws = new WebSocket(`ws://localhost:${server.port()}`)
        ws.on('open', () => {
            expect(ws.OPEN).to.be.equal(1);
        });
        ws.on('message', (message) => {
            expect(message).to.equal('Connection successfully');
            ws.close();
            done();
        });
    })
});