const packageJSON = require('../../../package.json');

module.exports = async function getVersion(input) {
  const { query } = input;
  return { version: packageJSON.version };
}