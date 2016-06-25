import {ServiceRepo, ServiceQuery} from './gateway/repo/service';
import {Type} from './gateway/domain/type';
import {ValidationError} from './gateway/error/gateway';

var Services       = require('./gateway/models/service');
var GatewayRoutes  = require('./gateway/routes');
var rocky          = require('rocky');
var consul         = require('rocky-consul');
var _              = require('lodash');   
var mongoose = require('mongoose');    

export class GatewayService {
  constructor(middleware, opts) {
    if (!opts.hasOwnProperty('database')) {
      throw new Error('Database configuration required.');
    }

    mongoose.connect(opts.database);

    this.middleware = [];
    if (middleware) {
      if (!Array.isArray(middleware)) {
        middleware = [ middleware ];
      }

      this.middleware = middleware
    }

    this.repo = new ServiceRepo();

    // TODO: While having this in memory is okay - it doesn't scale horizontally. Move to some shared memory????
    this.services = {};

  }

  use (middleware) {
    this.middleware.push(middleware);
  }

  getStaticProxy (service) {
    var proxy = rocky();
    proxy.balance(service.staticConfiguration.servers);

    return proxy;
  };

  getConsulProxy (service) {
    var proxy = rocky();
    var opts = {
      servers: service.consulConfiguration.servers,
      service: service.consulConfiguration.service
    };

    if (service.consulConfiguration.dataCenter) {
      opts.datacenter = service.consulConfiguration.dataCenter;
    }

    if (service.consulConfiguration.tag) {
      opts.tag = service.consulConfiguration.tag;
    }

    var rConsul = consul(opts);
    rConsul.consul.update((err, servers) => {
      if (err) {
        throw new Error(err);
      }
    });

    proxy.use(rConsul);

    return proxy;
  };

  configureProxy(service, proxy) {
    proxy
      .options({ timeout: 3000, forwardHost: true, forwardOriginalBody: true })
      .on('proxy:error', function (err) {
        console.log('Error:', err)
      })
      .on('proxyReq', function (proxyReq, req, res, opts) {
        console.log('Proxy request:', req.url, 'to', opts.target)
      })
      .on('proxyRes', function (proxyRes, req, res) {
        console.log('Proxy response:', req.url, 'with status', res.statusCode)
      })
      .on('proxy:retry', function (err, req, res) {
        console.log('Retry forward request:', err.code)
      })
      .on('replay:retry', function (err, req, res) {
        console.log('Retry replay request:', err.code)
      })
      .on('route:error', (err, req, res) => {
        console.log('Shit:', err);
      });

    if (service.retry && service.retry.enabled) {
      var opts = {};
      if (service.retry.retries) {
        opts.retries = service.retry.retries;
      }
      if (service.retry.timeout) {
        opts.minTimeout = service.retry.timeout;
      }
      if (service.retry.maxTimeout) {
        opts.maxTimeout = service.retry.maxTimeout;
      }

      proxy.retry(opts);
    }

    for (let mw of this.middleware) {
      proxy.use(mw);
    }

    proxy.all('/' + service.base);

    proxy.all('/' + service.base + '/*');

    return proxy;
  }

  loadServices() {
    this.services = {};
    return this.repo.find(new ServiceQuery()).then(
      (services) => {
        var storedServices = {};
        services.map((service) => {
          var baseProxy = null;
          switch (service.type) {
            case Type.CONSUL.name:
              // Need to implement everything for consul
              baseProxy = this.getConsulProxy(service);
              break;
            case Type.STATIC.name:
              baseProxy = this.getStaticProxy(service);
              break;
            default:
              // TODO maybe an error or something here???
              throw new ValidationError('Invalid service type: ' + service.type);
          }

          var proxy = this.configureProxy(service, baseProxy);
          storedServices[service.base] = proxy.middleware();
        }, this);

        this.services = storedServices;

        return this;
      }
    );
  };

  routes() {
    var routes = new GatewayRoutes(this);
    return routes.routes();
  }

  forward() {
    return function(req, res, next) {
      // Find the correct service to forward to
      // Call the linked middleware
      var base = req.path.split('/')[1];
      if (this.services.hasOwnProperty(base)) {
        this.services[base](req, res, next);
      } else {
        // 404
        next()
      }
    }.bind(this)
  }
}