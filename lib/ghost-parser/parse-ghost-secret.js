const got = require('got');
const cheerio = require('cheerio'); 
var log = require('npmlog')

var url = "http://hmdev.azurewebsites.net/ghost";

log.level = 'verbose';

log.verbose("got", "getting %s", url);

got(url)
	.then(response => {
		//console.log(response.body);
		//=> '<!doctype html> ...' 
          var $ = cheerio.load(response.body);
          log.verbose("parsing html content");
          var clientId = $("meta[name='env-clientId']").attr('content');
	      var clientSecret = $("meta[name='env-clientSecret']").attr('content');
          log.info("got","client_id=%s client_secret=%s", clientId, clientSecret);
    })
	.catch(error => {
		console.log(error.response.body);
		//=> 'Internal server error ...' 
	});
    
  log.verbose("after got?");