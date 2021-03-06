import {ServiceFactory} from './service';
import {Type} from '../domain/type';
import {JsonRequest} from '../../json/request';

var validate = require('validate.js');
var _ = require('lodash');

var notExist = function(value, options, key, attributes) {
  if (attributes.hasOwnProperty(key)) {
    return options.hasOwnProperty('message') ? options.message : 'should not exist';
  }
}

var postConstraints = {
  type: {
    presence: true,
    inclusion: {
      within: [Type.STATIC.name, Type.CONSUL.name],
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
  },
  consul: function(value, attributes, attributeName, options, constraints) {
    // if the type is 'static', then this is required
    if (attributes.hasOwnProperty('type') && attributes.type === Type.CONSUL.name) {
      return {
        presence: {message: "is required when using consul type"}
      };
    } else {
      return {
        notExist: {
          message: 'should not exist when it is not a consul type'
        }
      };
    }
  }
};

var patchConstraints = {
  type: {
    inclusion: {
      within: [Type.STATIC.name, Type.CONSUL.name],
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
  },
  consul: function(value, attributes, attributeName, options, constraints) {
    // if the type is 'static', then this is required
    if (attributes.hasOwnProperty('type') && attributes.type === Type.CONSUL.name) {
      return {};
    } else {
      return {
        notExist: {
          message: 'should not exist when it is not a consul type'
        }
      };
    }
  }
};

export class ServiceRequest{
  constructor() {
    this.type = 'service';
    this.request = new JsonRequest(this.type);

    validate.validators.notExist = notExist;
  }

  post(req, next) {
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

  patch(req, next) {
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
}