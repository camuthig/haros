# Haros

This is a package to create a thin wrapper around [Rocky proxy](https://github.com/h2non/rocky). It also includes Connect/Express based API routes for managing the services.

## How to Use It in Express

1. Install the package

	```
	npm install --save camuthig/haros
	```

1. Add and configure Haros in your app

	```javascript
	# app.js
	var config              = require('config');
	
	...
	
	// Create an instance of the Haros Gateway
	var haros = new Haros(null, {database: config.get('database.url')});
	
	// Add any middleware you want to be on all of your forwarded services
	haros.use(passport.authenticate('jwt', { session: false}));
	
	// Load the services
	haros.loadServices();
	
	// Add the forwards to your Express app
	// BE SURE TO ADD THIS TO THE APP BEFORE ADDING THINGS LIKE BODY PARSER
	// YOU WANT TO BE SURE THE REQUEST IS UNALTERED BEFORE PASSING IT ALONG
	app.use(haros.forward);
	
	// Add the body parsing only for locally handled APIs
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	
	// Add the routes for managing services
	app.use('/services', passport.authenticate('jwt', { session: false}), haros.routes());
	
	...
	
	```
## Future Improvements and To Do's

1. Get some unit tests in there
1. Add Consul support for forwarded services
1. Add metrics tracking
1. Add throttling
1. Add circuit breaking, retry and other behaviors great for forwarding to microservices
1. Add access control for forwarded services (meh, not sure I like this idea)
1. Clean up real time forwarding information (currently in memory, but that doesn't scale horizontally)
