# Simple FS Storage Service
[![NPM version](https://badge.fury.io/js/sfss.service.svg)](http://badge.fury.io/js/sfss.service)
[![dependencies](https://david-dm.org/luscus/sfss.service.svg)](https://david-dm.org/luscus/sfss.service)
[![devDependency Status](https://david-dm.org/luscus/sfss.service/dev-status.svg?theme=shields.io)](https://david-dm.org/luscus/sfss.service#info=devDependencies)

Builds uppon [sfss.api.endpoint](https://github.com/luscus/sfss.api.endpoint).


## Usage

    npm install sfss.service --save

    var pathLib = require('path'),
        options = {
          port: 8080,
          "sfss.api.endpoint": {
            dataRoot: __dirname + pathLib.sep + 'data',
            //disableFileDeletion: true,
            //disableDirectoryDeletion: true
          }
        },
        api = require('sfss.service')(options);
