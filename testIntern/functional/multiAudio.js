define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!leadfoot/helpers/pollUntil',
	'require', 
	'testIntern/config'
	], function(registerSuite, assert, pollUntil, require, config){

		var command = null;
		var videoCurrentTime = 0;
		var audioTracks = null;

		var getAudioTracks = function () {
			audioTracks = window.player.getAudioTracks();
			return audioTracks;
		};

		var setAudioTrack = function (track) {
			window.player.setAudioTrack(track);
		};

		var getVideoCurrentTime = function () {
			return document.querySelector("video").currentTime;
		};

		var test_init = function(stream) {

			var url = config.testPage + "?url=" + stream;

			registerSuite({
				name: 'Test multi-audio functionnality',

				'Initialize the test': function() {
					console.log("[TEST_MULTI-AUDIO] stream: " + stream);

					command = this.remote.get(require.toUrl(url));
					
					return command.execute(getVideoCurrentTime)
					.then(function(time) {
						videoCurrentTime = time;
						console.log("[TEST_MULTI-AUDIO] current time = " + videoCurrentTime);
						//console.log("Before getAudioTracks call "+new Date().toLocaleTimeString());
					})
					.execute(getAudioTracks)
					.then(function (tracks) {
						if (tracks) {
							//console.log("After getAudioTracks call "+new Date().toLocaleTimeString());
							for (var i = 0; i < tracks.length; i++) {
								console.log("[TEST_MULTI-AUDIO] audioTrack["+i+"].id = " + tracks[i].id);
							}
						}
					});
				},

				'Check playing': function() {
					console.log('[TEST_MULTI-AUDIO] Wait 5s ...');

					return command.sleep(5000)
					.execute(getVideoCurrentTime)
					.then(function (time) {
						console.log("[TEST_MULTI-AUDIO] current time = " + time);
						assert.ok(time > videoCurrentTime);
						videoCurrentTime = time;
					});
				}
			});
		};


		var test_setAudioTrack = function(track) {

			registerSuite({
				name: 'Test multi audio functionnality',

				'Set audio track': function() {

					console.log('[TEST_MULTI-AUDIO] set audio track ' + track.id);

					return command.execute(setAudioTrack, [track])
					.then(pollUntil(
						function (urlPattern) {
							// Check if new track has been activated
							// 1 - Get the metrics for audio track
							// 2 - Check if last audio segment url contains the provided pattern
							var metrics = window.player.getMetricsFor("audio"),
								metricsExt = window.player.getMetricsExt(),
								httpRequests = metricsExt.getHttpRequests(metrics);

							if (httpRequests.length === 0) {
								return false;
							}

							return httpRequests[httpRequests.length-1].url.indexOf(urlPattern) > 0 ? true : null;
						}, [track.urlPattern], 10000, 1000))
					.then(function () {
						assert.ok(true, "");
					}, function (error) {
						assert.ok(false, "[TEST_MULTI-AUDIO] Failed to change audio track");
					});
				},

				'Check playing': function() {
					console.log('[TEST_MULTI-AUDIO] Wait 5s ...');

					return command.sleep(5000)
					.execute(getVideoCurrentTime)
					.then(function (time) {
						var delay = time - videoCurrentTime;
						console.log("[TEST_MULTI-AUDIO] current time = " + time + " (" + Math.round(delay*100)/100 + ")");
						//assert.ok(delay >= 4.5);
						assert.ok(time > videoCurrentTime);
					});
				}
			});
		};

		var i, j;

		for (i = 0; i < config.multiAudio.length; i++) {
			test_init(config.multiAudio[i].stream);
			for (j = 0; j < config.multiAudio[i].tracks.length; j++) {
				test_setAudioTrack(config.multiAudio[i].tracks[j]);
			}
		}

});