const assist = require('./assist');
const server = require('./server');
const logger = require('./logger');

module.exports = server.launchServer;

module.exports.assist = assist;
module.exports.server = server;
module.exports.logger = logger;
