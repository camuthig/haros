import validate from 'validate.js';
import {ValidationError} from '../error/gateway';

export class Retry {
  constructor(enabled, retries, timeout, maxTimeout) {

    this.enabled = enabled;
    if (enabled === undefined || enabled === null) {
      this.enabled = false;
    }
    if (!validate.isBoolean(this.enabled)) {
      throw new ValidationError('enabled must be a boolean');
    }

    this.retries = retries;
    this.timeout = timeout;
    this.maxTimeout = maxTimeout;
  }
}