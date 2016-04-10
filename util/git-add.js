'use strict';

/**
 * Dependencies
 */

const exec = require('mz/child_process').execFile;


/**
 * Expose fn
 */

module.exports = gitAdd;


/**
 * Add and commit new files (if any)
 */

function gitAdd (path, message) {
  let options = {
    cwd: path
  };
  console.log("gitAdd: running 'git add .' on path '"+path+"'");
  return exec('git', ['add', '.'], options)
    .then(function () {
      console.log("gitAdd: running 'git add -u' on path '"+path+"'");
      return exec('git', ['add', '-u'], options);
    })
    .then(function () {
      console.log("gitAdd: running 'git commit' on path '"+path+"'");
      return exec('git', ['commit', '-m', message], options).catch(function (error) {
          console.log("gitAdd: exception: " + error);
//          console.error(error);
      });
    });
}
