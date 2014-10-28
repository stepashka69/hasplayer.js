/*
	http://selenium-release.storage.googleapis.com/2.43/selenium-server-standalone-2.43.0.jar
	http://chromedriver.storage.googleapis.com/2.9/chromedriver_win32.zip
	http://selenium-release.storage.googleapis.com/2.43/IEDriverServer_x64_2.43.0.zip
	*/

//java -jar selenium-server-standalone-2.43.0.jar -Dwebdriver.ie.driver=D:\selenium\IEDriverServer.exe -Dwebdriver.chrome.driver=D:\selenium\chromedriver.exe

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

			var onContentPlay = function(){
				document.getElementById("functionalTestStatus").innerHTML = "playing";
			};

			videoNode.addEventListener("play", onContentPlay);
			videoNode.loop = true;


		};

		var command = null;

		registerSuite({
			name: 'Sequence of play, seek and loop',

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
						var div = document.getElementById("functionalTestStatus");
						return div.innerHTML;
					},null,60000))
				.then(function(isOk){
					return assert.equal(isOk, "playing");
				});
			},

			'currentTimeDifferent':function(){
				console.log('STILL PLAYING');
				return command.sleep(10000)
				.then(
					pollUntil(function(){
						return document.querySelector("video").currentTime;
					},null,100000))
				.then(function(time){
					return assert.ok(time>=10,"the content is still playing after 10 seconds");
				});
			},

			'contentSeek': function() {
				console.log('SEEKING');
				return command.sleep(10000)
				.then(
					pollUntil(function() {
						document.querySelector("video").currentTime = 5;
						return document.querySelector("video").currentTime;
					}, null, 20000))
				.then(function(time) {
					return assert.ok(time<7 && time>=5,"The seek to second 5 was successful");
				});
			},

			'contentStillPlayingAfterSeek':function(){
				console.log('STILL PLAYING');
				return command.sleep(10000)
				.then(
					pollUntil(function(){
						return document.querySelector("video").currentTime;
					},null,100000))
				.then(function(time){
					return assert.ok(time>10 && time<25,"the content is still playing after the seek");
				});
			},

			'contentSeekForLoop':function(){
				console.log('SEEK 5s BEFORE THE END');
				return command.sleep(10000)
				.then(
					pollUntil(function(){
						var video = document.querySelector("video");
						video.currentTime = video.duration - 5;
						return video.currentTime;
					},null,100000))
				.then(function() {
					return assert.ok(true, 'seek before the end for loop testing');
				});
			},

			'contentStillPlayingAfterLoop':function(){
				console.log('STILL PLAYING AFTER LOOP');
				return command.sleep(25000)
				.then(
					pollUntil(function(){
						return document.querySelector("video").currentTime;
					},null,100000))
				.then(function(time){
					console.log(time);
					return assert.ok(time<25,"the content is still playing with the loop param");
				});
			}


		});

});