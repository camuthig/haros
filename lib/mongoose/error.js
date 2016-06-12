var mongoose = require('mongoose');
var MongooseError = require('mongoose/lib/error')
var _ = require('lodash');

var handleError = function(err, req, res, next) {
  if (err.hasOwnProperty('message')) {
    var name = err.name || err.message.name || null;
  } else {
    var name = err.name || null;
  }
  
  if (MongooseError.hasOwnProperty(name) || MongooseError.hasOwnProperty(name)) {
    var error = new Error('Internal Error');

    if (name === 'ValidationError') {
      // handle a validation error
      error.status = 401;
      error.errors = err.errors;
    }

    return next(error);
  }

  next(err);
}

module.exports = handleError;