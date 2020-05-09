const packageJSON = require('../../../package.json');

module.exports = async function getVersion(input) {
  return { version: packageJSON.version };
}