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
	var config     = require('config');
	var Haros      = require('../dist/gateway').GatewayService;
	
	...
	
	// Create an instance of the Haros Gateway
	// You can add middleware to be executed on forwarded calls instead of null
	// The second argument are the Haros opts.
	// Currently the only supported (and required) option is "database", which should be
	// a valid MongoDB URL.
	var haros = new Haros(null, {database: 'mongodb://localhost:27017/haros_test'});
	
	// Add any additional middleware you want to be on all of your forwarded services
	haros.use(passport.authenticate('jwt', { session: false}));
	
	// Load the services
	haros.loadServices();
	
	// Add the forwards to your Express app
	// BE SURE TO ADD THIS TO THE APP BEFORE ADDING THINGS LIKE BODY PARSER
	// YOU WANT TO BE SURE THE REQUEST IS UNALTERED BEFORE PASSING IT ALONG
	app.use(haros.forward());
	
	// Add the body parsing only for locally handled APIs
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	
	// Add the routes for managing services
	app.use('/services', passport.authenticate('jwt', { session: false}), haros.routes());
	
	...
	
	```

## Service Management APIs

The services APIs can be set to be reachable via any given Express route. For the below examples, we will assume they are set up under `/services`, like in the example configuration.

All management APIs fit within the [JSON API specification](jsonapi.org) and fall under the type `service`.

### Showing Services

#### List all Services

##### Request
```
GET /services
```

##### Response
```
Status: 200

{
  "data": [
    {
      "id": "574912355183c17ff2a6d2ff",
      "type": "service",
      "attributes": {
        "name": "Old Name",
        "type": "STATIC",
        "base": "test",
        "retry": {
          "enabled": false,
          "retries": null,
          "timeout": null,
          "maxTimeout": null
        },
        "static": {
          "servers": [
            "http://localhost:3001"
          ]
        }
      }
    },
    {
      "id": "576b53a9cc22f73e73856410",
      "type": "service",
      "attributes": {
        "name": "Consul Service",
        "type": "CONSUL",
        "base": "myconsul",
        "retry": {
          "enabled": false,
          "retries": null,
          "timeout": null,
          "maxTimeout": null
        },
        "consulConfiguration": {
          "servers": [
            "http://localhost:32769"
          ],
          "service": "nginx-80",
          "dataCenter": "aws-east",
          "tag": "1.0"
        }
      }
    }
  ]
}
```

#### Get a single Service

##### Request
```
GET /service/:id
```

##### Response
```
Status: 200

{
  "data": {
    "id": "574912355183c17ff2a6d2ff",
    "type": "service",
    "attributes": {
      "name": "Old Name",
      "type": "STATIC",
      "base": "test",
      "retry": {
        "enabled": false,
        "retries": null,
        "timeout": null,
        "maxTimeout": null
      },
      "static": {
        "servers": [
          "http://localhost:3001"
        ]
      }
    }
  }
}
```

### Creating Services

#### Request
```
POST /service

{
  "data": {
    "type": "service",
    "attributes": {
      "name": "Old Name",
      "type": "STATIC",
      "base": "test",
      "retry": {
        "enabled": false,
        "retries": null,
        "timeout": null,
        "maxTimeout": null
      },
      "static": {
        "servers": [
          "http://localhost:3001"
        ]
      }
    }
  }
}
```

#### Response
```
Status: 201

{
  "data": {
    "id": "574912355183c17ff2a6d2ff",
    "type": "service",
    "attributes": {
      "name": "Old Name",
      "type": "STATIC",
      "base": "test",
      "retry": {
        "enabled": false,
        "retries": null,
        "timeout": null,
        "maxTimeout": null
      },
      "static": {
        "servers": [
          "http://localhost:3001"
        ]
      }
    }
  }
}
```

### Updating Services

Per JSON API specification, only provided values will be updated. Nulls will be accepted and set the given attribute to null.

#### Request
```
PATCH /service/:id

{
  "data": {
    "type": "service",
    "attributes": {
      "name": "New Name",
    }
  }
}
```

#### Response
```
Status: 200

{
  "data": {
    "id": "574912355183c17ff2a6d2ff",
    "type": "service",
    "attributes": {
      "name": "New Name",
      "type": "STATIC",
      "base": "test",
      "retry": {
        "enabled": false,
        "retries": null,
        "timeout": null,
        "maxTimeout": null
      },
      "static": {
        "servers": [
          "http://localhost:3001"
        ]
      }
    }
  }
}
```

### Deleting Services

#### Request
```
DELETE /service/:id
```

#### Response
```
Status: 204
```

## Future Improvements and To Do's

1. Get some *more* tests in there (test the forwarding)
1. ~Add Consul support for forwarded services~ (Do need to add some tests maybe though...)
1. Add some pages to go on top of management routes
1. Add metrics tracking
1. ~Add retry/back-off~
1. Add circuit breaking
1. Add access control for forwarded services (meh, not sure I like this idea)
1. Clean up real time forwarding information (currently in memory, but that doesn't scale horizontally)
1. Add throttling