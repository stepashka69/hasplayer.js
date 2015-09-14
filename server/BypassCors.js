var http = require("http"),
	net = require("net"),
	url = require("url"),
	port = 3129;

function logError(e){
	console.warn('*** ' + e);
}
process.on('uncaughtException', logError);

var agent = new http.Agent({
	maxSockets:Infinity
});


var server = http.createServer(function(req,res){
				console.info("HTTP : ",req.url);
				var options = url.parse(req.url);
				options.method = req.method;
				options.headers = req.headers;
				options.agent = agent;

				var serverRequest = http.request(options);
				req.pipe(serverRequest);
				serverRequest.on("response",function(serverResponse){
					console.log("response for",req.url);
					res.setHeader("Access-Control-Allow-Origin","*");
					res.setHeader("Access-Control-Allow-Credential","true");
					res.writeHead(serverResponse.statusCode,serverResponse.headers);
					return serverResponse.pipe(res);
				}).on("error",function(error){
					res.writeHead(502);
					return res.end();
				});

				// res.setHeader("Access-Control-Allow-Origin","*");
				// res.setHeader("Access-Control-Allow-Credential","true");
				// req.pipe(r(req.url)).pipe(res);
				
			}).listen(port);

server.addListener("connect",function(req,socket,head){
	console.info("HTTPS : ",req.url);
	var parts = req.url.split(':', 2);
	// open a TCP connection to the remote host
	var conn = net.connect(parts[1], parts[0], function() {
		// respond to the client that the connection was made
		socket.write("HTTP/1.1 200 OK\r\n\r\n");
		// create a tunnel between the two hosts
		socket.pipe(conn);
		conn.pipe(socket);

	});
});

