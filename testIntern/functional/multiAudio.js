define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!leadfoot/helpers/pollUntil',
	'require', 
	'testIntern/config'
	], function(registerSuite, assert,pollUntil, require, config){

		var playDetection = function(matchTrack1, matchTrack2){

			var videoNode = document.querySelector("video"),
			body = document.querySelector("body"),
			div = document.createElement("div"),
			audioDiv = document.createElement("div"),
			player = window.player,
			track1 = new RegExp(matchTrack1),
			track2 = new RegExp(matchTrack2);

			audioDiv.id = "functionalTestAudio";
			div.id = "functionalTestStatus";
			div.innerHTML = "not playing";

			body.appendChild(div);
			body.appendChild(audioDiv);

			var onContentPlay = function(){
				document.getElementById("functionalTestStatus").innerHTML = "playing";
			};

			var getAudioTrack = function (e) {

				if(e && e.data.stream === 'audio' && e.data.value.url) {
					var audio = e.data.value.url;

					if(track1.test(audio)) {
						document.getElementById("functionalTestAudio").innerHTML = "track1";
					} else if(track2.test(audio)) {
						document.getElementById("functionalTestAudio").innerHTML = "track2";
					} else {
						document.getElementById("functionalTestAudio").innerHTML = "no match";
					}
				}
				
			};

			videoNode.addEventListener("play", onContentPlay);
			videoNode.loop = true;

			player.addEventListener("metricUpdated", getAudioTrack, false);

		};

		var command = null;

		var tests = function(i) {

			var changeAudioTrack = function() {
				var player = window.player,
				audioDatas = player.getAudioTracks();

				player.setAudioTrack(audioDatas[1]);
			};

			var url = "../../samples/DemoPlayer/index.html?url=" + config.multiAudio[i][0];

			registerSuite({
				name: 'Multi Audio',

				'initTest': function() {
					console.log('INIT');
					command = this.remote.get(require.toUrl(url));

					return command.execute(playDetection, [config.multiAudio[i][1], config.multiAudio[i][2]]).findById("functionalTestStatus").getVisibleText(function(text){
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

				'checkAudioTrack1': function(){
					console.log('CHECK IF AUDIO TRACK IS THE FIRST ONE');

					return command.sleep(5000)
					.then(
						pollUntil(function(){
							var div = document.getElementById("functionalTestAudio");
							return div.innerHTML;
						},null,60000))
					.then(function(isOk){
						return assert.equal(isOk, "track1");
					});
				},

				'checkAudioTrack2': function(){
					console.log('CHANGE AUDIO TRACK TO THE SECOND ONE');
					command.execute(changeAudioTrack);

					return command.sleep(10000)
					.then(
						pollUntil(function(){
							var div = document.getElementById("functionalTestAudio");
							return div.innerHTML;
						},null,60000))
					.then(function(isOk){
						return assert.equal(isOk, "track2");
					});
				},

			});
};

var i = 0,
len = config.multiAudio.length;


for(i; i<len; i++) {
	tests(i);
}

});