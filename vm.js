const vm = require('vm');

/**
 * sandbox for epii mini server
 *
 * @param {Object=} config
 */
module.exports = (config) => {
  return vm.runInNewContext(
    'require("./source/")(config)',
    { require, config }
  );
};
