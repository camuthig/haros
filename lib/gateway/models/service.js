// app/models/permission.js

var mongoose        = require('mongoose');
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
  replays: {
    type: [String]
  },
  servers: {
    type: [String],
    required: true
  }
}, {_id: false});

var RetrySchema = mongoose.Schema({
  enabled: {
    type: Boolean,
    required: true,
  },
  retries: {
    type: Number,
  },
  timeout: {
    type: Number,
  },
  maxTimeout: {
    type: Number,
  },
}, {_id: false});

var ServiceSchema = mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['STATIC', 'CONSUL'],
    required: true
  },
  base: {
    type: String,
    unique: true,
    required: true
  },
  retry: {
    type: RetrySchema,
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