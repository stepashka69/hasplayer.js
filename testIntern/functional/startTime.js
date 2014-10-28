define([
	"intern!object",
	"intern/chai!assert",
	'intern/dojo/node!leadfoot/helpers/pollUntil',
	"require"], function(registerSuite, assert,pollUntil, require){

		var url = "../../samples/DemoPlayer/index.html?url=http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest#s=50";

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
			name: 'Seek at start',

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

			'currentTimeDifferentAfterSeekAtStart':function(){
				console.log('STILL PLAYING');
				return command.sleep(10000)
				.then(
					pollUntil(function(){
						return document.querySelector("video").currentTime;
					},null,100000))
				.then(function(time){
					return assert.ok(time>=60,"the content is still playing after the seek at start at 50 seconds and playing for 20 seconds");
				});
			}


		});

});