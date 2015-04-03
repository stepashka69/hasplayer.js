var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var exec = require('child_process').exec;
var child;

var app = express();

// set path to the parent folder 
var dirname = __dirname.replace('server','..');

// Set NetBalancer traffic limit
var SetNetBalancerTrafficLimit = function (activate, limit, callback) {
	child = exec('"C:\\Program Files\\NetBalancer\\nbcmd.exe" settings traffic limit ' + activate + ' false ' + (limit / 8) + ' 0',callback);
};

app.use(bodyParser.json());
app.use(app.router);
app.use(express.static(dirname));
app.use(cors);
app.listen(process.env.PORT || 8081);

// Enable CORS for all request
app.all('/*', cors(), function(req, res, next) {
  next();
});

// POST bandwidth limitation
app.post('/NetBalancerLimit', cors(), function(req, res) {
	var request;

	console.log('POST /NetBalancerLimit');

	res.setHeader('Acces-Control-Allow-Origin', '*');

	try {
		request = JSON.parse(JSON.stringify(req.body));
		//console.log('request = ', request);
	} catch (e) {
		console.error("Parsing error:", e);
	}

	SetNetBalancerTrafficLimit(
		request.NetBalancerLimit.activate,
		request.NetBalancerLimit.upLimit,
		function (error/*, stdout, stderr*/) {
			if (error !== null) {
				console.log('---------exec error: ---------\n[' + error+']');
				res.send(404);
			} else {
				if(request.NetBalancerLimit.activate)
				{
					console.log('limit ' + (request.NetBalancerLimit.upLimit / 1000) + ' kb/s is activated');
				}else {
					console.log('limit is disabled');
				}
				res.send(200);
			}
		}
	);
});
