# epii-minion

[![Build Status](https://travis-ci.org/epiijs/epii-minion.svg?branch=master)](https://travis-ci.org/epiijs/epii-minion)
[![Coverage Status](https://coveralls.io/repos/github/epiijs/epii-minion/badge.svg?branch=master)](https://coveralls.io/github/epiijs/epii-minion?branch=master)

A mini server for small web app.

## Features

### one layer pipeline

    (Request)
        => / Assets | Actions /
    (Response)

### fixed app shell for one page

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
  <title>YOUR-APP-NAME</title>
  <link rel="stylesheet" href="/__/file/3rds.css" />
  <link rel="stylesheet" href="/__/file/view.css" />
</head>
<body>
  <div id="app"></div>
  <script src="/__/file/3rds.js"></script>
  <script src="/__/file/view.js"></script>
  <script src="/__/file/launch.js"></script>
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

epiiMinion({
  name: 'YOUR-APP-NAME',
  port: 8080,
  path: {
    root: __dirname,
  }
});
```

## FAQ

### How to contributing

TODO

## Language (TODO)