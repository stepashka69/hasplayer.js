//java -jar selenium-server-standalone-2.43.1.jar -Dwebdriver.ie.driver=D:\FTRD\selenium\IEDriverServer_x64_2.43.0\IEDriverServer.exe -Dwebdriver.chrome.driver=D:\FTRD\selenium\chromedriver_win32\chromedriver.exe

// D:\FTRD\workspace\dash-js>node node_modules/intern/runner.js config=testIntern/intern

define([
	"intern!object",
	"intern/chai!assert",
	'intern/dojo/node!leadfoot/helpers/pollUntil',
	"require"], function(registerSuite, assert,pollUntil, require){

		var url = "../../samples/DemoPlayer/index.html?url=http://2is7server1.rd.francetelecom.com/VOD/BBB-SD/big_buck_bunny_1080p_stereo.ism/Manifest";

		var playDetection = function(){
			var videoNode = document.querySelector("video");
			var body = document.querySelector("body");
			var div = document.createElement("div");
			div.id = "functionalTestStatus";
			div.innerHTML = "not playing";

			body.appendChild(div);

			var onContentPlay = function(evt){
				document.getElementById("functionalTestStatus").innerHTML = "playing";
			};

			videoNode.addEventListener("play", onContentPlay);


		}

		var command = null;

		registerSuite({
			name: 'Dash-IF (functional)',

			'initTest': function() {
				command = this.remote.get(require.toUrl(url));

				return command.execute(playDetection).findById("functionalTestStatus").getVisibleText(function(text){
					assert.equal(text, "not playing");
				});
				
			},

			'contenPlaying': function(){
					return command.sleep(20000)
								.then(
									pollUntil(function(){
										var div = document.getElementById("functionalTestStatus");
										return div.innerHTML;
										},null,60000))
								.then(function(isOk){
										return assert.equal(isOk, "playing");
								});
			},

			'currentTimeDifferent':function(){
					this.timeout = 1200000;
				return command.sleep(60000)
							// .findByTagName("video").getAttribute("currentTime").then(function(time){
							// 	assert.equal(time,50000);
							// 	return assert.ok(time>=60000,"the content is read since 1 minute");
							// });
							.then(
								pollUntil(function(){
									return document.querySelector("video").currentTime;
								},null,100000))
							.then(function(time){
								return assert.ok(time>60,"the content is read since 1 minute");
							})
			}

			


	});

});