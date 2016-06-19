import {ServiceRepo, ServiceQuery} from './gateway/repo/service';
import {Type} from './gateway/domain/type';

var Services       = require('./gateway/models/service');
var GatewayRoutes  = require('./gateway/routes');
var rocky          = require('rocky');
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
    proxy
      .balance(service.staticConfiguration.servers)
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
    
  };

  loadServices() {
    this.services = {};
    return this.repo.find(new ServiceQuery()).then(
      function(services) {
        var storedServices = {};
        services.map(function (service) {
          switch (service.type) {
            case Type.CONSUL.name:
              // Need to implement everything for consul
            case Type.STATIC.name:
              var proxy = this.getStaticProxy(service);
              storedServices[service.base] = proxy.middleware();
              break;
            default:
              // TODO maybe an error or something here???
              console.log('What the what?!? Missing configuration info.')
          }
        }, this);

        this.services = storedServices;

        return this;
      }.bind(this)
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