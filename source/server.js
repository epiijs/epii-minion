/* eslint-disable global-require,no-param-reassign */
const fs = require('fs');
const path = require('path');
const util = require('util');
const mime = require('mime-types');
const logger = require('./logger');

const statFile = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);

const ROOT_PREFIX = '/';
const DATA_PREFIX = '/__data';
const FILE_PREFIX = '/__file';

const CONTEXT = {
  config: null,
  layout: null,
  online: process.env.NODE_ENV !== 'development'
};

function getServerDir(key) {
  const config = CONTEXT.config;
  return path.join(config.path.root, config.path[key]);
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
 * serve request /*
 *
 * @param {http.ServerResponse} response
 * @param {String} view
 */
function serveView(response, view) {
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Timing-Allow-Origin': '*'
  };
  // TODO - support view replace
  response.writeHead(200, headers);
  response.write(CONTEXT.layout);
  response.end();
}

/**
 * serve request /__data/*
 *
 * @param {http.ServerResponse} response
 * @param {String} route
 * @param {Object} input
 * @param {http.IncomingMessage} request
 */
async function serveData(response, route, input, request) {
  if (!CONTEXT.online) {
    logger.info(`data :: ${route}`, input);
  }
  // TODO - call data generator
  let result = null;
  try {
    const serverDir = getServerDir('server');
    const actionPath = require.resolve(path.join(serverDir, route));
    if (!CONTEXT.online) {
      // hot reload data action
      delete require.cache[actionPath];
      logger.warn(`data :: ${route} reload`);
    }
    const action = require(actionPath);
    result = await action.call(null, input, request)
      .catch((error) => {
        if (error instanceof Error) return error;
        return new Error(error)
      });
  } catch (error) {
    result = error;
  }
  // TODO - call data generator (status & output)
  const headers = {};
  headers['Content-Type'] = 'application/json';
  response.writeHead(200, headers);
  // output result
  let output = {};
  if (result instanceof Error) {
    output = { error: result.message, stack: result.stack };
  } else {
    output = { model: result };
  }
  response.write(JSON.stringify(output));
  response.end();
}

/**
 * serve request /__file/*
 *
 * @param {http.ServerResponse} response
 * @param {String} file
 */
async function serveFile(response, file) {
  const fileStat = await statFile(file);
  if (!fileStat) {
    response.writeHead(404);
    response.end('not found');
    return;
  }

  const headers = {
    'Connection': 'close',
    'Content-Type': mime.contentType(path.extname(file)) || 'application/octet-stream',
    'Content-Length': fileStat.size,
    'Access-Control-Allow-Origin': '*',
    'Timing-Allow-Origin': '*'
  };
  response.writeHead(200, headers);
  const stream = fs.createReadStream(file);
  stream.pipe(response)
    .on('error', (error) => {
      logger.halt(error.message);
      response.end();
    });
}

/**
 * handle request
 * @param {http.IncomingMessage} request 
 * @param {http.ServerResponse} response 
 * @returns 
 */
function handleRequest(request, response) {
  const url = new URL(request.url, 'http://dummyhost');

  // output debug url info
  if (process.env.NODE_ENV === 'development') {
    logger.info('=>', request.url);
  }

  // handle root path
  if (url.pathname === ROOT_PREFIX) {
    serveView(response, '/');
    return;
  }

  // handle data
  if (url.pathname.startsWith(DATA_PREFIX)) {
    let buffer = '';
    request.on('data', chunk => {
      buffer += chunk;
    });
    request.on('end', () => {
      const input = tryParseJSON(buffer, {});
      const route = url.pathname.replace(DATA_PREFIX, '');
      serveData(response, route, input, request);
    });
    return;
  }

  // handle file
  if (url.pathname.startsWith(FILE_PREFIX)) {
    let fullPath = url.searchParams.get('local');
    if (!fullPath || !c.unsafe) {
      const staticDir = getServerDir('static');
      const staticFile = url.pathname.replace(FILE_PREFIX, '');
      fullPath = path.join(staticDir, staticFile);
    }
    serveFile(response, fullPath);
    return;
  }

  // default response
  if (response.headerSent || response.finished) return;
  response.writeHead(404);
  response.end('not found');
}

/**
 * verify and fixup config
 *
 * @param  {Object} config
 * @return {Object} linted config
 */
 function verifyConfig(config) {
  if (!config) throw new Error('config required');
  const c = { ...config };
  if (!c.name) c.name = 'unknown';
  if (!c.port) c.port = 9988;
  if (!c.path) c.path = {}
  if (!c.path.server) c.path.server = 'server';
  if (!c.path.static) c.path.static = 'static';
  if (!c.path.layout) {
    logger.warn('empty config.path.layout, use default layout');
  }
  if (!c.render) c.render = {};
  if (c.unsafe) {
    logger.warn('unsafe enabled');
  }
  return config;
}

/**
 * create server
 *
 * @param  {Object=} config
 * @return {Promise<Function>} standard http.Server callback
 */
async function createServer(config) {
  const conf = verifyConfig(config);
  CONTEXT.config = conf;
  const layoutPath = conf.path.layout ? 
    path.join(conf.path.root, conf.path.layout) :
    path.join(__dirname, 'layout.html');
  CONTEXT.layout = await readFile(layoutPath, 'utf8');
  CONTEXT.render = config.render;

  return handleRequest;
}

module.exports = {
  createServer,
};
