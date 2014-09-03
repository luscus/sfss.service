// should use a service.plugin.api package
var bodyParser = require('body-parser'),
    express = require('express'),
    q = require('q'),
    config = require('./endpoints/admin/config.json'),
    routerTemplate = require('./router'),
    responderTemplate = require('./responder'),
    api = express();

api.use(bodyParser.json({limit: '50mb'}));
api.use(bodyParser.urlencoded({limit: '50mb'}));
api.use(function(err, request, response, next){
  console.log('Express error handler fired:');
  console.error(err);

  var data = new ProcessingData(request, response);
  data.responseBody = {error: err.message, stack: err.stack};
  data.statusCode = 500;

  data.send();
});


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
 * admin routing
 */
console.log('Init "all" admin routing: ','/admin/*');
api.all('/admin/*', function (request, response){

  //the _context object contains information about the module to load
  request._context.adminMode = true;

  processRequest (request, response);
});


/**
 * api routing
 */
console.log('Init "all" api routing: ','/data/*');
api.all('/data/*', function(request, response) {

    //console.log('request._context',request._context);
    //_detectTestMode(request);

    //console.log('request._context',request._context); //DEBUG
    processRequest (request, response);
  });


api.listen(8080);

//#########################################################################
function ProcessingData (_request, _response) {
  this.request = _request;
  this.response = _response;

  this.context = _request._context;

  this.responseBody;
  this.statusCode;
  this.contentType = 'application/json; charset=utf-8';

  routerTemplate(this);
  responderTemplate(this);
}

function gateKeeper (request, response, next) {

  request._context = {
    method: request.method,
    apiVersion: 'v'+request.params[0],
    module: request.params[1],
    moduleVersion: '',
    testMode: false,
    paramPath: request.params[2]
  };

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

        if (process.env.STAGE === 'DEV') {
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
};

function processRequest (request, response) {
  var data = new ProcessingData(request, response);
  data.config = config;

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
  var http_method = (data.http_method) ? data.http_method : data.request.method,
      result = q.defer();

  try {

    // run service code...
    var endpoint = require('./endpoints/' + data.getEndpointPath());

    endpoint.getResponseBody(data)
    .then (function (data) {
      return result.resolve(data);
    })
    .catch (function (data) {
      return result.reject(data);
    })
    .done();
  }
  catch (error) {
    console.error(error.stack);

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



module.exports = api;
