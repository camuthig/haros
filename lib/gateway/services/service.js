import {Service, StaticService, StaticConfiguration, ConsulService, ConsulConfiguration} from '../domain/service';
import {Retry} from '../domain/retry';
import {Type} from '../domain/type';
import {ValidationError} from '../error/gateway';

export class ServiceFactory {
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

  createStaticService(service) {
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

    throw new ValidationError('Missing Consul configuration');
  }

  createConsulService(service) {
    return new ConsulService(
      service.name,
      service.type,
      service.base,
      this._createRetry(service.retry),
      service._id,
      this._createConsulConfiguration(service.consul)
    );
  }

  create(service) {
    switch(service.type) {
      case Type.STATIC.name:
          return this.createStaticService(service);
      case Type.CONSUL.name:
        return this.createConsulService(service);
      default:
          throw new ValidationError('Invalid service type');
    }
  }

  _conditionalIfDefined(update, existing) {
    return (update === undefined) ? existing : update;
  }

  _mergeRetry(retry, updates) {
    if (!(retry instanceof Retry)) {
      throw new Error('First argument must be of type Retry');
    }

    if (!updates) {
      return retry;
    }

    var retry = {
      enabled: this._conditionalIfDefined(updates.enabled, retry.enabled),
      retries: this._conditionalIfDefined(updates.retries, retry.retries),
      timeout: this._conditionalIfDefined(updates.timeout, retry.timeout),
      maxTimeout: this._conditionalIfDefined(updates.maxTimeout, retry.maxTimeout)
    };

    return retry;
  }

  _mergeStatic(configuration, updates) {
    if (configuration == undefined && updates == undefined) {
      throw new Error('static must be set somehow');
    }

    if (updates == undefined) {
      return {
        servers: configuration.servers
      };
    }

    if (configuration == undefined) {
      return {
        servers: updates.servers
      };
    }

    return {
      servers: this._conditionalIfDefined(updates.servers, configuration.servers)
    }
  }

  _mergeConsul(configuration, updates) {
    if (configuration == undefined && updates == undefined) {
      throw new Error('consul must be set somehow');
    }

    if (updates == undefined) {
      return {
        servers: configuration.servers,
        service: configuration.service,
        dataCenter: configuration.dataCenter,
        tag: configuration.tag
      };
    }

    if (configuration == undefined) {
      return {
        servers: updates.servers,
        service: updates.service,
        dataCenter: updates.dataCenter,
        tag: updates.tag
      };
    }

    return {
      servers: this._conditionalIfDefined(updates.servers, configuration.servers),
      service: this._conditionalIfDefined(updates.service, configuration.service),
      dataCenter: this._conditionalIfDefined(updates.dataCenter, configuration.dataCenter),
      tag: this._conditionalIfDefined(updates.tag, configuration.tag)
    }
  }

  merge(service, updates) {
    if (!(service instanceof Service)) {
      throw new Error('First argument must be of type Service');
    }

    var merged = {
      _id: service.id,
      name: this._conditionalIfDefined(updates.name, service.name),
      type: this._conditionalIfDefined(updates.type, service.type),
      base: this._conditionalIfDefined(updates.base, service.base),
      retry: this._mergeRetry(service.retry, updates.retry),
    }

    if (merged.type == Type.STATIC.name) {
      merged.static = this._mergeStatic(service.staticConfiguration, updates.static);
    } else if (merged.type == Type.CONSUL.name) {
      merged.consul = this._mergeConsul(service.consulConfiguration, updates.consul);
    }

    var final = this.create(merged);

    return final;
  }
}