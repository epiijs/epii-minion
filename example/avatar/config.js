module.exports = {
  name: 'epii-minion',
  port: 8080,
  path: {
    root: __dirname,
    layout: 'layout.html',
  },
  router: {
    '/file': '/__data/accessFile',
  },
  extern: 'react',
};