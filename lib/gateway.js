var Services       = require('./gateway/models/service');
var GatewayRoutes  = require('./gateway/routes');
var rocky          = require('rocky');
var _              = require('lodash');   
var mongoose = require('mongoose');    

function GatewayService(middleware, opts) {
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

  // TODO: While having this in memory is okay - it doesn't scale horizontally. Move to some shared memory????
  this.services = {};

}

GatewayService.prototype.use = function (middleware) {
  this.middleware.push(middleware);
}

GatewayService.prototype.getStaticProxy = function(service) {
  var proxy = rocky();
  proxy
    .forward(service.static.forward)
    .options({ timeout: 3000, forwardHost: true, forwardOriginalBody: true })
    .on('proxy:error', function (err) {
      console.log('Error:', err)
    })
    .on('proxyReq', function (proxyReq, req, res, opts) {
      console.log('Proxy request:', req.url, 'to', opts.target)
    })
    .on('proxyRes', function (proxyRes, req, res) {
      console.log('Proxy response:', req.url, 'with status', res.statusCode)
    });

  if (service.replays) {
    service.replays.map(function(replay) {
      proxy.replay(replay);
    });
  }

  for (let mw of this.middleware) {
    proxy.use(mw);
  }

  proxy.all('/' + service.base);

  proxy.all('/' + service.base + '/*');

  return proxy;
  
};

GatewayService.prototype.loadServices = function() {
  this.services = {};
  var gateway = this;
  return Services.find().exec(function(err, services) {
    if (err) {
      // TODO maybe an error or something here???
      console.log('Ahhhh shiz');
      return;
    }
    var storedServices = {};
    services.map(function (service) {
      switch (service.type) {
        case 'consul':
          // Need to implement everything for consul
        case 'static':
          var proxy = gateway.getStaticProxy(service);
          storedServices[service.base] = proxy.middleware();
          break;
        default:
          // TODO maybe an error or something here???
          console.log('What the what?!? Missing configuration info.')
      }
    }, this);

    // Why does this 'this' work but not the one in the map?
    this.services = storedServices;
  });
};

GatewayService.prototype.routes = function() {
  var routes = new GatewayRoutes(this);
  return routes.routes();
}

GatewayService.prototype.forward = function(req, res, next) {
  // Find the correct service to forward to
  // Call the linked middleware
  var base = req.path.split('/')[1];
  if (this.services.hasOwnProperty(base)) {
    this.services[base](req, res, function (err) {
      if (err) {
        return next(err);
      } else {
        // TODO Would skipping this stop it from going to a duplicate route
        next();
      }
    });
  } else {
    // 404
    // res.status(404).json({err: 'Dern it. Did not find a service to forward to.'});
    next();
  }
}


module.exports = GatewayService;