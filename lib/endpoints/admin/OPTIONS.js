var q = require('q');

var _setHeader = function(res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

exports.getResponseBody = function (data) {
  _setHeader(data.response);

  var result = q.defer();

  data.contentType = 'application/json; charset=utf-8';
  data.statusCode = 200;
  data.reasonPhrase = 'OK';
  data.responseBody = JSON.stringify({
    status: 'OK'
  });

  result.resolve(data);

  return result.promise;
};
