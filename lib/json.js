var _ = require('lodash');

JsonResponse = function(type) {
  this.type = type;
}

JsonResponse.prototype.json = function(type) {
  return function (req, res, next) {
    console.log(type);
    console.log(res);
  }
}

JsonResponse.prototype._parseObject = function(obj) {
  var attributes = obj.toObject();
  delete attributes._id;
  return {
    id: obj._id,
    type: this.type,
    attributes: attributes
  }; 
}

/**
 *  Parse an object to conform to JSON API standards
 */
JsonResponse.prototype.parseObject = function(obj) {
  var jsonObj = this._parseObject(obj);
  console.log(jsonObj);
  return {data: jsonObj};
}

/**
 *  Parse an array of objects to conform to JSON API standards
 */
JsonResponse.prototype.parseObjects = function(arr) {
  var jsonArr = arr.map(this._parseObject, this);
  return {data: jsonArr};
}




module.exports = JsonResponse;