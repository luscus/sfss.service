var pathLib = require('path'),
    options = {
      port: 8080,
      "sfss.api.endpoint": {
        dataRoot: __dirname + pathLib.sep + 'data',
        //disableFileDeletion: true,
        //disableDirectoryDeletion: true
      }
    },
    api = require('../lib/sfss.service')(options);

