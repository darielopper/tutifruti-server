module.exports = {
    /**
     * Returns a unique identifier
     */
    uniqueId() {
        return Math.random().toString(36).substr(2, 9);
    },

    clientId() {
        const randomPart = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substr(1);

        return new Array(3).fill(0).map(item => randomPart()).join('-');
    },

    /**
     * Returns the difference in seconds between 2 dates
     * @param {DateTime} date1
     * @param {DateTime} date2
     */
    diffInSeconds(date1, date2) {
        const firstDate = date1 > date2 ? date2 : date1,
        lastDate = date1 > date2 ? date1 : date2;

        return (lastDate.getTime() - firstDate.getTime()) / 1000
    },

    /**
     * Returns true if clients isn't a array of clients and store info for an error
     * @param {Array|number|bool} clients
     */
    isInvalidClientsResult(clients) {
        return typeof clients === 'number' || !clients;
    }
}