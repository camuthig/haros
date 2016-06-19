import {ServiceRepo, ServiceQuery} from './repo/service';
import {NotFoundError} from './error/gateway';
import {ServiceFactory} from './services/service';
import {ServiceResponse} from './services/ServiceResponse';
// var ServiceRepo = require('./repo/service').ServiceRepo;
var _       = require('lodash');
var express = require('express');
var router = express.Router();
var Service = require('./models/service');
var Request = require('./request');
var Response = require('../json');

function GatewayRoutes(gateway){
  this.type = 'service';
  this.request = new Request(this.type);
  this.response = new ServiceResponse();

  this.gateway = gateway;

  this.repo = new ServiceRepo();
};

GatewayRoutes.prototype.routes = function() {
  var manager = this;

  router.patch('/:id', function(req, res, next) {
    /*
      So the order I am thinking about is:
        1. Find the service
        2. Validate the input of the request
        3. Update the values of the service "merge" function basically
        4. Persist the changes
        5. Return the new object

      So not sure if all of the "Update" classes are needed, but it seems like a yes
    */
    manager.repo.findById(req.params.id).then(
      function(service) {
        manager.request.patch(req, function(err, body) {
          if (err) {
            return next(err);
          }

          var factory = new ServiceFactory();
          var uService = factory.merge(service, body);

          manager.repo.update(uService).then(
            function(service) {
              return res.json(manager.response.toJson(service));
            },
            function(err) {
              return next(err);
            });
        });

      },
      function(err) {
        next(err);
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
    manager.repo.findById(req.params.id).then(
      function(service) {
        res.json(manager.response.toJson(service));
      },
      function(err) {
        return next(err);
      });
  });

  /* GET services listing. */
  router.get('/', function(req, res, next) {
    var query = new ServiceQuery(
      req.query.q || null,
      req.query.name || null,
      req.query.base || null,
      req.query.type || null
    );

    manager.repo.find(query).then(
      function(services) {
        res.json(manager.response.toJson(services));
      },
      function(err) {
        return next(err);
      });
  });

  router.post('/', function(req, res, next) {
    // validate the information being given to me
    manager.request.post(req, function (err, service) {
      if (err) {
        return next(err);
      }

      manager.repo.create(service).then(
        function(service) {
          return res.status(201).json(manager.response.toJson(service));
        },
        function(err) {
          return next(err);
        }
      );
    });
    
  });

  return router;
};

module.exports = GatewayRoutes;


