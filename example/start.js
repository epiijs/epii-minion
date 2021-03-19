const epiiRender = require('@epiijs/render');
const epiiMinion = require('../source');
const config = require('./avatar/config');

async function main() {
  if (process.env.NODE_ENV !== 'production') {
    await epiiRender.watchBuild(config);
  } else {
    await epiiRender.buildOnce(config);
  }
  epiiMinion.startServer(config);
}

main();
