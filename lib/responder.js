var merge = require('node.extend');

var responderTemplate = {
  send: function () {
    var response = this.response,
        body;

    try {
      checkResponseParameters(this);
    }
    catch (error) {
      this.responseBody = error;
      this.statusCode = 500;
      this.contentType = 'application/json; charset=utf-8';
      this.reasonPhrase = getReasonPhrase(this.statusCode);
      this.responseBody.status = this.reasonPhrase;
    }

    setHeaders(response);

    response.writeHead(this.statusCode, this.reasonPhrase,
                       {'Content-Type': this.contentType});


    if (this.contentType.indexOf('/json') > -1) {
      body = JSON.stringify(this.responseBody);
    }
    else {
      body = this.responseBody;
    }

    response.write(body);
    response.end();
  }
};

function setHeaders (response) {
  response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Expires", 0);
}

/**
 * Checks if the parameters are in accordance with the JSend specification
 * (http://labs.omniti.com/labs/jsend)
 *
 */
function checkResponseParameters (parameters) {

  if (! parameters.contentType) {
    throw new ResponseError('response parameters must have a "contentType" property');
  }

  if (! parameters.statusCode) {
    throw new ResponseError('response parameters must have a "statusCode" property');
  }

  if (! parameters.responseBody) {
    throw new ResponseError('response parameters must have a "responseBody" property');
  }

  // enforce JSend "status"
  parameters.reasonPhrase = getReasonPhrase(parameters.statusCode);
  parameters.responseBody.status = getJSendType(parameters.statusCode);

  switch (parameters.responseBody.status) {
    case 'success':
      if (! parameters.responseBody.data) {
        throw new ResponseError(
          'on "success" response body must have a "data" property ' +
          'it acts as the wrapper for any this returned by the API call. ' +
          'If the call returns no this, this should be set to null'
        );
      }
      break;

    case 'fail':
      if (! parameters.responseBody.data) {
        throw new ResponseError(
          'on "fail" response body must have a "data" property ' +
          'it provides the wrapper for the details of why the request failed. ' +
          'If the reasons for failure correspond to POST values, the response ' +
          'object\'s keys SHOULD correspond to those POST values: ' +
          '"this" : { "title" : "A title is required" }'
        );
      }
      break;

    case 'error':
      if (! parameters.responseBody.message) {
        throw new ResponseError(
          'on "error" response body must have a "message" property ' +
          'a meaningful, end-user-readable (or at the least log-worthy) message, ' +
          'explaining what went wrong. ' +
          'Optional keys: ' +
          'code: A numeric code corresponding to the error, if applicable' +
          'this: A generic container for any other information about the error, ' +
          'i.e. the conditions that caused the error, stack traces, etc.'
        );
      }
      break;
  }
}


/**
 * Returns a JSend Type based on the Status Code
 * in accordance with the JSend specification
 * (http://labs.omniti.com/labs/jsend)
 *
 */
function getJSendType (statusCode) {

  if (statusCode >= 200 && statusCode < 300) {
    return 'success';
  }
  else if (statusCode >= 400 && statusCode < 500) {
    return 'fail';
  }
  else if (statusCode >= 500) {
    return 'error';
  }
  else {
    throw new ResponseError('"statusCode" ' + statusCode + ' does not match any defined range. No JSend Type can be found.');
  }
}

/**
 * Returns the Reason Phrase in accordance to the provided Status Code
 * (http://en.wikipedia.org/wiki/List_of_HTTP_status_codes)
 *
 */
function getReasonPhrase (statusCode) {

  switch (statusCode) {

    case 200:
      // Standard response for successful HTTP requests.
      // The actual response will depend on the request method used.
      // GET request: resp. will contain an entity corresponding to the requested resource.
      // POST request: resp. will contain an entity describing/containing the result of the action.
      return 'OK';

    case 201:
      // The request has been fulfilled and resulted in a new resource being created.
      return 'Created';

    case 202:
      // The request has been accepted for processing, but the processing has not been completed.
      // The request might or might not eventually be acted upon,
      // as it might be disallowed when processing actually takes place.
      return 'Accepted';

    case 204:
      // The server successfully processed the request, but is not returning any content.
      // Usually used as a response to a successful delete request.
      return 'Deleted';

    case 400:
      // The request cannot be fulfilled due to bad syntax.
      return 'Bad Request';

    case 401:
      // Similar to 403 Forbidden, but specifically for use when authentication is required
      // and has failed or has not yet been provided. The response must include a
      // WWW-Authenticate header field containing a challenge applicable to the requested resource.
      return 'Unauthorized';

    case 403:
      // The request was a valid request, but the server is refusing to respond to it.
      // Unlike a 401 Unauthorized response, authenticating will make no difference.
      return 'Forbidden';

    case 404:
      // The requested resource could not be found but may be available again in the future.
      // Subsequent requests by the client are permissible.
      return 'Not Found';

    case 422:
      // The request was well-formed but was unable to be followed due to semantic errors.
      return 'Unprocessable Entity';

    case 500:
      // A generic error message, given when an unexpected condition was encountered
      // and no more specific message is suitable.
      return 'Internal Server Error';

    case 501:
      // The server either does not recognize the request method,
      // or it lacks the ability to fulfil the request. Usually this implies future availability
      return 'Not Implemented';

    case 503:
      // The server is currently unavailable (because it is overloaded or down for maintenance).
      // Generally, this is a temporary state.
      return 'Service Unavailable';

    default:
      throw new ResponseError('no description found for "statusCode" ' + statusCode);
  }
}


function ResponseError (_message, _name) {
  this.name = _name || 'ResponseError';
  this.message = _message;
}


module.exports = function (_this) {

  // Deep merge of the processing this object and the client template
  merge(true, _this, responderTemplate);
};
