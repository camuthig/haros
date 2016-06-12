var validate = require('validate.js');
var _ = require('lodash');
var JsonRequest = require('../json/request');

ServiceRequest = function(type) {
  this.type = type;
  this.request = new JsonRequest(type);

  validate.validators.notExist = notExist;
};

var notExist = function(value, options, key, attributes) {
  if (attributes.hasOwnProperty(key)) {
    return options.hasOwnProperty('message') ? options.message : 'should not exist';
  }
}

var postConstraints = {
  type: {
    presence: true,
    inclusion: {
      within: ['static'],
      message: function(value, attribute, validatorOptions, attributes, globalOptions) {
        return validate.format("^We only support %{types} types", {
          types: validatorOptions.within.join(',')
        });
      }
    }
  },
  name: {
    presence: true
  },
  base: {
    presence: true
  },
  static: function(value, attributes, attributeName, options, constraints) {
    // if the type is 'static', then this is required
    if (attributes.hasOwnProperty('type') && attributes.type === 'static') {
      return {
        presence: {message: "is required when using static type"}
      };
    } else {
      return {
        notExist: {
          message: 'should not exist when it is not a static type'
        }
      };
    }
  }
};

ServiceRequest.prototype.post = function(req, next) {
  // validate the request and clean it
  var jsonErrors = this.request.validateCreateResource(req);
  if (!_.isEmpty(jsonErrors)) {
    return next(
      jsonErrors,
      validate.cleanAttributes(req.body.data.attributes, postConstraints)
    );
  }

  return next(
    validate(req.body.data.attributes, postConstraints), 
    validate.cleanAttributes(req.body.data.attributes, postConstraints)
  ); 
}

var patchConstraints = {
  type: {
    inclusion: {
      within: ['static'],
      message: function(value, attribute, validatorOptions, attributes, globalOptions) {
        return validate.format("^We only support %{types} types", {
          types: validatorOptions.within.join(',')
        });
      }
    }
  },
  name: {},
  base: {},
  static: function(value, attributes, attributeName, options, constraints) {
    // if the type is 'static', then this is required
    if (attributes.hasOwnProperty('type') && attributes.type === 'static') {
      return {};
    } else {
      return {
        notExist: {
          message: 'should not exist when it is not a static type'
        }
      };
    }
  }
};

ServiceRequest.prototype.patch = function(req, next) {
  // validate the request and clean it
  var jsonErrors = this.request.validateResource(req);
  if (!_.isEmpty(jsonErrors)) {
    return next(
      jsonErrors,
      null
    );
  }

  return next(
    validate(req.body.data.attributes, patchConstraints), 
    validate.cleanAttributes(req.body.data.attributes, patchConstraints)
  ); 
}

module.exports = ServiceRequest;