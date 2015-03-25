var express = require('express');
var bodyParser = require('body-parser');
var exec = require('child_process').exec,
    child;

var app = express();

// set path to the parent folder 
var dirname = __dirname.replace('server','..');

app.use(bodyParser.json());
app.use(app.router);

app.use(express.static(dirname));
app.listen(process.env.PORT || 8081);

app.post('/NetBalancerLimit', function(req, res){

	try {
		var request = JSON.parse(JSON.stringify(req.body));
	} catch (e) {
		console.error("Parsing error:", e); 
	}
	changeDownloadLimit(request.NetBalancerLimit.activate === 1? 'true':'false', request.NetBalancerLimit.upLimit,function (error, stdout, stderr) {
		if (error !== null) {
			console.log('---------exec error: ---------\n[' + error+']');
			res.send(404);
		}else{
			console.log('limit '+request.NetBalancerLimit.upLimit/125+' kb/s is activated');
			res.send(200);
		}
	});
});

function changeDownloadLimit(activate, limit, callback){
		child = exec('"D:\\Program Files\\NetBalancer\\nbcmd.exe" settings traffic limit '+activate+' false '+limit+' 0',callback);
};