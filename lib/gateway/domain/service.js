import {Type} from './type';
import {Retry} from './retry';
import {ValidationError} from '../error/gateway';
import validate from 'validate.js';

export class Service {
  constructor(name, type, base, retry, id) {
    this.name = name;

    if (!Type.enumValueOf(type)) {
      throw new ValidationError('Invalid type: ' + type);
    }
    this.type = type;

    this.base = base;

    this.retry = retry;
    if (!(this.retry instanceof Retry)) {
      throw new ValidationError('retry must be of type Retry');
    }

    this.id = id;
  }
}

export class StaticConfiguration {
  constructor(servers) {
    if (!validate.isArray(servers)) {
      throw new ValidationError('servers must be an array of urls');
    }

    for (var server of servers) {
      if (!validate.single(server, {presence: true, url: true})) {
        throw new Error('servers must be an array of urls');
      }
    }

    this.servers = servers;
  }
}

export class StaticService extends Service {
  constructor(name, type, base, retry, id, staticConfiguration) {
    super(name, type, base, retry, id);

    this.staticConfiguration = staticConfiguration;
    if (!this.staticConfiguration || !(this.staticConfiguration instanceof StaticConfiguration)) {
      throw new ValidationError('staticConfiguration must be of type StaticConfiguration');
    }
  }
}

export class ConsulConfiguration {
  constructor(servers, service, dataCenter, tag) {
    if (!validate.isArray(servers) || validate.isEmpty(servers)) {
      throw new ValidationError('servers must be a non-empty array');
    }

    if (!service) {
      throw new ValidationError('service is required');
    }

    this.servers = servers;
    this.service = service;
    this.dataCenter = dataCenter;
    this.tag = tag;
  }
}

export class ConsulService extends Service {
  constructor(name, type, base, retry, id, consulConfiguration) {
    super(name, type, base, retry, id);

    this.consulConfiguration = consulConfiguration;
    if (!this.consulConfiguration || !(this.consulConfiguration instanceof ConsulConfiguration)) {
      throw new ValidationError('consulConfiguration must be of type ConsulConfiguration');
    }
  }
}