'use strict';

/**
 * Error reporting
 */

const bugsnag = require('bugsnag');

bugsnag.register(process.env.BUGSNAG_API_KEY, {
  appVersion: require('./package.json').version,
  notifyReleaseStages: ['production', 'staging']
});


/**
 * Configuration
 */

const port = process.env.PORT || 3000;


console.log("starting server.js at port " + port);
console.log(process.version);
//console.log(process.config);


/**
 * Dependencies
 */

const gitghost = require('./');




/**
 * Start a server
 */

gitghost().listen(port);
