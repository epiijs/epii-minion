# epii-minion

[![Build Status](https://travis-ci.org/epiijs/epii-minion.svg?branch=master)](https://travis-ci.org/epiijs/epii-minion)
[![Coverage Status](https://coveralls.io/repos/github/epiijs/epii-minion/badge.svg?branch=master)](https://coveralls.io/github/epiijs/epii-minion?branch=master)

A mini server for small web app.

## Features

### one layer pipeline

    (Request)
        => / Static | Action /
    (Response)

### fixed app shell for one page

```html
<html>
  <head>
  </head>
  <body>
    <script src="__file/index.js">
  </body>
</html>
```

## Usage

### project like this

```sh
(root)
├── client
│   └── index.js(x)
├── server
│   ├── ActionA.js
│   └── ActionB.js
└── static
    └── (files)
```

### install as dependency
```sh
npm install --save @epiijs/minion@latest
```

### use API to start server
```js
const epiiMinion = require('@epiijs/minion');

epiiMinion([{
  name: 'YOUR-APP-NAME',
  port: 8080,
  path: {
    root: __dirname,
  },
  expert: {
  }
}]);
```

## FAQ

### How to contributing

TODO

## Language (TODO)