var express = require('express');
var phantom = require('phantom');
var bodyParser = require('body-parser');

var app = express();

// var port =  process.env.PORT || 3000;

// set path to the parent folder 
var dirname = __dirname.replace('server','');

app.set('views', __dirname + '/export-pdf');
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');

app.use(bodyParser.json());
app.use(app.router);

console.log(dirname);
app.use(express.static(dirname));
app.listen(process.env.PORT || 8080);

//tableau de données d'export pdf
var database = {};

app.get('/pdf', function(req, res) {
	var data = JSON.stringify(database[req.query.id]);
	res.render('pdf', {bandwidth: data} );
});

app.post('/chart', function(req, res){
	
	phantom.create(function (ph) {
		ph.createPage(function (page) {

			//ajout d'un index dans le tableau de données d'export pdf
			var id = new Date().getTime();
			database[id] = req.body;
			
			page.setHeaders({
				"Content-Type": "application/json"
			});

			page.open("http://localhost:8080/pdf?id="+id, function () {
				
				//timeout pour laisser le js coté front charger le graph highchart
				setTimeout(function(){
					page.render('export-pdf/result.pdf');
					console.log('Export PDF effectué');

					//reinit du tableau de données
					database  = {};

					ph.exit();
					res.send(200);
				}, 1000);
				
			});
		});
	});
	
});
