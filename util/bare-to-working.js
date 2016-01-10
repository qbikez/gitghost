'use strict';

/**
 * Dependencies
 */

const promisify = require('pify');
const tempfile = require('tempfile');
const exec = require('mz/child_process').execFile;
const join = require('path').join;
const mv = promisify(require('mv'));


/**
 * Expose fn
 */

module.exports = bareToWorking;


/**
 * Convert bare repository to working
 */

function bareToWorking (path) {
  let tmpPath = tempfile();

  console.log("bareToWorking: moving '" + path + "' to '" + tmpPath + "'");
  return mv(path, tmpPath)
    .then(function () {
      var p1 = join(path, '.git');
      console.log("bareToWorking: moving '" + tmpPath + "' to '" + p1+ "'");
      return mv(tmpPath, p1, { mkdirp: true });
    })
    .then(function () {
      let options = {
        cwd: path
      };
      console.log("bareToWorking: running 'git config --local --bool core.bare false'");
      return exec('git', ['config', '--local', '--bool', 'core.bare', 'false'], options);
    })
    .then(function () {
      let options = {
        cwd: path
      };
      console.log("bareToWorking: running 'git reset --hard' with cwd='"+path+"'");
      return exec('git', ['reset', '--hard'], options);
    })
    .catch(function(reason) {
       console.log("bareToWorking: ERROR:" + reason);
       throw reason; 
    });
}
