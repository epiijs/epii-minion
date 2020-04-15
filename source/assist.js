const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const util = require('util');

function isDebug() {
  return process.env.NODE_ENV === 'development';
}

/**
 * try to parse json
 * use default json if fail
 *
 * @param  {String} text
 * @param  {Object} json
 * @return {Object}
 */
function tryParseJSON(text, json) {
  try {
    const o = JSON.parse(text);
    return o;
  } catch (error) {
    return json;
  }
}

/**
 * bind ReadOnly property
 *
 * @param  {Object} target
 * @param  {String} name
 * @param  {*} value
 */
function bindReadOnly(target, name, value) {
  Object.defineProperty(target, name, {
    value: value,
    writable: false,
    configurable: false,
    enumerable: true
  });
}

/**
 * test if path exists
 *
 * @param  {String} p
 * @return {Boolean}
 */
function canAccess(p) {
  try {
    fs.accessSync(p, fs.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * create directory recursively
 *
 * @param  {String} dir
 */
function createDirectory(dir) {
  const parts = dir.split('/').filter(Boolean);
  let fullPath = '/';
  for (let i = 0; i < parts.length; i += 1) {
    fullPath = path.join(fullPath, parts[i]);
    if (!canAccess(fullPath)) {
      fs.mkdirSync(fullPath);
    }
  }
}

/**
 * get file stat
 *
 * @param  {fs.Stat} stat
 */
function getFileStat(p) {
  return new Promise((resolve,) => {
    fs.stat(p, (error, stat) => {
      if (error) {
        console.error(error);
        resolve();
      } else {
        resolve(stat);
      }
    });
  });
}

/**
 * promise to execute command
 * stderr can be ignored, useful for git
 * options:
 *  {Boolean} ignore - skip stderr
 *
 * @param  {String} command
 * @param  {Object=} options
 * @return {Promise}
 */
function startProcess(command, options) {
  return new Promise((resolve, reject) => {
    if (options) {
      if (options.cwd && !canAccess(options.cwd)) {
        reject(new Error('cwd not found'));
        return;
      }
    }
    childProcess.exec(command, options, (error, stdout, stderr) => {
      // reject if error
      if (error) return reject(error);

      // resolve if ignore stderr
      if (options && options.ignore) return resolve(stdout);

      // resolve if null or empty stderr(Buffer)
      if (!stderr || stderr.length === 0) return resolve(stdout);

      // reject if stderr
      return reject(new Error(stderr.toString()));
    });
  });
}

module.exports = {
  isDebug,
  tryParseJSON,
  bindReadOnly,
  canAccess,
  createDirectory,
  readFile: util.promisify(fs.readFile),
  writeFile: util.promisify(fs.writeFile),
  getFileStat,
  startProcess
};
