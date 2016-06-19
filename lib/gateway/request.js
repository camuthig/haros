import {ServiceFactory} from './services/service';
import {Type} from './domain/type';

var validate = require('validate.js');
var _ = require('lodash');
var JsonRequest = require('../json/request');

function ServiceRequest(type) {
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
      within: [Type.STATIC.name],
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
    if (attributes.hasOwnProperty('type') && attributes.type === Type.STATIC.name) {
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
      null
    );
  }

  var factory = new ServiceFactory();
  return next(
    validate(req.body.data.attributes, postConstraints),
    factory.create(req.body.data.attributes)
  ); 
}

var patchConstraints = {
  type: {
    inclusion: {
      within: [Type.STATIC.name],
      message: function(value, attribute, validatorOptions, attributes, globalOptions) {
        return validate.format("^We only support %{types} types", {
          types: validatorOptions.within.join(',')
        });
      }
    }
  },
  name: {},
  base: {},
  retry: {},
  static: function(value, attributes, attributeName, options, constraints) {
    // if the type is 'static', then this is required
    if (attributes.hasOwnProperty('type') && attributes.type === Type.STATIC.name) {
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
  console.log('Json errors:', jsonErrors);
  if (!_.isEmpty(jsonErrors)) {
    return next(
      jsonErrors,
      null
    );
  }

  console.log('Errors:', validate(req.body.data.attributes, patchConstraints));
  console.log('Cleaned:' , validate.cleanAttributes(req.body.data.attributes, patchConstraints));

  return next(
    validate(req.body.data.attributes, patchConstraints), 
    validate.cleanAttributes(req.body.data.attributes, patchConstraints)
  ); 
}

module.exports = ServiceRequest;