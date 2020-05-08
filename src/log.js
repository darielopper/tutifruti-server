const env = process.env.NODE_ENV || 'dev';

module.exports = {
    info(message) {
        if (env === 'test') {
            return;
        }
        console.info(message + ' ' + environment);
    }
}