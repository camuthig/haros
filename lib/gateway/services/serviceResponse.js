import {JsonResponse} from '../../json';

export class ServiceResponse {
  constructor() {
    this.type = 'service';
    this.response = new JsonResponse(this.type);
  }

  _map(service) {
    if (service.staticConfiguration) {
      service.static = service.staticConfiguration
      delete service.staticConfiguration;
    }

    return service;
  }

  toJson(service) {
    if (Array.isArray(service)) {
      var mapped = service.map(function(service) {
        return this._map(service)
      }.bind(this));
      return this.response.parseObjects(mapped)
    }

    return this.response.parseObject(this._map(service));
  }
}