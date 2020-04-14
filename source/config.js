const assist = require('./assist');

const config = {};

function setConfig(o) {
  return Object.assign(config, o);
}

assist.bindReadOnly(config, 'setConfig', setConfig);

module.exports = config;
