/* eslint-disable global-require,no-param-reassign */
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const mime = require('mime-types');
const assist = require('./assist');
const config = require('./config');
const logger = require('./logger');

const prefixRoot = '/';
const prefixData = '/__/data';
const prefixFile = '/__/file';

const loaderHTML = fs.readFileSync(path.join(__dirname, 'loader.html'), 'utf8');

function openBrowser(options) {
  if (os.platform() === 'darwin') {
    assist.startProcess(`open http://localhost:${options.port}`);
  }
}

function writeOutput(context, o) {
  const headers = {};
  headers['Content-Type'] = 'application/json';
  context.response.writeHead(200, headers);

  let output = o;
  if (o instanceof Error) {
    output = { state: false, error: o.message, stack: o.stack };
  }
  context.response.write(JSON.stringify(output));
  context.response.end();
}

/**
 * serve view
 *
 * @param {Object} context
 * @param {String} view
 */
function serveView(context, view) {
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Timing-Allow-Origin': '*'
  };
  let viewResult = loaderHTML
    .replace(/\$\{name\}/, config.name)
    .replace(/\/\$\{key\}/g, path.join(view, 'index'));
  if (config.layout) {
    const styles = (config.layout.styles || [])
      .map(e => `<link rel="stylesheet" href="${prefixFile}/${e}" />`).join('\n  ');
    const scripts = (config.layout.scripts || [])
      .map(e => `<script type="application/javascript" src="${prefixFile}/${e}"></script>`).join('\n  ');
    viewResult = viewResult
      .replace('<!-- styles -->', styles)
      .replace('<!-- scripts -->', scripts);
  }
  context.response.writeHead(200, headers);
  context.response.write(viewResult);
  context.response.end();
}

/**
 * serve data
 *
 * @param {Object} context
 * @param {String} route
 * @param {Object} query
 * @param {Object} input
 */
function serveData(context, route, query, input) {
  if (assist.isDebug()) {
    logger.info(`data :: ${route}`, input);
  }
  // todo - validate secure token
  const headers = {};
  headers['Content-Type'] = 'application/json';
  context.response.writeHead(200, headers);
  const serverDir = path.join(config.path.root, config.path.server || 'server');
  try {
    const action = require(path.join(serverDir, route));
    if (!input.query) input.query = {};
    if (!input.model) input.model = {};
    const result = action.call(null, input);
    if (!(result instanceof Promise)) {
      throw new Error('async api required');
    }
    result
      .then(json => writeOutput(context, json))
      .catch(error => writeOutput(context, error));
  } catch (error) {
    writeOutput(context, error);
  }
}

/**
 * serve file
 *
 * @param {Object} context
 * @param {String} file
 * @param {String} root
 */
async function serveFile(context, file, root) {
  const fullPath = path.join(root || __dirname, file);
  const fileStat = await assist.getFileStat(fullPath);
  if (!fileStat) {
    context.response.writeHead(404);
    context.response.end('not found');
    return;
  }

  const headers = {
    Connection: 'close',
    'Content-Type': mime.contentType(path.extname(file)) || 'application/octet-stream',
    'Content-Length': fileStat.size,
    'Access-Control-Allow-Origin': '*',
    'Timing-Allow-Origin': '*'
  };
  context.response.writeHead(200, headers);
  if (context.debug) {
    logger.info('=> request');
    Object.keys(context.request.headers).forEach(key => {
      logger.warn(`=> [${key}]`, context.request.headers[key]);
    });
    logger.info('<= response');
    Object.keys(headers).forEach(key => {
      logger.warn(`<= [${key.toLowerCase()}]`, headers[key]);
    });
  }

  const stream = fs.createReadStream(fullPath);
  stream.pipe(context.response)
    .on('error', (error) => {
      logger.halt(error.message);
      context.response.end();
    });
}

function lintOptions(options) {
  const mergedOptions = {
    port: 9988,
  };
  if (options) {
    if (options.name) mergedOptions.name = options.name;
    if (options.port) mergedOptions.port = options.port;
    if (options.path) mergedOptions.path = options.path;
    if (options.layout) mergedOptions.layout = options.layout;
  }
  if (!mergedOptions.name) {
    throw new Error('name required');
  }
  return mergedOptions;
}

function handleRequest(request, response) {
  const context = { request, response };
  const url = new URL(request.url, 'http://dummyhost');
  if (url.searchParams.get('debug')) {
    context.debug = true;
  }

  // handle root path
  if (url.pathname === prefixRoot) {
    serveView(context, '/');
    return;
  }

  // output debug url info
  if (process.env.NODE_ENV === 'development') {
    logger.info('=>', request.url);
  }

  // handle data
  if (url.pathname.startsWith(prefixData)) {
    if (request.method !== 'POST') {
      writeOutput(context, new Error('only accept POST in epiiQL'));
      return;
    }
    let buffer = '';
    request.on('data', chunk => {
      buffer += chunk;
    });
    request.on('end', () => {
      const input = assist.tryParseJSON(buffer, {});
      serveData(context, url.pathname.replace(prefixData, ''), url.searchParams, input);
    });
    return;
  }

  // handle file
  if (url.pathname.startsWith(prefixFile)) {
    const staticDir = path.join(config.path.root, config.path.static || 'static');
    serveFile(context, url.pathname.replace(prefixFile, ''), staticDir);
    return;
  }

  // default response
  if (response.headerSent || response.finished) return;
  response.writeHead(404);
  response.end('not found');
}

/**
 * create server
 *
 * @param  {Object=} options
 * @return {Function} standard http.Server callback
 */
function createServer(options) {
  // verify options
  const newOptions = lintOptions(options);
  config.setConfig(newOptions);

  // write port file
  const maindir = path.join(os.homedir(), `.${config.name}`);
  assist.createDirectory(maindir);
  fs.writeFileSync(path.join(maindir, 'port'), newOptions.port.toString());

  // create http server
  const httpServer = http.createServer(handleRequest);
  httpServer.on('clientError', (error, socket) => {
    logger.halt('http error >', error.stack);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });
  httpServer.on('timeout', (socket) => {
    socket.end();
  });
  httpServer.launch = () => {
    httpServer.listen(newOptions.port, () => {
      logger.warn(`listening at ${newOptions.port}`);
      openBrowser(newOptions);
    });
    return httpServer;
  };
  return httpServer;
}

/**
 * launch server
 *
 * @param  {Object=} options
 */
function launchServer(options) {
  // todo - try to find caller package version
  // const version = require('./package.json').version;
  // logger.info(`version ${version}`);
  return createServer(options).launch();
}

module.exports = {
  createServer,
  launchServer
};
