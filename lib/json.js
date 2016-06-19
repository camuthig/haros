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
  var id = obj.id;
  delete obj.id;
  return {
    id: id,
    type: this.type,
    attributes: obj
  }; 
}

/**
 *  Parse an object to conform to JSON API standards
 */
JsonResponse.prototype.parseObject = function(obj) {
  console.log('obj:', obj);
  var jsonObj = this._parseObject(obj);
  console.log('jsonObj:', jsonObj);
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