var merge = require('node.extend');


var routingTemplate = {
  getEndpointPath: function () {
    var path = null;

    if (this.context.adminMode){
      path = '/admin/' + this.context.method;
    } else {

      path = '/data';

//       // Append Service Version
//       if (this.context.moduleVersion) {
//         path += '/lib/' + this.context.moduleVersion;
//       } else {
//         // Load Service Configuration
//         service_config = require(service.config.options.apiRoot + '/' + path + '/lib/service');

//         // append the latest stable service version
//         path += '/lib/' + service_config.stable_version;
//       }

//       //TODO test not supported yet
//       if (this.context.testMode) {
//         path += '/test';
//       }

      path += '/' + this.context.method;
    }

    console.log('router::path', path);
    return path;
  }
};


module.exports = function (_data) {

  // Deep merge of the processing data object and the client template
  merge(true, _data, routingTemplate);
};
