const assist = require('./assist');
const logger = require('./logger');
const server = require('./server');

class QueryError extends Error {
  constructor(message, state) {
    super(message);
    if (state === 0) {
      throw new Error('error state must be NOT 0');
    }
    this.state = state;
  }
}

module.exports = {
  start: server.launchServer,
  QueryError
};
