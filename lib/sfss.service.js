// should use a service.plugin.api package
var bodyParser = require('body-parser'),
    packageInfo = require('../package.json'),
    apiVersion = packageInfo.version.substring(0, packageInfo.version.lastIndexOf('.')),
    urlLib = require('url'),
    pathLib = require('path'),
    express = require('express'),
    q = require('q'),
    routerTemplate = require('./router'),
    responderTemplate = require('./responder'),
    api = express(),
    finder = require('package.loader'),
    cache = {},
    store;
var devmode = require('devmode');

var waitForInit = setTimeout(init,  3000);

function init (_options) {
  clearTimeout(waitForInit);

  _options = _options || {
    port: 8080,
    "sfss.api.endpoint": {
      dataRoot: __dirname + pathLib.sep + 'data',
      disableFileDeletion: true,
      disableDirectoryDeletion: true
    }
  };
  console.log(_options);

  api.disable('x-powered-by');

  api.use(bodyParser.json({limit: '50mb'}));
  api.use(bodyParser.urlencoded({extended: true,limit: '50mb'}));
  api.use(function(err, request, response, next){
    console.log('Express error handler fired:');
    console.error(err);

    var data = new ProcessingData(request, response);
    data.responseBody = {error: err.message, stack: err.stack};
    data.statusCode = 500;

    data.send();
  });


  function parseRequest (request, response, next) {
    //console.log('###################################');
    //console.log(' ++ PARSING REQUEST');

    var parts = urlLib.parse(request.url, true);

    request._context = {};

    request._context.apiRoot = '/';
    request._context.apiVersion = 'v'+apiVersion;
    request._context.http_method = request.method;
    request._context.query = parts.query;
    request._context.body = request.body;
    request._context.path = parts.pathname;
    request._context.pathArray = request._context.path.split('/');

    if (! request._context.pathArray[0]) {
      // remove leading empty string
      request._context.pathArray.shift();
    }

    request._context.endpoint = request._context.pathArray.shift();

    if (request._context.pathArray.length && request._context.pathArray[0].match(/^v\d{1,3}\.\d{1,3}(\.\d{1,3}){0,1}$/)) {
      // add requested endpoint version
      request._context.endpointVersion = request._context.pathArray.shift();
    }

    next();
  }


  /**
 * SECURITY: all requests are checked
 * before eventualy being executed,
 * if something is wrong, a generic error is returned
 */
  api.all('*', parseRequest);


  /**
 * probe.html
 */
  console.log('Init Probe: /probe.html');
  api.get('/probe.html', function (request, response) {
    var data = new ProcessingData(request, response);
    data.responseBody = 'Application running';
    data.statusCode = 200;
    data.contentType = 'text/html';

    data.send();
  });


  /**
 * SECURITY: all requests are checked
 * before eventualy being executed,
 * if something is wrong, a generic error is returned
 */
  console.log('Init SECURITY for "all" request patterns: ','*');
  api.all('*', gateKeeper);


  /**
 * Endpoint routing
 */
  finder.match(/^\w+(\.\w+){0,}\.api\.endpoint$/).forEach(function (apiName, index) {
    var shortName = apiName.replace('.api.endpoint', '');
    cache[shortName] = {
      options: _options[apiName] || {},
      package: apiName
    };

    console.log('Init "all" routing: ','/'+shortName+'/*');
    api.all('/'+shortName+'/*', processRequest);
  });

  console.log('cache: ', cache);


  console.log('API listening on: ', _options.port);
  api.listen(_options.port);

  //#########################################################################
  function ProcessingData (_request, _response) {
    this.response = _response;

    this.context = _request._context;

    //this.responseBody;
    //this.statusCode;
    this.contentType = 'application/json; charset=utf-8';

    routerTemplate(this);
    responderTemplate(this);
  }

  function gateKeeper (request, response, next) {
    //console.log(' ++ GATE KEEPER')

    switch (request.method) {
      case 'PUT':
      case 'POST':
        try {
          // TODO: implement SECURITY: security.validate(request.body);
          next();
        }
        catch (validationError) {
          var data = new ProcessingData(request, response);

          data.responseBody = {
            data: {reason: 'Document is not valid'}
          };

          if (devmode.isActive()) {
            // on DEV, return the real error message
            data.responseBody.data.reason = validationError.message;
          }

          // document invalid, return an error
          data.statusCode = 422;
          data.contentType = 'application/json; charset=utf-8';

          data.send();
        }
        break;

      default:
        next();
        break;
    }
  }

  function processRequest (request, response) {
    var data = new ProcessingData(request, response);

    processHttpMethod(data)
    .then(function (data) {
      data.send();
    })
    .catch(function (data) {
      data.send();
    })
    .done();
  }

  function processHttpMethod (data) {
    var http_method = data.context.http_method,
        result = q.defer();

    try {
      var endpointName = data.context.endpoint;

      if (! cache[endpointName]) {
        cache[endpointName] = {};
      }

      if (! cache[endpointName].process) {
        cache[endpointName].process = devmode.require(cache[endpointName].package)(cache[endpointName].options);
      }

      cache[endpointName].process(data)
      .then (function (data) {
        return result.resolve(data);
      })
      .catch (function (data) {
        return result.reject(data);
      })
      .done();
    }
    catch (error) {
      console.error('-- BIG ERROR: ', error.stack);

      data.error = {};
      data.error.message = error.message;
      data.error.stack   = error.stack;
      data.error.query   = data.request.url;

      if (error.code === 'MODULE_NOT_FOUND') {
        data.statusCode = 404;
        data.responseBody = {data:{}};
        data.responseBody.data.reason = 'Requested endpoint is not provided by the API: ' + data.request.url;
      } else {
        data.error.reason = 'An error occured while processing the request';
        data.responseBody = data.error;
        data.statusCode = 500;
      }

      data.contentType = 'application/json; charset=utf-8';
      result.reject(data);
    }

    return result.promise;
  }


  return api;
}

module.exports = init;
