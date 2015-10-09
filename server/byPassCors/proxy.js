var request = require("request"),
    net = require("net"),
    url = require("url"),
    http = require("http");

var PORT=3129;
var proxy= {
    protocol:"http",
    host:"p-goodway",
    port:3128};


// catch all uncaught exception and log them
var logError = function(e){
    'use strict';
    console.warn('***', e);
};
process.on('uncaughtException', logError);


// server initialisation
var server = http.createServer(function(req,res){
                'use strict';
                console.info("req.url", req.url);
                var options = {};
                options.url = url.parse(req.url);
                options.method = req.method;
                options.headers = req.headers;
                //options.proxy = proxy.protocol+"://"+proxy.host+":"+proxy.port;
                var serverRequest = request(options);
                serverRequest.on("response", function(response){
                    //  res.writeHead(200,{
                    //    "Access-Control-Allow-Origin":"*",
                    //    "Access-Control-Allow-Methods" : "GET,PUT,POST,DELETE",
                    //    "Access-Control-Allow-Credential":true
                    // });
                    response.headers["Access-Control-Allow-Origin"] = "*";
                    response.headers["Access-Control-Allow-Methods"] ="GET,PUT,POST,DELETE";
                    response.headers["Access-Control-Allow-Headers"] ="content-type,soapaction,X_WASSUP_PULV,X_WASSUP_DSN,X_WASSUP_PULO,X_WASSUP_SAU,X_WASSUP_SAI,X_WASSUP_NAT,X_WASSUP_ROAMING,X_WASSUP_MSISDN,X_WASSUP_PUIT,X_WASSUP_BEARER,X_WASSUP_SPR,Client-IP,X-Forwarded-For";
                    // response.headers["Access-Control-Allow-Credential"] =true;
                });
                serverRequest.on("error", function(e){
                    console.error(e);
                });
                req.pipe(serverRequest);
                serverRequest.pipe(res);
               
            }).listen(PORT);

// enable HTTPS threw socket communication
server.on("connect",function(req,socket, reqHead){
    'use strict';
    
    //open a TCP connection to the remote host
    var options = {
        port:proxy.port,
        host:proxy.host,
        strictSSL: false
    };
    //options.proxy = proxy;
    var conn = net.connect(options, function() {
        // respond to the client that the connection was made
        socket.write('HTTP/' + req.httpVersion + ' 200 Connection Established\r\n' +'Proxy-agent: Node-Proxy\r\n' + '\r\n');
        conn.write(reqHead);
        //socket.write("HTTP/1.1 200 OK\r\n\r\n");
        // create a tunnel between the two hosts
        socket.pipe(conn);
        conn.pipe(socket);

    });
})
.on("error", function(){
    'use strict';
    console.info("error on connect", arguments.length, this);
}.bind(this));

console.log("PROXY started on port ", PORT, "with proxy", proxy);