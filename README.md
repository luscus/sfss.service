# Simple FS Storage Service

[![NPM version](https://img.shields.io/npm/v/sfss.service.svg?style=flat)](https://www.npmjs.com/package/sfss.service "View this project on NPM")
[![NPM downloads](https://img.shields.io/npm/dm/sfss.service.svg?style=flat)](https://www.npmjs.com/package/sfss.service "View this project on NPM")
[![NPM license](https://img.shields.io/npm/l/sfss.service.svg?style=flat)](https://www.npmjs.com/package/sfss.service "View this project on NPM")
[![flattr](https://img.shields.io/badge/flattr-donate-yellow.svg?style=flat)](http://flattr.com/thing/3817419/luscus-on-GitHub)

![coverage](https://rawgit.com/luscus/sfss.service/master/reports/coverage.svg)
[![David](https://img.shields.io/david/luscus/sfss.service.svg?style=flat)](https://david-dm.org/luscus/sfss.service)
[![David](https://img.shields.io/david/dev/luscus/sfss.service.svg?style=flat)](https://david-dm.org/luscus/sfss.service#info=devDependencies)

Builds uppon [sfss.api.endpoint](https://github.com/luscus/sfss.api.endpoint).


## Usage

    npm install sfss.service --save

Example:

    var pathLib = require('path'),
        options = {
          port: 8080,
          "sfss.service": {
            dataRoot: __dirname + pathLib.sep + 'data',
            //disableFileDeletion: true,
            //disableDirectoryDeletion: true
          }
        },
        api = require('sfss.service')(options);
