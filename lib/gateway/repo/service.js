import {NotFoundError} from '../error/gateway';
import {Service, StaticService, StaticConfiguration, ConsulService, ConsulConfiguration} from '../domain/service';
import {Type} from '../domain/type';
import {Retry} from '../domain/retry';
import {ValidationError} from '../error/gateway';

var Model = require('../models/service');

export class ServiceQuery {
  constructor(q, name, base, type) {
    this.q = q;
    this.name = name;
    this.base = base;
    this.type = type;
  }
}

export class ServiceRepo {

  constructor() {
    this.model = Model;
  }

  _createRetry(retry) {
    if (retry) {
      return new Retry(
        retry.enabled,
        retry.retries || null,
        retry.timeout || null,
        retry.maxTimeout || null
      );
    }

    return new Retry(false, null, null, null);
  }

  _createStaticConfiguration(staticConfiguration) {
    if (staticConfiguration) {
      return new StaticConfiguration(staticConfiguration.servers);
    }

    throw new ValidationError('Invalid static configuration');
  }

  _createStaticService(service) {
    return new StaticService(
      service.name,
      service.type,
      service.base,
      this._createRetry(service.retry),
      service._id,
      this._createStaticConfiguration(service.static)
    );
  }

  _createConsulConfiguration(consulConfiguration) {
    if (consulConfiguration) {
      return new ConsulConfiguration(
        consulConfiguration.servers,
        consulConfiguration.service,
        consulConfiguration.dataCenter,
        consulConfiguration.tag
      );
    }

    throw new ValidationError('Invalid consul configuration');
  }

  _createConsulService(service) {
    return new ConsulService(
      service.name,
      service.type,
      service.base,
      this._createRetry(service.retry),
      service._id,
      this._createConsulConfiguration(service.consul)
    );
  }

  _createService(service) {
    switch(service.type) {
      case Type.STATIC.name:
          return this._createStaticService(service);
      case Type.CONSUL.name:
        return this._createConsulService(service);
      default:
          throw new ValidationError('Invalid service type');
    }
  }

  _createModel(service) {
    var model = {
      name: service.name,
      type: service.type,
      base: service.base,
      retry: {
        enabled: service.retry.enabled,
        retries: service.retry.retries,
        timeout: service.retry.timeout,
        maxTimeout: service.retry.maxTimeout
      },
    };

    if (model.type === Type.STATIC.name) {
      model.static = {
        servers: service.staticConfiguration.servers
      }
    }

    if (model.type === Type.CONSUL.name) {
      model.consul = {
        servers: service.consulConfiguration.servers,
        service: service.consulConfiguration.service,
        dataCenter: service.consulConfiguration.dataCenter,
        tag: service.consulConfiguration.tag
      }
    }

    return model;
  }

  _catchMongooseErrors(err) {
    if (err.name == 'CastError') {
      throw new NotFoundError('Service not found');
    }
  }

  create(service) {
    if (!(service instanceof Service)) {
      throw new Error('Must be of type Service');
    }

    var model = this._createModel(service);

    return this.model.create(model).then(
      (service) => {
         return this._createService(service);
      });
  }

  remove(id) {
    return this.model.remove({_id: id}).exec().then(
      (success) => {
        if (success.result.n == 0) {
          throw new NotFoundError('Service not found');
        }
        
        return true;
      },
      (err) => {
        throw err;
      })
  }

  update(service) {
    if (!(service instanceof Service)) {
      throw new Error('Must be of type Service');
    }

    var model = this._createModel(service);

    return this.model.update({_id: service.id}, {$set: model}).exec().then(
      (success) => {
        return service;
      }, 
      (err) => {
        this._catchMongooseErrors(err);
        throw err;
      }
    );
  }

  findById(id) {
    return this.model.findOne({_id: id}).lean().exec().then(
      (service) => {
        if (!service) {
          throw new NotFoundError('Service not found');
        }

        return this._createService(service);
      },
      (err) => {
        this._catchMongooseErrors(err);
        throw err;
      }    
    );
  }

  find(query) {
    if (!(query instanceof ServiceQuery)) {
      throw new ValidationError(400, 'query must be type ServiceQuery');
    }

    var repoQuery = this.model.find();
    if (query.q) {
      repoQuery.find({name: new RegExp('.*' + query.q + '.*', "i")});
    }
    if (query.name) {
      repoQuery.find({name: query.name});
    }
    if (query.base) {
      repoQuery.find({base: query.base});
    }
    if (query.type) {
      repoQuery.find({type: query.type});
    }

    return repoQuery.lean().exec().then(
      (services) => {
        return services.map((service) => {
          return this._createService(service);
        }, this);
      },
      (err) => {
        this._catchMongooseErrors(err);
        throw err;
      }
    );
  }
}