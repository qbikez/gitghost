'use strict';


process.env.PATH += ";D:\\Program Files (x86)\\Git\\bin";
console.log("PATH=" + process.env.PATH);


/**
 * Error reporting
 */

const bugsnag = require('bugsnag');

bugsnag.register(process.env.BUGSNAG_API_KEY, {
  appVersion: require('./package.json').version,
  notifyReleaseStages: ['production', 'staging']
});

console.log("starting server.js");
console.log(process.version);
console.log(process.config);


/**
 * Dependencies
 */

const gitghost = require('./');


/**
 * Configuration
 */

const port = process.env.PORT || 3000;


/**
 * Start a server
 */

gitghost().listen(port);
