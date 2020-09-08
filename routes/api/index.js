/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

module.exports = function (app) {
    app.use('/api/login', require('./rt-api-login.js'));
};
