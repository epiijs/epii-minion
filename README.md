# epii-minion

[![Build Status](https://travis-ci.org/epiijs/epii-minion.svg?branch=master)](https://travis-ci.org/epiijs/epii-minion)
[![Coverage Status](https://coveralls.io/repos/github/epiijs/epii-minion/badge.svg?branch=master)](https://coveralls.io/github/epiijs/epii-minion?branch=master)

A mini server for small web app.

## Features

### one layer pipeline

    (Request)
        /__file/* => static/*.*  | static files
        /__data/* => server/*.js | data actions
    (Response)

### one app shell for single page

default html =>

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
  <link rel="stylesheet" href="/__file/index.css" />
</head>
<body>
  <div id="app"></div>
  <script src="/__file/index.js"></script>
</body>
</html>
```

## Usage

### project like this

```sh
(root)
├── client
│   ├── layout.html
│   └── index.js(x)
├── server
│   ├── action1.js
│   └── action2.js
└── static
    └── (files)
```

### install as dependency
```sh
npm install --save @epiijs/minion@latest
```

### write data action

You can simply write functions to be called as data action.
The name of function will be used as pathname of data action like /__data/functionName.

```js
export function doAction1(input) {
  // input = JSON.parse of POST body
  if (input.arg1) {
    throw new Error('your error');
    // status = 200, output = { error: 'your error' }
  }
  if (input.arg2) {
    return { hello: 'world' };
    // status = 200, output = { model: { hello: 'world' }
  }
  // status = 200, output = {}
}
```
Then access data action by /__data/doAction1 with POST body.

#### get more request info

```js
// POST is the simplest choice for data action. 
// However, you can get more request info by optional arguments.
export function doAction2(input, request) {
  // request is http.IncomingMessage
}
```

#### output custom response
 
TODO - will be support

### use API to start server
```js
const epiiMinion = require('@epiijs/minion');

let config = {
  name: 'YOUR-APP-NAME',
  port: 9988,
  path: {
    root: __dirname,
    server: 'server',
    static: 'static',
    layout: 'layout.html',
  }
};

// less configuration
config = {
  path: {
    root: __dirname,
  },
};

// start minion server
epiiMinion.startServer(config);
```

## FAQ

### How to contributing (TODO)

## Language (TODO)