var _       = require('lodash');
var express = require('express');
var router = express.Router();
var Service = require('./models/service');
var Request = require('./request');
var Response = require('../json');

GatewayRoutes = function(gateway){
  this.type = 'service';
  this.request = new Request(this.type);
  this.response = new Response(this.type);

  this.gateway = gateway;
};

GatewayRoutes.prototype.routes = function() {
  var manager = this;

  router.patch('/:id', function(req, res, next) {
    manager.request.patch(req, function(err, body) {
      if (err) {
        return next(err);
      } else {
        Service.findById(req.params.id, function(err, service) {
          if (err) {
            return next(err);
          } 

          if (!service) {
            var error = new Error('Service not found');
            error.status = 404;
            return next(error)
          }

          service = _.merge(service, body);
          service.save(function(err) {
            if (err) {
              return next(err);
            }

            res.status(201).json(manager.response.parseObject(service));
          });
        });
      }
    });
    
  }); 

  router.get('/reload', function(req, res, next) {
    return manager.gateway.loadServices().then(
      function(success) {
        return res.status(204).send();
      },
      function(err) {
        return next(err);
      }
    );
  });

  router.get('/:id', function(req, res, next) {
    Service.findOne({_id: req.params.id}).exec(function(err, service) {
      if (err) {
        return next(err);
      }

      if (!service) {
        var error = new Error('Service not found');
        error.status = 404;
        return next(error)
      }

      res.json(manager.response.parseObject(service));
    });
  });

  /* GET services listing. */
  router.get('/', function(req, res, next) {
    var query = Service.find();
    if (req.query.q) {
      query.find({name: new RegExp('.*' + req.query.q + '.*', "i")});
    }
    if (req.query.name) {
      query.find({name: req.query.name});
    }
    if (req.query.base) {
      query.find({base: req.query.base});
    }
    if (req.query.type) {
      query.find({type: req.query.type});
    }

    query.exec(function(err, services) {
      if (err) {
        return next(err);
      }

      res.json(manager.response.parseObjects(services));
    });
  });

  router.post('/', function(req, res, next) {
    // validate the information being given to me
    manager.request.post(req, function (err, body) {
      if (err) {
        return next(err);
      } else {
        // create the new entry
        Service.create(body, function(err, service) {
          if (err) {
            return next(err);
          } else {
            // return the entry with status 201
            res.status(201).json(manager.response.parseObject(service));
          }
        })
      }
    })
    
  });

  return router;
};

module.exports = GatewayRoutes;


