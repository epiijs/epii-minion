module.exports = {
  name: 'EPII Avatar',
  port: 8080,

  path: {
    root: __dirname,
    client: 'client',
    static: 'static'
  },
  extern: ['react'],

  layout: {
    styles: [],
    scripts: ['assets/react.js', 'assets/react-dom.js']
  }
};