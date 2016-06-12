var validate = require('validate.js');
var _ = require('lodash');

JsonRequest = function(type) {
  this.type = type;

  validate.validators.equalsUrlParam = this.equalsUrlParam;
  validate.validators.isObject = this.isObject;
  validate.validators.equals = this.equals;
}

JsonRequest.prototype.equalsUrlParam = function(value, options, key, attributes) {
  var message = options.message || 'should equal the url ' + key;
  var urlParam = options.urlParam || key;
  if (!options.req.params.hasOwnProperty(urlParam) || options.req.params[urlParam] != value) {
    return message;
  }
}

JsonRequest.prototype.isObject = function (value, options, key, attributes) {
  var message = options.message || 'should be an object.';
  if (!validate.isObject(value)) {
    return message;
  }
}

JsonRequest.prototype.equals = function (value, options, key, attributes) {
  var message = options.message || 'must equal ' + options.value;
  if (value != options.value) {
    return message;
  }
}

var topConstraints = {
  data: {
    presence: true,
  }
}

var resourceConstraints = function(type, req) {
  return {
    id: {
      presence: true,
      equalsUrlParam: {
        req: req
      }
    },
    type: {
      equals: {
        value: type
      }
    },
    attributes: {
      presence: true,
      isObject: true
    }
  }
}

var createConstraints = function (type, req) {
  return {
    type: {
      equals: {
        value: type
      }
    },
    attributes: {
      presence: true,
      isObject: true
    }
  }
}

JsonRequest.prototype.validateResource = function(req) {
  var topValidation = validate(req.body, topConstraints);

  if (!_.isEmpty(topValidation)) {
    return topValidation;
  }

  var resourceValidation = validate(req.body.data, resourceConstraints(this.type, req));
  if (!_.isEmpty(resourceValidation)) {
    return resourceValidation;
  }
}

JsonRequest.prototype.validateCreateResource = function(req) {
  var topValidation = validate(req.body, topConstraints);

  if (!_.isEmpty(topValidation)) {
    return topValidation;
  }

  var resourceValidation = validate(req.body.data, createConstraints(this.type, req));
  if (!_.isEmpty(resourceValidation)) {
    return resourceValidation;
  }
}

module.exports = JsonRequest;