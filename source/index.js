const assist = require('./assist');
const logger = require('./logger');
const server = require('./server');

module.exports = server.launchServer;

module.exports.assist = assist;
module.exports.logger = logger;
module.exports.server = server;