'use strict';

/**
 * Dependencies
 */

const promisify = require('pify');
const tempfile = require('tempfile');
const exec = require('mz/child_process').execFile;
const join = require('path').join;
const rm = promisify(require('rimraf'));
const mv = promisify(require('mv'));


/**
 * Expose fn
 */

module.exports = workingToBare;


/**
 * Convert working repository to bare
 */

function workingToBare (path) {
  let tmpPath = tempfile();
  console.log("workingToBare: moving '" + path + "' to '" + tmpPath+ "'");
  return mv(path, tmpPath)
    .then(function () {
      var p1 = join(tmpPath, '.git');
      console.log("workingToBare: moving '" + p1 + "' to '" + path + "'");
      return mv(p1, path);
    })
    .then(function () {
      let options = {
        cwd: path
      };
      console.log("workingToBare: running 'git config --local --bool core.bare true'");
      return exec('git', ['config', '--local', '--bool', 'core.bare', 'true'], options);
    })
    .then(function () {
      console.log("workingToBare: removing '" + tmpPath + "'");
      return rm(tmpPath);
    })
    .catch(function(reason) {
       console.log("workingToBare: ERROR:" + reason);
       throw reason; 
    });
}
