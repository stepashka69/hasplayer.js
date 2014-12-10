/*
	http://selenium-release.storage.googleapis.com/2.43/selenium-server-standalone-2.43.0.jar
	http://chromedriver.storage.googleapis.com/2.9/chromedriver_win32.zip
	http://selenium-release.storage.googleapis.com/2.43/IEDriverServer_x64_2.43.0.zip
	*/

//java -jar selenium-server-standalone-2.43.0.jar -Dwebdriver.ie.driver=D:\selenium\IEDriverServer.exe -Dwebdriver.chrome.driver=D:\selenium\chromedriver.exe

// D:\FTRD\workspace\dash-js>node node_modules/intern/runner.js config=testIntern/intern

define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!leadfoot/helpers/pollUntil',
	'require', 
	'testIntern/config'
	], function(registerSuite, assert,pollUntil, require, config){

		var playDetection = function(){
			var videoNode = document.querySelector("video"),
			body = document.querySelector("body"),
			div = document.createElement("div"),
			playerTime = document.createElement("div");

			playerTime.id = 'playerTimeTest';
			div.id = 'functionalTestStatus';
			div.innerHTML = 'not playing';

			body.appendChild(div);
			body.appendChild(playerTime);

			var onContentPlay = function(){
				document.getElementById("functionalTestStatus").innerHTML = "playing";
			};

			videoNode.addEventListener("play", onContentPlay);
			videoNode.loop = true;

		};

		var command = null;

		var tests = function(i) {

			var url = config.testPage + "?url=" + config.live[i];

			registerSuite({
				name: 'Sequence of playing a live stream',

				'initTest': function() {
					console.log('INIT');
					command = this.remote.get(require.toUrl(url));

					return command.execute(playDetection).findById("functionalTestStatus").getVisibleText(function(text){
						assert.equal(text, "not playing");
					});

				},

				'contentPlaying': function(){
					console.log('PLAYING');
					return command.sleep(20000)
					.then(
						pollUntil(function(){
							var time = document.querySelector("video").currentTime;
							document.getElementById('playerTimeTest').innerHTML = time;
							
							var div = document.getElementById("functionalTestStatus");
							return div.innerHTML;
						},null,60000))
					.then(function(isOk){
						return assert.equal(isOk, "playing");
					});
				},

				'currentTimeDifferent':function(){
					console.log('STILL PLAYING AFTER 10 SECONDS');
					return command.sleep(10000)
					.then(
						pollUntil(function(){
							var currentTime = document.querySelector("video").currentTime,
								storedTime = parseInt(document.getElementById('playerTimeTest').innerHTML);
								
							return currentTime>=(storedTime+8);
						},null,100000))
					.then(function(test){
						return assert.ok(test,"the content is still playing after 10 seconds");
					});
				}

			});
};

var i = 0,
len = config.live.length;

for(i; i<len; i++) {
	tests(i);
}


});