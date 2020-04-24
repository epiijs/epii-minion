/* eslint-disable global-require, no-console */
let chalk;
try {
  chalk = require('chalk');
} catch (error) {
  console.error('chalk not installed');
}

const config = require('./config');

const TYPE = {
  info: 'blue',
  warn: 'yellow',
  halt: 'red',
  done: 'green'
};

module.exports = {};

Object.keys(TYPE).forEach(name => {
  let LOGO = '';
  module.exports[name] = chalk
    ? function logWithChalk() {
      if (!LOGO) {
        LOGO = chalk.bgWhite.blue(` ${config.name || 'unknown'} `);
      }
      const head = chalk[TYPE[name]](LOGO);
      const args = Array.prototype.slice.call(arguments, 0);
      console.log.apply(null, [head].concat(args));
    }
    : function logWithNoChalk() {
      if (!LOGO) {
        LOGO = ` ${config.name || 'unknown'} `;
      }
      const head = LOGO + `[${name}]`;
      const args = Array.prototype.slice.call(arguments, 0);
      console.log.apply(null, [head].concat(args));
    };
});
