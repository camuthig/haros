var _ = require('lodash');

export class JsonResponse {
  constructor(type) {
    this.type = type;
  }

  json(type) {
    return function (req, res, next) {
      console.log(type);
      console.log(res);
    }
  }

  _parseObject(obj) {
    var id = obj.id;
    delete obj.id;
    return {
      id: id,
      type: this.type,
      attributes: obj
    }; 
  }

  parseObject(obj) {
    var jsonObj = this._parseObject(obj);
    return {data: jsonObj};
  }

  parseObjects(arr) {
    var jsonArr = arr.map(this._parseObject, this);
    return {data: jsonArr};
  }
}