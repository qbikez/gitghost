'use strict';

/**
 * Dependencies
 */

const exec = require('mz/child_process').execFile;
const fs = require('mz/fs');


/**
 * Expose fn
 */

module.exports = gitInit;


/**
 * Init a bare repository
 */

function gitInit (path) {
  console.log("gitInit: checking path" + path + "'");
  return fs.stat(path)
    .catch(function () {
      console.log("gitInit: running 'git init --bare " + path + "'");
      return exec('git', ['init', '--bare', path]);
    });
}
