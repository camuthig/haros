import {MongoLoader} from './seeder';
import {AppFactory} from './server';

export class SpecRunner {
  constructor(test) {
    this.loader = new MongoLoader('services', __dirname + '/fixtures'),
    this.app    = new AppFactory('services').app;
  }

  getLoader() {
    return this.loader;
  }

  getApp() {
    return this.app;
  }
}