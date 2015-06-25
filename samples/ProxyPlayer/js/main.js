'use strict';
// don't disable metrics...
var angular = angular;

angular.module('DashSourcesService', ['ngResource']).
factory('Sources', ['$resource', function($resource){
    return $resource('json/sources.json', {}, {
        query: {method:'GET', isArray:false}
    });
}]);

angular.module('DashNotesService', ['ngResource']).
factory('Notes', ['$resource', function($resource){
    return $resource('json/notes.json', {}, {
        query: {method:'GET', isArray:false}
    });
}]);

angular.module('DashContributorsService', ['ngResource']).
factory('Contributors', ['$resource', function($resource){
    return $resource('json/contributors.json', {}, {
        query: {method:'GET', isArray:false}
    });
}]);

angular.module('DashPlayerLibrariesService', ['ngResource']).
factory('PlayerLibraries', ['$resource', function($resource){
    return $resource('json/player_libraries.json', {}, {
        query: {method:'GET', isArray:false}
    });
}]);

angular.module('DashShowcaseLibrariesService', ['ngResource']).
factory('ShowcaseLibraries', ['$resource', function($resource){
    return $resource('json/showcase_libraries.json', {}, {
        query: {method:'GET', isArray:false}
    });
}]);

var app = angular.module('DashPlayer', [
    'DashSourcesService',
    'DashNotesService',
    'DashContributorsService',
    'DashPlayerLibrariesService',
    'DashShowcaseLibrariesService',
    'angularTreeview'
    ]);

app.controller('DashController', ['$scope', '$window', 'Sources', 'Notes','Contributors','PlayerLibraries','ShowcaseLibraries',
    function($scope, $window, Sources, Notes, Contributors, PlayerLibraries, ShowcaseLibraries) {

    var orangeHasPlayer,
        video,
        config = null,
        previousPlayedQuality = 0,
        previousDownloadedQuality= 0,
        metricsAgent = null,
        configMetrics = null,
        subtitlesCSSStyle = null;

    ////////////////////////////////////////
    //
    // Metrics
    //
    ////////////////////////////////////////

    $scope.videoBitrate = 0;
    $scope.videoIndex = 0;
    $scope.videoPendingIndex = "";
    $scope.videoMaxIndex = 0;
    $scope.videoBufferLength = 0;
    $scope.videoDroppedFrames = 0;
    $scope.videoWidth = 0;
    $scope.videoHeight = 0;
    $scope.videoCodecs = "-";

    $scope.audioBitrate = 0;
    $scope.audioIndex = 0;
    $scope.audioPendingIndex = "";
    $scope.audioMaxIndex = 0;
    $scope.audioBufferLength = 0;
    $scope.audioDroppedFrames = 0;
    $scope.audioCodecs = "-";

    $scope.streamTypes = ["HLS", "MSS", "DASH"];
    $scope.streamType = "MSS";

    $('#sliderAudio').labeledslider({
        max:0,
        step:1,
        orientation:'vertical',
        range:false,
        tickLabels: [],
    });

    var converter = new MetricsTreeConverter();
    $scope.videoMetrics = null;
    $scope.audioMetrics = null;
    $scope.audioTracks  = [];
    $scope.textTracks  = [];

    $scope.getVideoTreeMetrics = function () {
        var metrics = orangeHasPlayer.getMetricsFor("video");
        var metricsExt = orangeHasPlayer.getMetricsExt();
        $scope.videoMetrics = converter.toTreeViewDataSource(metrics,metricsExt);
    };

    $scope.getAudioTreeMetrics = function () {
        var metrics = orangeHasPlayer.getMetricsFor("audio");
        var metricsExt = orangeHasPlayer.getMetricsExt();
        $scope.audioMetrics = converter.toTreeViewDataSource(metrics,metricsExt);
    };

    // from: https://gist.github.com/siongui/4969449
    $scope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest')
            this.$eval(fn);
        else
            this.$apply(fn);
    };

    $scope.selectAudioTrack = function(track){
        orangeHasPlayer.setAudioTrack(track);
    };

    $scope.selectTextTrack = function(track){
        orangeHasPlayer.setSubtitleTrack(track);
    };

    function getCribbedMetricsFor(type) {
        var metrics = orangeHasPlayer.getMetricsFor(type),
        metricsExt = orangeHasPlayer.getMetricsExt(),
        repSwitch,
        bufferLevel,
        httpRequests,
        droppedFramesMetrics,
        bitrateIndexValue,
        bandwidthValue,
        pendingValue,
        numBitratesValue,
        bitrateValues,
        bufferLengthValue = 0,
        movingLatency = {},
        movingDownload = {},
        movingRatio = {},
        droppedFramesValue = 0,
        httpRequest,
        fillmoving = function(type, Requests){
            var requestWindow,
            downloadTimes,
            latencyTimes,
            durationTimes;

            requestWindow = Requests
            .slice(-20)
            .filter(function(req){return req.responsecode >= 200 && req.responsecode < 300 && !!req.mediaduration && req.type === "Media Segment" && req.stream === type;})
            .slice(-4);
            if (requestWindow.length > 0) {

                latencyTimes = requestWindow.map(function (req){ return Math.abs(req.tresponse.getTime() - req.trequest.getTime()) / 1000;});

                movingLatency[type] = {
                    average: latencyTimes.reduce(function(l, r) {return l + r;}) / latencyTimes.length,
                    high: latencyTimes.reduce(function(l, r) {return l < r ? r : l;}),
                    low: latencyTimes.reduce(function(l, r) {return l < r ? l : r;}),
                    count: latencyTimes.length
                };

                downloadTimes = requestWindow.map(function (req){ return Math.abs(req.tfinish.getTime() - req.tresponse.getTime()) / 1000;});

                movingDownload[type] = {
                    average: downloadTimes.reduce(function(l, r) {return l + r;}) / downloadTimes.length,
                    high: downloadTimes.reduce(function(l, r) {return l < r ? r : l;}),
                    low: downloadTimes.reduce(function(l, r) {return l < r ? l : r;}),
                    count: downloadTimes.length
                };

                durationTimes = requestWindow.map(function (req){ return req.mediaduration;});

                movingRatio[type] = {
                    average: (durationTimes.reduce(function(l, r) {return l + r;}) / downloadTimes.length) / movingDownload[type].average,
                    high: durationTimes.reduce(function(l, r) {return l < r ? r : l;}) / movingDownload[type].low,
                    low: durationTimes.reduce(function(l, r) {return l < r ? l : r;}) / movingDownload[type].high,
                    count: durationTimes.length
                };
            }
        };

        if (metrics && metricsExt) {
            repSwitch = metricsExt.getCurrentRepresentationSwitch(metrics);
            bufferLevel = metricsExt.getCurrentBufferLevel(metrics);
            httpRequests = metricsExt.getHttpRequests(metrics);
            droppedFramesMetrics = metricsExt.getCurrentDroppedFrames(metrics);

            fillmoving("video", httpRequests);
            fillmoving("audio", httpRequests);

            httpRequest = (httpRequests.length > 0) ? httpRequests[httpRequests.length - 1] : null;

            if (repSwitch !== null) {
                bitrateIndexValue = metricsExt.getIndexForRepresentation(repSwitch.to);
                bandwidthValue = metricsExt.getBandwidthForRepresentation(repSwitch.to);
                bandwidthValue = bandwidthValue / 1000;
                bandwidthValue = Math.round(bandwidthValue);
            }

            numBitratesValue = metricsExt.getMaxIndexForBufferType(type);
            bitrateValues = metricsExt.getBitratesForType(type);

            if (bufferLevel !== null) {
                bufferLengthValue = bufferLevel.level.toPrecision(5);
            }

            if (droppedFramesMetrics !== null) {
                droppedFramesValue = droppedFramesMetrics.droppedFrames;
            }

            if (isNaN(bandwidthValue) || bandwidthValue === undefined) {
                bandwidthValue = 0;
            }

            if (isNaN(bitrateIndexValue) || bitrateIndexValue === undefined) {
                bitrateIndexValue = 0;
            }

            if (isNaN(numBitratesValue) || numBitratesValue === undefined) {
                numBitratesValue = 0;
            }

            if (isNaN(bufferLengthValue) || bufferLengthValue === undefined) {
                bufferLengthValue = 0;
            }

            pendingValue = orangeHasPlayer.getQualityFor(type);
            return {
                bandwidthValue: bandwidthValue,
                bitrateIndexValue: bitrateIndexValue + 1,
                pendingIndex: (pendingValue !== bitrateIndexValue) ? "(-> " + (pendingValue + 1) + ")" : "",
                numBitratesValue: numBitratesValue,
                bitrateValues : bitrateValues,
                bufferLengthValue: bufferLengthValue,
                droppedFramesValue: droppedFramesValue,
                movingLatency: movingLatency,
                movingDownload: movingDownload,
                movingRatio: movingRatio,
                httpRequest: httpRequest
            };
        }
        else {
            return null;
        }
    }

    function onload(e){
        //init audio tracks
        $scope.audioTracks = orangeHasPlayer.getAudioTracks();
        $scope.audioData = $scope.audioTracks[0];
        //init subtitles tracks
        $scope.textTracks = orangeHasPlayer.getSubtitleTracks();
        $scope.textData = $scope.textTracks[0];
    }

    //if video size change, player has to update subtitles size
    function onFullScreenChange(){
        orangeHasPlayer.fullscreenChanged();
        setSubtitlesCSSStyle(subtitlesCSSStyle);
    }

    function onVolumeChange(){
        if ($scope.muteEnabled != orangeHasPlayer.getMute()) {
           $scope.muteEnabled = orangeHasPlayer.getMute();
        }else{
            $('#sliderVolume').labeledslider({value: (orangeHasPlayer.getVolume()*100)});
        }
    }

    function setSubtitlesCSSStyle(style){
        if (style) {
            var fontSize = style.data.fontSize;

            if (style.data.fontSize[style.data.fontSize.length-1] ==='%') {
                fontSize  = (video.clientHeight * style.data.fontSize.substr(0, style.data.fontSize.length-1))/100;
            }

            document.getElementById("cueStyle").innerHTML = '::cue{ background-color:'+style.data.backgroundColor+';color:'+style.data.color+';font-size: '+fontSize+'px;font-family: '+style.data.fontFamily+'}';
        }
    }

    function onSubtitlesStyleChanged(style) {
        subtitlesCSSStyle = style;
        setSubtitlesCSSStyle(subtitlesCSSStyle);
    }

    function metricChanged(e) {
        var metrics;

        if (e.data.stream == "video") {
            metrics = getCribbedMetricsFor("video");
            if (metrics) {
                $scope.videoBitrate = metrics.bandwidthValue;
                $scope.videoIndex = metrics.bitrateIndexValue;
                $scope.videoPendingIndex = metrics.pendingIndex;
                $scope.videoMaxIndex = metrics.numBitratesValue;
                $scope.videoBufferLength = metrics.bufferLengthValue;
                $scope.videoDroppedFrames = metrics.droppedFramesValue;

                if (metrics.movingLatency['video']) {
                    $scope.videoLatencyCount = metrics.movingLatency['video'].count;
                    $scope.videoLatency = metrics.movingLatency['video'].low.toFixed(3) + " < " + metrics.movingLatency['video'].average.toFixed(3) + " < " + metrics.movingLatency['video'].high.toFixed(3);
                }
                if (metrics.movingDownload['video']) {
                    $scope.videoDownloadCount = metrics.movingDownload['video'].count;
                    $scope.videoDownload = metrics.movingDownload['video'].low.toFixed(3) + " < " + metrics.movingDownload['video'].average.toFixed(3) + " < " + metrics.movingDownload['video'].high.toFixed(3);
                }
                if (metrics.movingRatio['video']) {
                    $scope.videoRatioCount = metrics.movingRatio['video'].count;
                    $scope.videoRatio = metrics.movingRatio['video'].low.toFixed(3) + " < " + metrics.movingRatio['video'].average.toFixed(3) + " < " + metrics.movingRatio['video'].high.toFixed(3);
                }

                if ($('#sliderBitrate').labeledslider( "option", "max" ) === 0) {
                    var labels = [];
                    for (var i = 0; i < metrics.bitrateValues.length; i++) {
                        labels.push(Math.round(metrics.bitrateValues[i] / 1000) + "k");
                    }

                    $('#sliderBitrate').labeledslider({ max: (metrics.numBitratesValue - 1), step: 1, values: [ 0, (metrics.numBitratesValue - 1 )], tickLabels: labels});
                    $('#sliderBitrate').labeledslider({stop: function( event, ui ) {
                        orangeHasPlayer.setParams( {
                            "video": {
                                "ABR.minQuality": ui.values[0],
                                "ABR.maxQuality": ui.values[1]
                            }
                        });
                    }});
                }

                // case of downloaded quality change
                if ((metrics.httpRequest !== null)  && (metrics.bitrateValues[metrics.httpRequest.quality] != previousDownloadedQuality)) {
                    previousDownloadedQuality = metrics.bitrateValues[metrics.httpRequest.quality];
            }
        }
    }

    if (e.data.stream == "audio") {
        metrics = getCribbedMetricsFor("audio");
        if (metrics) {

            $scope.audioBitrate = metrics.bandwidthValue;
            $scope.audioIndex = metrics.bitrateIndexValue;
            $scope.audioPendingIndex = metrics.pendingIndex;
            $scope.audioMaxIndex = metrics.numBitratesValue;
            $scope.audioBufferLength = metrics.bufferLengthValue;
            $scope.audioDroppedFrames = metrics.droppedFramesValue;
            if (metrics.movingLatency['audio']) {
                $scope.audioLatencyCount = metrics.movingLatency['audio'].count;
                $scope.audioLatency = metrics.movingLatency['audio'].low.toFixed(3) + " < " + metrics.movingLatency['audio'].average.toFixed(3) + " < " + metrics.movingLatency['audio'].high.toFixed(3);
            }
            if (metrics.movingDownload['audio']) {
                $scope.audioDownloadCount = metrics.movingDownload['audio'].count;
                $scope.audioDownload = metrics.movingDownload["audio"].low.toFixed(3) + " < " + metrics.movingDownload['audio'].average.toFixed(3) + " < " + metrics.movingDownload['audio'].high.toFixed(3);
            }
            if (metrics.movingRatio['audio']) {
                $scope.audioRatioCount = metrics.movingRatio['audio'].count;
                $scope.audioRatio = metrics.movingRatio['audio'].low.toFixed(3) + " < " + metrics.movingRatio['audio'].average.toFixed(3) + " < " + metrics.movingRatio['audio'].high.toFixed(3);
            }
        }
    }

    $scope.safeApply();
    }

    ////////////////////////////////////////
    //
    // Error Handling
    //
    ////////////////////////////////////////

    function onError(e) {
        console.error("an error has occured with error code = "+e.event.code);

        switch (e.event.code) {
            case "DOWNLOAD_ERR_MANIFEST" :
            case "DOWNLOAD_ERR_SIDX" :
            case "DOWNLOAD_ERR_CONTENT" :
            case "DOWNLOAD_ERR_INIT" :
                 console.error(" url :\""+e.event.data.url+"\" and request response :\""+ e.event.data.request.responseXML+"\"");
                 break;
            case "MANIFEST_ERR_CODEC" :
            case "MANIFEST_ERR_PARSE" :
            case "MANIFEST_ERR_NOSTREAM" :
                 console.error("Manifest URL was "+e.event.data.mpdUrl+" with message :\""+e.event.message+"\"");
                 break;
            case "CC_ERR_PARSE" :
                 console.error("message :\""+e.event.message+"\" for content = "+e.event.data);
                 break;
            default :
                 if (e.event.message) {
                    console.error("message :\""+e.event.message+"\"");
                 }
                 break;
        };

        if (e.event.code != "HASPLAYER_INIT_ERROR") {
            //stop
            orangeHasPlayer.reset();
        }
    }

    ////////////////////////////////////////
    //
    // Configuration file
    //
    ////////////////////////////////////////
    var reqConfig = new XMLHttpRequest();
    reqConfig.onload = function() {
        if (reqConfig.status === 200) {
            config = JSON.parse(reqConfig.responseText);
            if (orangeHasPlayer) {
                orangeHasPlayer.setParams(config);
            }
        }
    };
    reqConfig.open("GET", "hasplayer_config.json", true);
    reqConfig.setRequestHeader("Content-type", "application/json");
    reqConfig.send();

    ////////////////////////////////////////
    //
    // Player Setup
    //
    ////////////////////////////////////////

    video = document.querySelector(".dash-video-player video");

    orangeHasPlayer = new OrangeHasPlayer(video);

    $scope.version = orangeHasPlayer.getVersion();
    $scope.versionHAS = orangeHasPlayer.getVersionHAS();
    $scope.versionFull = orangeHasPlayer.getVersionFull();
    $scope.buildDate = orangeHasPlayer.getBuildDate();

    orangeHasPlayer.addEventListener("error", onError.bind(this));
    orangeHasPlayer.addEventListener("metricChanged", metricChanged.bind(this));
    orangeHasPlayer.addEventListener("subtitlesStyleChanged",onSubtitlesStyleChanged.bind(this));
    orangeHasPlayer.addEventListener("loadeddata", onload.bind(this));
    orangeHasPlayer.addEventListener("fullscreenchange", onFullScreenChange.bind(this));
    orangeHasPlayer.addEventListener("mozfullscreenchange", onFullScreenChange.bind(this));
    orangeHasPlayer.addEventListener("webkitfullscreenchange", onFullScreenChange.bind(this));
    orangeHasPlayer.addEventListener("volumechange", onVolumeChange.bind(this));
    
    orangeHasPlayer.setAutoPlay(true);
    orangeHasPlayer.setDebug(false);
    
    if (config) {
        orangeHasPlayer.setParams(config);
    }

    ////////////////////////////////////////
    //
    // Player Methods
    //
    ////////////////////////////////////////
    
    resetVolumeSlider();

    $scope.abrEnabled = true;

    $scope.setAbrEnabled = function (enabled) {
        $scope.abrEnabled = enabled;
        player.setAutoSwitchQuality(enabled);
    };

    $scope.muteEnabled = orangeHasPlayer.getMute();

    $scope.setMuteEnabled = function (enabled) {
        $scope.muteEnabled = enabled;
        orangeHasPlayer.setMute(enabled);
    };

    $scope.abrUp = function (type) {
        var newQuality,
        metricsExt = orangeHasPlayer.getMetricsExt(),
        max = metricsExt.getMaxIndexForBufferType(type);

        newQuality = orangeHasPlayer.getQualityFor(type) + 1;
        // zero based
        if (newQuality >= max) {
            newQuality = max - 1;
        }
        orangeHasPlayer.setQualityFor(type, newQuality);
    };

    $scope.abrDown = function (type) {
        var newQuality = orangeHasPlayer.getQualityFor(type) - 1;
        if (newQuality < 0) {
            newQuality = 0;
        }
        orangeHasPlayer.setQualityFor(type, newQuality);
    };

    $scope.playbackRateUp = function () {

        if (video.playbackRate === 64.0) {
            return;
        }

        video.playbackRate = video.playbackRate * 2;
        $scope.playbackRate = "x" + video.playbackRate;
        orangeHasPlayer.setAutoSwitchQuality(false);
        orangeHasPlayer.setQualityFor('video', 0);
    };

    $scope.playbackRateDown = function () {

        if (video.playbackRate === 1.0) {
            return;
        }

        video.playbackRate = video.playbackRate / 2;
        $scope.playbackRate = "x" + video.playbackRate;

        if (video.playbackRate === 1.0) {
            orangeHasPlayer.setAutoSwitchQuality(true);
        }
    };

    ////////////////////////////////////////
    //
    // Metrics Agent Setup
    //
    ////////////////////////////////////////

    $scope.metricsAgentAvailable = (typeof MetricsAgent == 'function') ? true : false;
    $scope.metricsAgentActive = false;

    $scope.setMetricsAgent = function (value) {
        $scope.metricsAgentActive = value;
        if (typeof MetricsAgent == 'function') {
            if ($scope.metricsAgentActive) {
                metricsAgent = new MetricsAgent(player, video, $scope.selected_metric_option, player.getDebug());
                $scope.metricsAgentVersion = metricsAgent.getVersion();
                metricsAgent.init(function (activated) {
                    $scope.metricsAgentActive = activated;
                    console.log("Metrics agent state: ", activated);
                    setTimeout(function (){
                        $scope.$apply();
                    }, 500);
                    if (activated === false) {
                        alert("Metrics agent not available!");
                    }
                });
            } else if (metricsAgent) {
                metricsAgent.stop();
            }
        }
    };


    ////////////////////////////////////////
    //
    // Metrics Agent Configuration
    //
    ////////////////////////////////////////
    if ($scope.metricsAgentAvailable) {
        configMetrics = [
            {"name": "csQoE (local)",
             "activationUrl":"http://localhost:8080/config",
             "serverUrl":"http://localhost:8080/metrics",
             "dbServerUrl":"http://localhost:8080/metricsDB",
             "collector":"HasPlayerCollector",
             "formatter":"CSQoE",
             "sendingTime": 10000
            }];
        $scope.configMetrics = configMetrics;
        $scope.selected_metric_option = $scope.configMetrics[0];

        var reqMA = new XMLHttpRequest();
        reqMA.onload = function () {
            if (reqMA.status === 200) {
                configMetrics = JSON.parse(reqMA.responseText);
                $scope.configMetrics = configMetrics.items;
                $scope.selected_metric_option = $scope.configMetrics[0];
            }
        };
        reqMA.open("GET", "./metricsagent_config.json", true);
        reqMA.setRequestHeader("Content-type", "application/json");
        reqMA.send();
    }

    $scope.setMetricOption = function (metricOption) {
        $scope.selected_metric_option = metricOption;
        console.log($scope.selected_metric_option.name);
    };


    ////////////////////////////////////////
    //
    // Page Setup
    //
    ////////////////////////////////////////

    $scope.selectStreams = function () {
        $scope.availableStreams = $scope.streams.filter(function(item) {
            return (item.type === $scope.streamType);
        });
    };

    function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
        return vars;
    }

    // Get url params...
    var vars = getUrlVars(),
    browserVersion,
    filterValue;

    if (vars && vars.hasOwnProperty("version")) {
        browserVersion = vars.version;
    }
    else {
        browserVersion = "stable";
    }

    switch(browserVersion) {
        case "beta":
        filterValue = "b";
        break;
        case "canary":
        filterValue = "c";
        break;
        case "dev":
        filterValue = "d";
        break;
        case "explorer":
        filterValue = "i";
        break;
        case "all":
        filterValue = "a";
        break;
        case "stable":
        default:
        filterValue = "s";
        break;
    }

    $scope.isStreamAvailable = function (str) {
        if (filterValue === "a") {
            return true;
        }
        else {
            return (str.indexOf(filterValue) != -1);
        }
    };

    if(window.jsonData === undefined) {
        Sources.query(function (data) {
            $scope.streams = data.items;
            $scope.selectStreams();
        });

        Notes.query(function (data) {
            $scope.releaseNotes = data.notes;
        });

        Contributors.query(function (data) {
            $scope.contributors = data.items;
        });

        PlayerLibraries.query(function (data) {
            $scope.playerLibraries = data.items;
        });

        ShowcaseLibraries.query(function (data) {
            $scope.showcaseLibraries = data.items;
        });
    } else {
        $scope.streams = window.jsonData.sources.items;
        $scope.releaseNotes = window.jsonData.notes.notes;
        $scope.contributors = window.jsonData.contributors.items;
        $scope.playerLibraries = window.jsonData.player_libraries.items;
        $scope.showcaseLibraries = window.jsonData.showcase_libraries.items;
        $scope.selectStreams();
    }


    $scope.setStreamType = function (item) {
        $scope.streamType = item;
        $scope.availableStreams = $scope.streams.filter(function(item) {
            return (item.type === $scope.streamType);
        });
    };

    $scope.setStream = function (item) {
        $scope.selectedItem = item;
    };

    function resetBitratesSlider () {
        $('#sliderBitrate').labeledslider({
            max: 0,
            step: 1,
            values: [0],
            tickLabels: [],
            orientation: 'vertical',
            range: true,
            stop: function(evt, ui) {
                orangeHasPlayer.setConfig({
                    "video": {
                        "ABR.minQuality": ui.values[0],
                        "ABR.maxQuality": ui.values[1]
                    }
                });
            }
        });
    }

    function resetVolumeSlider () {
        $('#sliderVolume').labeledslider({
            min: 0,
            max: 100,
            step: 10,
            value: (orangeHasPlayer.getVolume()*100) ,
            orientation: 'horizontal',
            range: 'min',
            stop: function(evt, ui) {
                orangeHasPlayer.setVolume(ui.value/100);
            }
        });
    }

    function initPlayer() {

        function DRMParams() {
            this.backUrl = null;
            this.customData = null;
        }

        resetBitratesSlider();

        //ORANGE : reset subtitles data.
        $scope.textTracks = null;
        $scope.textData = null;

        // ORANGE: reset ABR controller
        //orangeHasPlayer.setQualityFor("video", 0);
        //orangeHasPlayer.setQualityFor("audio", 0);

        $scope.playbackRate = "x1";
        orangeHasPlayer.load($scope.selectedItem.url, $scope.selectedItem.protData);
    }

    $scope.doLoad = function () {
        if ((typeof MetricsAgent == 'function') && ($scope.metricsAgentActive)) {
            metricsAgent.createSession();
        }

        initPlayer();
    };

    $scope.doStop = function(){
        orangeHasPlayer.stop();
    };

    $scope.doPlay = function(){
        orangeHasPlayer.play();
    };

    $scope.hasLogo = function (item) {
        return (item.hasOwnProperty("logo") && item.logo !== null && item.logo !== undefined && item.logo !== "");
    };

    // Get initial stream if it was passed in.
    var paramUrl = null;

    if (vars && vars.hasOwnProperty("url")) {
        paramUrl = vars.url;
    }

    if (vars && vars.hasOwnProperty("mpd")) {
        paramUrl = vars.mpd;
    }

    if (paramUrl !== null) {
        var startPlayback = true;

        $scope.selectedItem = {};
        $scope.selectedItem.url = paramUrl;

        if (vars.hasOwnProperty("autoplay")) {
            startPlayback = (vars.autoplay === 'true');
        }

        if (startPlayback) {
            $scope.doLoad();
        }
    }
}]);
