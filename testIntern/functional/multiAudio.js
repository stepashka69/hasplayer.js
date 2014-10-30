define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!leadfoot/helpers/pollUntil',
	'require', 
	'testIntern/config'
	], function(registerSuite, assert,pollUntil, require, config){

		var playDetection = function(){

			var videoNode = document.querySelector("video");
			var body = document.querySelector("body");
			var div = document.createElement("div");
			var audioDiv = document.createElement("div");
			var player = window.player;
			var german = /audio102_deu/,
			french = /audio101_fra/;

			audioDiv.id = "functionalTestAudio";
			div.id = "functionalTestStatus";
			div.innerHTML = "not playing";

			body.appendChild(div);
			body.appendChild(audioDiv);

			var onContentPlay = function(){
				document.getElementById("functionalTestStatus").innerHTML = "playing";
			};

			videoNode.addEventListener("play", onContentPlay);
			videoNode.loop = true;

			var getAudioTrack = function (e) {

				if(e && e.data.stream === 'audio' && e.data.value.url) {
					var audio = e.data.value.url;

					if(french.test(audio)) {
						document.getElementById("functionalTestAudio").innerHTML = "french";
					} else if(german.test(audio)) {
						document.getElementById("functionalTestAudio").innerHTML = "german";
					}
				}
			};

			player.addEventListener("metricUpdated", getAudioTrack, false);

		};

		

		var command = null;

		var tests = function(i) {

			var changeAudioTrack = function() {
				var player = window.player;
				var audioDatas = player.getAudioTracks();
				
				player.setAudioTrack(audioDatas[1]);
			};

			var url = "../../samples/DemoPlayer/index.html?url=" + config.multiAudio[i];

			registerSuite({
				name: 'Multi Audio',

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

				'checkAudioFrench': function(){
					console.log('CHECK IF AUDIO TRACK IS FRENCH');

					return command.sleep(5000)
					.then(
						pollUntil(function(){
							var div = document.getElementById("functionalTestAudio");
							return div.innerHTML;
						},null,60000))
					.then(function(isOk){
						return assert.equal(isOk, "french");
					});
				},

				'checkAudioGerman': function(){
					console.log('CHANGE AUDIO TRACK TO GERMAN');
					command.execute(changeAudioTrack);

					return command.sleep(5000)
					.then(
						pollUntil(function(){
							var div = document.getElementById("functionalTestAudio");
							return div.innerHTML;
						},null,60000))
					.then(function(isOk){
						return assert.equal(isOk, "german");
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