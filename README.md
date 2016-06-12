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
	
	// Add the routes for managing services
	app.use('/services', passport.authenticate('jwt', { session: false}), haros.routes());
	
	...
	
	```
