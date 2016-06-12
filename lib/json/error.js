var _ = require('lodash');
var validate = require('validate.js');

function ErrorResponse(app) {
  this.app = app;
};

ErrorResponse.prototype.create = function(status, err) {
  if (err.status) {
    status = err.status;
  }
  var error = {
    status: String(status),
    detail: err.message,
    meta: {
      error: {}
    }
  }

  if (this.app.get('env') === 'development') {
    error.meta.error = err;
  }

  return error;
}

ErrorResponse.prototype.status = function(err) {
  return err.status || 500;
}

// TODO Still need some work around this
ErrorResponse.prototype.error = function(err) {
  var status = this.status(err);

  // Check for multiple errors and handle them
  if (err.hasOwnProperty('errors')) {
    var errors = [];
    if (validate.isObject(err.errors)) {
      /*
        {
          id: [err1, err2],
          name: ['blah', 'bar']
        }
      */
      var errorResponse = this;
      var mapped = _.map(err.errors, function(value, key) {
        if (validate.isArray(value)) {
          return value.map(function(errObj) {
            return this.create(status, errObj);
          });
        } else {
          return errorResponse.create(status, value);
        }
      });

      return {errors: mapped};
    } else if (validate.isArray(err.errors)) {
      /*
        ['error one', 'error two']
      */
      errs = value.map(function(errObj) {
        return this.create(status, errObj);
      });

      return {errors: errs};
    } 
  } else {
    var error = this.create(status, err);

    return {errors: [error]};
  }
  
  
}

module.exports = ErrorResponse;