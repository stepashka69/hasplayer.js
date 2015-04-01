var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var gui = require('nw.gui');

var app = express();

app.use(bodyParser.json());
app.use(app.router);

app.listen(8082);

var win = gui.Window.get();

win.on('loaded', function() {
  win.maximize();
});

//Testing MetricsAgent
app.get('/config', function(req, res){
	//console.log(req.query);
	res.json({"active": true});

	win.title += ' : collector connected';
});

app.post('/metricsDB', function(req, res){
	//not used
	
	res.send(200);
});

app.post('/metrics', function(req, res){

	try {
		var request = JSON.parse(JSON.stringify(req.body));
	} catch (e) {
		console.error("Parsing error:", e); 
	}
	
	angular.element(document.getElementById('metricsController')).scope().$apply(function(scope){
		var metric = {};
		
		scope.sessionId = request.session.id;
		
		if(!scope.firstMetricTime){
			scope.firstMetricTime = (new Date().getTime()/1000).toFixed(3); //show seconds value
			metric.timestamp = scope.firstMetricTime;
		}else {
			metric.timestamp = '+'+((new Date().getTime()/1000) - scope.firstMetricTime).toFixed(3)+' sec';
		}
		metric.type = request.type;
		
		switch(request.type) {
			//recurring message
			case 0 :
				scope.playerId = request.session.playerid;
				scope.url = request.session.uri;
				metric.wsize = request.condition.wsize;
				metric.fps = request.condition.fps;
				metric.droppedFrames = request.condition.fdc;
				scope.fullScreen = request.condition.full == 0? false : true;
				metric.currentPlayerState = request.state.current;	
				metric.currentBandwidth = request.encoding.current;
				break;
				//new state message
			case 1 :
				metric.currentPlayerState = request.state.current;
				metric.currentBandwidth = request.encoding.current;
				metric.wsize = request.condition.wsize;
				metric.fps = request.condition.fps;
				metric.droppedFrames = request.condition.fdc;
				//playerId and sessionId only send with the first new state metric
				scope.playerId = request.session.playerid != undefined ? request.session.playerid : scope.playerId;
				scope.url = request.session.uri != undefined ? request.session.uri : scope.url;
				scope.startupTime = request.startuptime+' sec.';
				scope.fullScreen = request.condition.full == 0? false: true;
				break;
				//metadata message
			case 2 : 	
				scope.mediaType = request.metadata.contenttype;
				scope.encodingFormat = request.metadata.encodingformat;
				scope.encapsulation = request.metadata.encapsulation;
				scope.contentDuration = request.metadata.contentduration != -1? request.metadata.contentduration+' sec.' : 'Infini';
				break;
				//change bitrate message
			case 3 : 
				metric.currentBandwidth	= request.encoding.current;
				metric.currentPlayerState = request.state.current;
				break;
				//error message
			case 10 : 	
				metric.errorCode = request.error.code;
				metric.errorMessage = request.error.message;
				metric.currentPlayerState = request.state.current;	
				metric.currentBandwidth = request.encoding.current;
				break;
		}
		
		metric.msgNbr = request.session.msgnbr;
		scope.metrics.push(metric);
    });
	
	res.send(200);	
});