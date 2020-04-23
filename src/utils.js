module.exports = {
    /**
     * Returns a unique identifier
     */
    uniqueId() {
        return Math.random().toString(36).substr(2, 9);
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
    }
}