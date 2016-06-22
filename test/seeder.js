let config = require('config');
let mongoose = require('mongoose');

export class MongoLoader {
  constructor(db, dir) {
    this.dir = dir;
    this.db = db;
    this.url = config.get('database.url') + '_' + this.db;
    this.loader = require('pow-mongodb-fixtures').connect(this.url);

  }

  load(done) {
    this.loader.load(this.dir, done);
  }

  clear(done) {
    this.loader.clear(done);
  }

  drop(done) {
    mongoose.connect(this.url,() =>{
      mongoose.connection.db.dropDatabase(done);
    });
  }
}