/* eslint-disable global-require,no-param-reassign */
const fs = require('fs');
const path = require('path');
const util = require('util');
const { BufferList } = require('bl');
const mime = require('mime-types');
const logger = require('./logger');

const statFile = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);

const DATA_PREFIX = '/__data';
const FILE_PREFIX = '/__file';
const ICON_PREFIX = '/favicon';
const VIEW_HOLDER = /\{\{view\}\}/g;

const CONTEXT = {
  config: null,
  layout: null,
  aspect: null,
  online: process.env.NODE_ENV !== 'development',
};

function getServerDir(key) {
  const config = CONTEXT.config;
  return path.join(config.path.root, config.path[key]);
}

/**
 * try to parse json
 * use default json if fail
 * @param  {String} text
 * @param  {Object} json
 * @returns {Object}
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
 * read request body as buffer
 * @param {http.IncomingMessage} request 
 * @returns {Promise<Buffer>}
 */
function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const bl = new BufferList();
    request.on('error', error => reject(error));
    request.on('data', chunk => bl.append(chunk))
    request.on('end', () => {
      resolve(bl.slice(0));
    });
  });
}

/**
 * serve request /*
 * @param {http.ServerResponse} response
 * @param {String} view
 */
function serveView(response, view) {
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Timing-Allow-Origin': '*'
  };
  response.writeHead(200, headers);
  const layoutHTML = CONTEXT.layout.replace(VIEW_HOLDER, view);
  response.write(layoutHTML);
  response.end();
}

/**
 * serve request /__data/*
 * @param {http.ServerResponse} response
 * @param {String} name
 * @param {Object} input
 * @param {http.IncomingMessage} request
 */
async function serveData(response, name, input, request) {
  if (!CONTEXT.online) {
    logger.info(`data :: ${name}`, input);
  }
  // TODO - call aspect filter
  let result = null;
  try {
    const serverDir = getServerDir('server');
    const actionPath = require.resolve(path.join(serverDir, name));
    const action = require(actionPath);
    result = await action.call(null, input, request)
      .catch((error) => {
        if (error instanceof Error) return error;
        return new Error(error)
      });
    // hot reload data action
    if (!CONTEXT.online) {
      delete require.cache[actionPath];
      logger.warn(`data :: ${name} reload`);
    }
  } catch (error) {
    result = error;
  }
  // short to file
  if (result instanceof fs.ReadStream) {
    return serveFile(response, result);
  }
  // TODO - call aspect output
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
 * @param {http.ServerResponse} response
 * @param {String|ReadStream} file
 */
async function serveFile(response, file) {
  const filePath = file instanceof fs.ReadStream ? file.path : file;

  let fileStat = null;
  try {
    fileStat = await statFile(filePath);
  } catch (error) {
    response.writeHead(404);
    response.end('not found');
    return;
  }

  const headers = {
    'Connection': 'close',
    'Content-Type': mime.contentType(path.extname(filePath)) || 'application/octet-stream',
    'Content-Length': fileStat.size,
    'Access-Control-Allow-Origin': '*',
    'Timing-Allow-Origin': '*'
  };
  response.writeHead(200, headers);
  const stream = file instanceof fs.ReadStream ? file : fs.createReadStream(file);
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
  // output debug url info
  if (process.env.NODE_ENV === 'development') {
    logger.info('=>', request.url);
  }

  const url = new URL(request.url, 'http://dummyhost');

  // parse url route
  let route = url.pathname;
  if (CONTEXT.router) {
    route = CONTEXT.router[url.pathname] || route;
  }

  // handle data
  if (route.startsWith(DATA_PREFIX)) {
    readRequestBody(request)
      .then((buffer) => {
        const input = tryParseJSON(buffer, {});
        const action = route.replace(DATA_PREFIX, '');
        serveData(response, action, input, request);
      });
    return;
  }

  // handle file
  if (route.startsWith(FILE_PREFIX)) {
    let fullPath = url.searchParams.get('local');
    if (!fullPath || !c.unsafe) {
      const staticDir = getServerDir('static');
      const staticFile = route.replace(FILE_PREFIX, '');
      fullPath = path.join(staticDir, staticFile);
    }
    serveFile(response, fullPath);
    return;
  }

  // handle icon gone
  if (route.startsWith(ICON_PREFIX)) {
    response.writeHead(410);
    response.write('icon should be accessed by /__file');
    response.end();
    return;
  }

  // handle view
  serveView(response, route);
}

/**
 * verify and fixup config
 * @param  {Object} config
 * @returns {Object} linted config
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
  if (c.unsafe) {
    logger.warn('unsafe enabled');
  }
  return c;
}

/**
 * create server
 * @param  {Object=} config
 * @returns {Promise<Function>} standard http.Server callback
 */
async function createServer(config) {
  // load config
  const conf = verifyConfig(config);
  CONTEXT.config = conf;

  // load layout
  const layoutPath = conf.path.layout ? 
    path.join(conf.path.root, conf.path.layout) :
    path.join(__dirname, 'layout.html');
  CONTEXT.layout = await readFile(layoutPath, 'utf8');

  // load aspect
  if (conf.path.aspect) {
    const aspectPath = path.join(conf.path.root, conf.path.aspect);
    CONTEXT.render = require(aspectPath);
  }

  // load router
  if (conf.router) {
    // TODO - normalize routes
    CONTEXT.router = conf.router;
  }

  // to handle request
  return handleRequest;
}

module.exports = {
  createServer,
};
