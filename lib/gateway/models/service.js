// app/models/permission.js

var mongoose        = require('mongoose');
var bcrypt          = require('bcrypt-nodejs');
var Schema          = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

var ConsulSchema = mongoose.Schema({
  service: {
    type: String,
    required: true
  },
  servers: {
    type: [String],
    required: true
  },
  datacenter: {
    type: String
  },
  tag: {
    type: String
  },
  defaultServers: {
    type: [String]
  },
  transport: {
    type: String
  },
  timeout: {
    type: Number
  },
  interval: {
    type: Number
  },
  headers: {
    type: Schema.Types.Mixed
  },
  auth: {
    type: String
  }
}, {_id: false});

var StaticSchema = mongoose.Schema({
  forward: {
    type: String,
    required: true
  },
  replays: {
    type: [String]
  }
}, {_id: false});

var ServiceSchema = mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['static', 'consul'],
    required: true
  },
  base: {
    type: String,
    unique: true,
    required: true
  },
  consul: {
    type: ConsulSchema,
  },
  static: {
    type: StaticSchema
  }
}, { versionKey: false });

ServiceSchema.plugin(uniqueValidator, { message: 'Expected {PATH} to be unique.' });

module.exports = mongoose.model('Service', ServiceSchema);