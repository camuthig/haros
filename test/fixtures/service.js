var mongoose = require('mongoose');
exports.services = {
  service1:{
    _id: new mongoose.mongo.ObjectID("5767475d4f132cbaca88686b"),
    name: "New Service 1",
    type: "STATIC",
    base: "test1",
    retry: {
        enabled: false,
        retries: null,
        timeout: null,
        maxTimeout: null
    },
    static: {
        servers: [ 
            "http://localhost:3002"
        ]
    }
  },
  service2: {
    _id: new mongoose.mongo.ObjectID("574912355183c17ff2a6d2ff"),
    name: "New Service 2",
    type: "STATIC",
    base: "test2",
    retry: {
        enabled: false,
        retries: null,
        timeout: null,
        maxTimeout: null
    },
    static: {
        servers: [ 
            "http://localhost:3003"
        ]
    }
  }
}