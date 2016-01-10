'use strict';

/**
 * Dependencies
 */

const promisify = require('pify');
const basename = require('path').basename;
const format = require('util').format;
const crypto = require('crypto');
const ghost = require('ghost-api');
const each = require('array-generators').forEach;
const join = require('path').join;
const rm = promisify(require('rimraf'));
const fs = require('mz/fs');

const redis = require('./redis');

const bareToWorking = require('../util/bare-to-working');
const workingToBare = require('../util/working-to-bare');
const getHeadCommit = require('../util/get-head-commit');
const parsePost = require('../util/parse-post');
const gitDiff = require('../util/git-diff');
const upload = require('../util/upload-directory');
const sleep = require('sleep').sleep;

/**
 * Expose fn
 */

module.exports = push;


/**
 * git push
 */

function * push () {
  let self = this;
  let host = this.repo.replace('.git', '');
  let path = this.cwd;
  var req = this.request;
   var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;
  console.log('push to ' + host + ' from client ' + ip);

  this.write('-----> git:ghost is receiving push');

  
  // create a ghost api client for this blog
  let client = ghost(host);

  // authorize a client
   yield client.auth(this.request.user.email, this.request.user.password, 
  this.request.clientId, this.request.clientSecret);

  this.write('       blog: http://' + host);

  // get HEAD commit from the previous repository state
  // key is the md5ed blog host
  let key = crypto.createHash('md5').update(host).digest('hex');
  
  console.log("getting redis commit");
  let commit = yield redis.get(key);
  console.log("redis: " + key + "=" + commit);
  
  console.log("doing gitDiff");
  // diff between current HEAD and last known HEAD
  let diff = yield gitDiff(path, commit, 'HEAD');
  console.log("sleep 1");
  sleep(1);
  // convert to repo with a working tree
  // to easily read files
  yield bareToWorking(path).catch(function(err) {
    console.log("sleep 3");
    sleep(3);
    bareToWorking(path);
  });
  try {
  console.log("parsing diff: " + JSON.stringify(diff));
  // create/update/delete posts
  yield each(diff, function * (file) {
    console.log("processing diff file " + JSON.stringify(file));
    let filePath = join(path, file.path);
    let slug = basename(file.path, '.md');
    console.log("processing diff path: " + filePath + " slug: " + slug);
    if (file.isAdded) {
      let post = yield createPost(client, filePath);
      console.log('New post "' + post.title + '"');
      
      self.write('-----> New post "' + post.title + '"');
      self.write('       status: ' + post.status);
      self.write('       slug: ' + slug);

      if (post.status === 'published') {
        self.write('       url: http://' + host + '/' + slug + '/');
      }
    }

    if (file.isModified) {
      let post = yield updatePost(client, filePath);
      console.log('Updated post "' + post.title + '"');
    
      self.write('-----> Updated post "' + post.title + '"');
      self.write('       status: ' + post.status);
      self.write('       slug: ' + slug);

      if (post.status === 'published') {
        self.write('       url: http://' + host + '/' + slug + '/');
      }
    }

    if (file.isDeleted) {
      let post = yield deletePost(client, filePath);
      console.log('Deleting post "' + post.title + '"');
      
   
      self.write('-----> Deleted post "' + post.title + '"');
    }
  });

  }
  catch(err) {
      console.log("push: ERROR:" + err);
      throw err; 
  }
  finally {
    // convert back to bare repository
    // to ensure same state
    console.log("converting back to bare");
    yield workingToBare(path);
  }

  console.log("getting head commit");

  // save current HEAD
  commit = yield getHeadCommit(path);

  yield redis.set(key, commit);

  // save repository to S3
  let remotePath = format('/%s.tar.gz', host);
  yield upload(path, remotePath);

  // remove repository
  // yield rm(path);

  this.write('-----> All done!');
  this.write('-----> Blog url: http://' + host);
  this.write('-----> Admin url: http://' + host + '/ghost');

  this.done();
}


/**
 * Helpers
 */

function createPost (client, path) {
  return fs.readFile(path, 'utf-8')
    .then(function (source) {
      let post = parsePost(source);

      post.slug = basename(path, '.md');
      post.status = post.status || 'draft';

      return client.posts.create(post);
    });
}

function deletePost (client, path) {
  let slug = basename(path, '.md');

  return client.posts.findOne(slug)
    .then(function (post) {
      return client.posts.destroy(post.id);
    });
}

function updatePost (client, path) {
  let slug = basename(path, '.md');
  let id;

  return client.posts.findOne(slug)
    .then(function (post) {
      id = post.id;

      return fs.readFile(path, 'utf-8');
    })
    .then(function (source) {
      let post = parsePost(source);

      post.status = post.status || 'draft';

      return client.posts.update(id, post);
    });
}
