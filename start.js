const path = require('path');
const epiiRender = require('@epiijs/render');
const epiiMinion = require('./source');

const config = {
  name: 'EPII Avatar',
  port: 8080,

  path: {
    root: path.join(__dirname, 'example/avatar'),
    client: 'client',
    static: 'static'
  },
  holder: {
    name: 'app',
    stub: 'epii',
  },
  extern: ['react'],
  layout: {
    styles: [],
    scripts: ['common.js', 'assets/react.js', 'assets/react-dom.js']
  }
};

if (process.env.NODE_ENV !== 'production') {
  epiiRender.watch(config);
  epiiMinion(config);
} else {
  epiiRender.build(config);
}
