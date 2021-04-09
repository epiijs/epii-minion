const childProcess = require('child_process');
const fs = require('fs')
const os = require('os')
const path = require('path')
const util = require('util');
const logger = require('./logger.js');

const openFile = util.promisify(fs.open);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

/**
 * read command as `a -B` from `cmd a -B --c`
 * @param {String[]} argv 
 * @returns {String}
 */
function parseCommand(argv) {
  const picked = argv.filter(arg => !arg.startsWith('--'));
  return picked.join(' ');
}

/**
 * read options as {k:v} from `cmd --k=v`
 * @param {String[]} argv 
 * @returns {Object}
 */
function parseOptions(argv) {
  const options = {};
  argv.forEach((arg) => {
    if (!arg.startsWith('--')) return;
    const parts = arg.slice(2).split('=');
    const [key, value] = parts;
    if (key) {
      options[key] = value === undefined ? true : value;
    }
  });
  return options;
}

/**
 * output help file
 * @param {String=} helpPath 
 */
async function outputHelp(helpPath) {
  if (helpPath) {
    const helpText = await readFile(helpPath, 'utf8')
      .catch(error => {
        logger.warn('help file not found');
        logger.halt(error);
      });
    console.log(helpText);
  } else {
    logger.warn('help file required');
  }
}

/**
 * fork process for runner
 * @param {String} name 
 */
async function forkRunner(name) {
  const prockey = `.${name}.${Date.now()}`;
  const homedir = os.homedir();
  const logPath = path.join(homedir, `${prockey}.log`);
  const pidPath = path.join(homedir, `${prockey}.pid`);
  const argv = process.argv.filter(e => !e.startsWith('--fork'));
  const logFd = await openFile(logPath, 'a');
  const proc = childProcess.spawn(argv[0], argv.slice(1), { 
    cwd: process.cwd(),
    detached: true,
    stdio: ['ignore', logFd, logFd],
  });
  proc.on('exit', (code) => {
    console.log(`${name} - fork error code => ${code}\n`);
    process.exit(code);
  });
  await writeFile(pidPath, proc.pid.toString(), 'utf8');
  console.log(`${name} - fork <${argv.slice(2).join(' ')}> at ${proc.pid}`);
  proc.unref();
  console.log(`${name} - fork done`);
  process.exit(0);
}

/**
 * verify and fixup config
 * @param {Object} config 
 * @returns {Object} linted config
 */
function verifyConfig(config) {
  if (!config) throw new Error('config required');
  const c = { ...config };
  if (!c.name) {
    logger.warn('empty config.name, use default unknown');
    c.name = 'unknown';
  }
  if (!c.help) {
    logger.warn('empty config.help');
  }
  return c;
}

/**
 * handle process start from command line
 * @param {Object} config 
 * @param {Function} runner 
 * @returns 
 */
async function startRunner(config, runner) {
  // test runner
  if (typeof runner !== 'function') {
    logger.halt('runner function required');
    return;
  }

  // load config
  const conf = verifyConfig(config);
  const argv = process.argv.slice(2);
  const command = parseCommand(argv);
  const options = parseOptions(argv);

  if (options.help) return outputHelp(conf.help);
  if (options.fork) return forkRunner(conf.name);

  // protect process
  process.on('unhandledRejection', (reason) => {
    logger.halt('unhandledRejection', reason && (reason.stack || reason.toString()));
  });

  // start runner
  await runner({ command, options });
}

module.exports = {
  startRunner,
};
