let express    = require('express'),
    bodyParser = require('body-parser'),
    config     = require('config');
let Haros      = require('../dist/gateway').GatewayService;

export class AppFactory {
  constructor(test) {
    this.test = test;
    this.database = config.get('database.url') + '_' + test;
  }

  get app() {
    const app = express();

    var haros = new Haros(null, {database: this.database});

    // TODO Test having middleware in there...
    // haros.use(passport.authenticate('jwt', { session: false}));
    haros.loadServices();
    app.use(haros.forward());

    // Add the body parsing only for locally handled APIs
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    /*
      Handling routes for managing the actual services is the job of the gateway service. 
    */
    app.use('/services', haros.routes());

    return app;
  }
}