const env = process.env.NODE_ENV || 'dev';

module.exports = {
    info(message) {
        (env === 'test') && console.info(message + ' ' + environment);
    }
}
