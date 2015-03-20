var express = require('express');
var phantom = require('phantom');
var bodyParser = require('body-parser');
var csv = require('express-csv');
var fs = require('fs');
var exec = require('child_process').exec,
    child;

var app = express();

// var port =  process.env.PORT || 3000;

// set path to the parent folder 
var dirname = __dirname.replace('server','..');

app.set('views', __dirname + '/export-pdf');
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');

app.use(bodyParser.json());
app.use(app.router);

app.use(express.static(dirname));
app.listen(process.env.PORT || 8080);

//tableau de données d'export pdf
var database = {};

app.get('/pdf', function(req, res) {

	var metrics = JSON.parse(JSON.stringify(database[req.query.id]));

	if(req.query.showBandwidth !== 'true') {
		metrics.calcBandwidthSeries = [];
	}

	var data = JSON.stringify(metrics);
	res.render('pdf', {bandwidth: data} );
});

app.get('/export-csv', function(req, res) {

	res.setHeader('Content-disposition', 'attachment; filename=sample.csv');


	//Adding provenance for PlaySeries & NetBalancer & Bandwidth
	var i = 0,
	csvData = null,
	playSeriesName = 'Player',
	playSeries = JSON.parse(JSON.stringify(database[req.query.id].requestSeries)),
	playSeriesLength = playSeries.length,
	y = 0,
	netBalancerSeriesName = 'NetBalancer',
	netBalancerSeries = JSON.parse(JSON.stringify(database[req.query.id].dataSequence)),
	netBalancerSeriesLength = netBalancerSeries.length,
	z = 0,
	calcBandwidthSeriesName = 'Bandwidth',
	calcBandwidthSeries = JSON.parse(JSON.stringify(database[req.query.id].calcBandwidthSeries)),
	calcBandwidthSeriesLength = calcBandwidthSeries.length;

	for(i; i < playSeriesLength; i++) {
		console.log(playSeries[i]);
	}

	for(i; i < playSeriesLength; i++) {
		playSeries[i].unshift(playSeriesName);
	}

	for(y; y < netBalancerSeriesLength; y++) {
		netBalancerSeries[y].unshift(netBalancerSeriesName);
	}

	for(z; z< calcBandwidthSeriesLength; z++) {
		calcBandwidthSeries[z].unshift(calcBandwidthSeriesName);
		calcBandwidthSeries[z][1] = calcBandwidthSeries[z][1] + 0.001;
	}

	if(req.query.showBandwidth === 'true') {
		csvData = playSeries.concat(netBalancerSeries, calcBandwidthSeries);
	} else {
		csvData = playSeries.concat(netBalancerSeries);
	}
	
	//Sorting all arrays of datas
	csvData.sort(function(a, b){
		console.log(a);
		return a[1]-b[1];
	});

	res.csv(csvData);
});

app.get('/export-pdf', function(req, res) {
	phantom.create(function (ph) {
		ph.createPage(function (page) {
			page.setViewportSize(1680, 1050);
			page.setZoomFactor(5);

			var url = 'http://localhost:8080/pdf?id='+req.query.id+'&showBandwidth='+req.query.showBandwidth;

			function doRender() {
				page.render('export-pdf/result.pdf');
				console.log('Export PDF effectué');

				setTimeout(function(){
					res.sendfile("export-pdf/result.pdf");
				}, 500);

				ph.exit();
			}
			
			page.open(url, function (status) {
				setTimeout(doRender, 1000);
			});

		});
	});
});

app.post('/chart-db', function(req, res){

	//reinit du tableau de données
	database  = {};

	//ajout d'un index dans le tableau de données d'export pdf
	var id = new Date().getTime();
	database[id] = req.body;

	res.json({"id": id});
});



//Testing MetricsAgent
app.get('/config', function(req, res){
	//console.log(req.query);
	res.json({"active": true});

	// Create a file for new session
	fs.writeFileSync("metrics.json", "### " + new Date().toString() + "\n");

	// Create a file for new session
	fs.writeFileSync("metricsDB.json", "### " + new Date().toString() + "\n");
});

app.post('/metrics', function(req, res){
	//console.log(req.body);

	res.send(204);

	// Append message to file
	var fd = fs.openSync("metrics.json", 'a+');
	fs.writeSync(fd, "### " + new Date().toString() + "\n");
	fs.writeSync(fd, JSON.stringify(req.body, null, '\t') + "\n");
	fs.closeSync(fd);
});

app.post('/metricsDB', function(req, res){
	//console.log(req.body);

	res.send(204);

	// Append message to file
	var fd = fs.openSync("metricsDB.json", 'a+');
	fs.writeSync(fd, "### " + new Date().toString() + "\n");
	fs.writeSync(fd, JSON.stringify(req.body, null, '\t') + "\n");
	fs.closeSync(fd);
});

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
			console.log('limit '+request.NetBalancerLimit.upLimit+' is activated');
			res.send(200);
		}
	});
});

function changeDownloadLimit(activate, limit, callback){
		child = exec('"C:\\Program Files\\NetBalancer\\nbcmd.exe" settings traffic limit '+activate+' false '+limit+' 0',callback);
};