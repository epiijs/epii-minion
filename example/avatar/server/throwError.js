const { QueryError } = require('../../../source');

module.exports = async function throwError(input) {
  // throw new QueryError('not error', 0);
  throw new QueryError('simple error', 1);
}