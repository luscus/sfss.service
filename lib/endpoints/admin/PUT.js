// PUT updates a ressource
var auroraConfig = require('com.timocom.aurora.config'),
    service = {
      probe: {
        name: 'com.timocom.uam.api',
        sockets: []
      },
      logger: {
        warning: console.log,
        info: console.log
      },
      sockets: {},
      uamSocketId: 'uam'
    },
    q = require('q');

service.Socket = require('com.timocom.service.socket')(service);
socketManager = require('com.timocom.service.socket')(service);
require('../handler/socket')(service);

service.handler.socket.connect('zmq', 'com.timocom.worker', service.uamSocketId);


var _setHeader = function(res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

function getPrincipal (headers) {
  var principal = {};

  for (var property in headers) {
    if (property.indexOf('x-tc-') > -1) {
      principal[property] = headers[property];
    }
  }

  return principal;
}

exports.getResponseBody = function (data) {
  _setHeader(data.response);

  var result = q.defer(),
      query,
      _view,
      aParams,
      queryParams,
      paramPath = data.request._info.paramPath;


  // bundle the UAM workload
  var uamData = {
    type: 'uamBundle',
    timeReceived: new Date().toISOString(),
    principal: getPrincipal(data.request.headers),
    data: data.request.body
  };


  service.sockets[service.uamSocketId].setMessageHandler(function (response) {
    data.contentType = 'application/json; charset=utf-8';

    if (response.status === 'OK') {
      data.statusCode = 202;
      data.reasonPhrase = 'OK';
      data.responseBody = {
        data: 'UAM bulk object has been send to main Worker'
      };

      result.resolve(data);
    }
    else {
      data.statusCode = 503;
      data.reasonPhrase = 'ERROR';
      data.responseBody = {
        message: 'UAM bulk object could no be send to main Worker'
      };

      result.reject(data);
    }
  });


  service.sockets[service.uamSocketId].send(uamData);

  return result.promise;
};
