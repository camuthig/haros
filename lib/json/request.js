var validate = require('validate.js');
var _ = require('lodash');

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

export class JsonRequest {
  constructor(type) {
    this.type = type;

    validate.validators.equalsUrlParam = this.equalsUrlParam;
    validate.validators.isObject = this.isObject;
    validate.validators.equals = this.equals;
  }

  equalsUrlParam(value, options, key, attributes) {
    var message = options.message || 'should equal the url ' + key;
    var urlParam = options.urlParam || key;
    if (!options.req.params.hasOwnProperty(urlParam) || options.req.params[urlParam] != value) {
      return message;
    }
  }

  isObject(value, options, key, attributes) {
    var message = options.message || 'should be an object.';
    if (!validate.isObject(value)) {
      return message;
    }
  }

  equals(value, options, key, attributes) {
    var message = options.message || 'must equal ' + options.value;
    if (value != options.value) {
      return message;
    }
  }

  validateResourcefunction(req) {
    var topValidation = validate(req.body, topConstraints);

    if (!_.isEmpty(topValidation)) {
      return topValidation;
    }

    var resourceValidation = validate(req.body.data, resourceConstraints(this.type, req));
    if (!_.isEmpty(resourceValidation)) {
      return resourceValidation;
    }
  }

  validateCreateResource(req) {
    var topValidation = validate(req.body, topConstraints);

    if (!_.isEmpty(topValidation)) {
      return topValidation;
    }

    var resourceValidation = validate(req.body.data, createConstraints(this.type, req));
    if (!_.isEmpty(resourceValidation)) {
      return resourceValidation;
    }
  }
}