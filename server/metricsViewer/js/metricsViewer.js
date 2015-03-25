var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(app.router);

app.listen(8082);

app.post('/setMetric', function(req, res){

	try {
		var request = JSON.parse(JSON.stringify(req.body));
	} catch (e) {
		console.error("Parsing error:", e); 
	}
	
	angular.element(document.getElementById('metricsController')).scope().$apply(function(scope){
        scope.sessionId = request.session.id;
		if(request.session.uri) {
			scope.url = request.session.uri;
		}
		scope.currentBandwidth = request.encoding.current+' kb/s';
		scope.fps = request.condition.fps;
		scope.msgNumber = request.session.msgnbr;
		if(request.session.playerid){
			scope.playerId = request.session.playerid;
		}
		scope.currentPlayerState = request.state.current;
    });
	
	res.send(200);
	//document.getElementById('metrics').innerHTML += 'client '+request.session.id +' is watching '+request.session.provider+request.session.uri+' current playing bandwidth = '+request.encoding.current+'</br>';
		
});