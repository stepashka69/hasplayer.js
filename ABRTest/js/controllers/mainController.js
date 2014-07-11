angular.module('HASPlayer').controller('MainController', function($scope, $timeout, $routeParams, $location, $window, fluxService, graphService) {
    var player,
    video,
    context,
    videoSeries = [],
    dlSeries = [],
    playSeries = [],
    requestSeries = [],
    calcBandwidthSeries = [],
    audioSeries = [],
    qualityChangements = [],
    previousPlayedQuality = 0,
    previousDownloadedQuality= 0,
    maxGraphPoints = 50,
    firstAccess = true,
    updateInterval = 333,
    updating = null,
    previousRequest = null;

    $scope.data = {};
    $scope.selectedItem = {};

    //UI Actions
    var setFlux = function(list) {
        var i = 0,
            len = list.length;

        for(i; i< len; i++) {
            if(list[i].name === $routeParams.selectedFlux) {
                return list[i];
            }
        }
        return list[0];
    };

    fluxService.getList().then(function(data) {
        $scope.data.fluxList = data;
        $scope.selectedItem = setFlux($scope.data.fluxList);
        $scope.doLoad();
    });

    //Version Choice
    fluxService.getVersion().then(function(data) {
        $scope.data.versionList = data;

        var i = 0,
            len = $scope.data.versionList.length;

        for(i; i<len; i++) {
            var pattern = new RegExp($scope.data.versionList[i].id);
            if(pattern.test($location.absUrl())) {
                $scope.selectedVersion = $scope.data.versionList[i].id;
            }
        }
    });

    $scope.redirectFlux = function(selectedFlux) {
        $location.path(selectedFlux.name);
        $window.location.href= $location.absUrl();
        $scope.doLoad();
    };

    $scope.redirectVersion = function(selectedVersion) {
        $window.location.href = selectedVersion + '#' + $location.path();
    };



    //Player INIT
    function initMetrics() {

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


        $scope.optionsBandwidthGrid = null;
        
        // reinit charts
        // assign an empty array is not working... why ? reference in bufferData ?
        videoSeries.splice(0, videoSeries.length);
        audioSeries.splice(0, audioSeries.length);
        dlSeries.splice(0, dlSeries.length);
        playSeries.splice(0, playSeries.length);

        firstAccess=true;
    }

    $scope.videoMetrics = null;
    $scope.audioMetrics = null;
    $scope.audioTracks  = [];

    function getCribbedMetricsFor(type) {
        var metrics = player.getMetricsFor(type),
        metricsExt = player.getMetricsExt(),
        repSwitch,
        bufferLevel,
        httpRequest,
        droppedFramesMetrics,
        bitrateIndexValue,
        bandwidthValue,
        pendingValue,
        numBitratesValue,
        bitrateValues,
        bufferLengthValue = 0,
        lastFragmentDuration,
        lastFragmentDownloadTime,
        droppedFramesValue = 0,
        videoWidthValue = 0,
        videoHeightValue = 0,
        codecsValue,
        dwnldSwitch,
        calcBandwidth;

        if (metrics && metricsExt) {
            repSwitch = metricsExt.getCurrentRepresentationSwitch(metrics);
            bufferLevel = metricsExt.getCurrentBufferLevel(metrics);
            httpRequest = metricsExt.getCurrentHttpRequest(metrics);
            droppedFramesMetrics = metricsExt.getCurrentDroppedFrames(metrics);

            dwnldSwitch = metricsExt.getCurrentDownloadSwitch(metrics);
            calcBandwidth = metricsExt.getCurrentBandwidth(metrics);

            if (repSwitch !== null) {
                bitrateIndexValue = metricsExt.getIndexForRepresentation(repSwitch.to);
                bandwidthValue = metricsExt.getBandwidthForRepresentation(repSwitch.to);
                bandwidthValue = bandwidthValue / 1000;
                bandwidthValue = Math.round(bandwidthValue);
                videoWidthValue = metricsExt.getVideoWidthForRepresentation(repSwitch.to);
                videoHeightValue = metricsExt.getVideoHeightForRepresentation(repSwitch.to);
                codecsValue = metricsExt.getCodecsForRepresentation(repSwitch.to);

                var codecsInfo = metricsExt.getH264ProfileLevel(codecsValue);
                if (codecsInfo !== "")
                {
                    codecsValue += " (" + codecsInfo + ")";
                }
            }

            numBitratesValue = metricsExt.getMaxIndexForBufferType(type);
            bitrateValues = metricsExt.getBitratesForType(type);

            if (bufferLevel !== null) {
                bufferLengthValue = bufferLevel.level.toPrecision(5);
            }

            if (httpRequest !== null) {
                lastFragmentDuration = httpRequest.mediaduration;
                lastFragmentDownloadTime = httpRequest.tresponse.getTime() - httpRequest.trequest.getTime();

                // convert milliseconds to seconds
                lastFragmentDownloadTime = lastFragmentDownloadTime / 1000;
                lastFragmentDuration = lastFragmentDuration.toPrecision(4);
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

            pendingValue = player.getQualityFor(type);

            return {
                httpRequest: httpRequest,
                bandwidthValue: bandwidthValue,
                bitrateIndexValue: bitrateIndexValue + 1,
                pendingIndex: (pendingValue !== bitrateIndexValue) ? "(-> " + (pendingValue + 1) + ")" : "",
                numBitratesValue: numBitratesValue,
                bitrateValues : bitrateValues,
                bufferLengthValue: bufferLengthValue,
                droppedFramesValue: droppedFramesValue,
                videoWidthValue: videoWidthValue,
                videoHeightValue: videoHeightValue,
                codecsValue: codecsValue,
                dwnldSwitch: dwnldSwitch,
                calcBandwidth: calcBandwidth
            };
        }
        else {
            return null;
        }
    }

    function update() {
        var metrics;

        metrics = getCribbedMetricsFor("video");

        if (metrics && metrics.dwnldSwitch) {
            $scope.videoBitrate = metrics.bandwidthValue;
            $scope.videoIndex = metrics.bitrateIndexValue;
            $scope.videoPendingIndex = metrics.pendingIndex;
            $scope.videoMaxIndex = metrics.numBitratesValue;
            $scope.videoBufferLength = metrics.bufferLengthValue;
            $scope.videoDroppedFrames = metrics.droppedFramesValue;
            $scope.videoCodecs = metrics.codecsValue;
            $scope.videoWidth = metrics.videoWidthValue;
            $scope.videoHeight = metrics.videoHeightValue;

            // case of downloaded quality changmement
            if (metrics.bitrateValues[metrics.dwnldSwitch.quality] != previousDownloadedQuality) {
                // save quality changement for later when video currentTime = mediaStartTime
                qualityChangements.push({
                    mediaStartTime : metrics.dwnldSwitch.mediaStartTime,
                    switchedQuality : metrics.bitrateValues[metrics.dwnldSwitch.quality],
                    downloadStartTime : metrics.dwnldSwitch.downloadStartTime
                });
                previousDownloadedQuality = metrics.bitrateValues[metrics.dwnldSwitch.quality];
            }
            
            for (var p in qualityChangements) {
                var currentQualityChangement = qualityChangements[p];
                //time of downloaded quality changement !
                if (currentQualityChangement.downloadStartTime <= video.currentTime) {
                    previousDownloadedQuality = currentQualityChangement.switchedQuality;
                }

                // time of played quality changement !
                if (currentQualityChangement.mediaStartTime <= video.currentTime) {
                    previousPlayedQuality = currentQualityChangement.switchedQuality;
                    qualityChangements.splice(p,1);
                }
            }

            if(metrics.httpRequest !== null) {

                if(previousRequest !== metrics.httpRequest.url) {
                    requestSeries.push([video.currentTime, Math.round(previousDownloadedQuality/1000)])
                    if(metrics.calcBandwidth !== null && metrics.calcBandwidth.value < 10000) {
                        calcBandwidthSeries.push([video.currentTime, metrics.calcBandwidth.value]);
                    }
                }

                previousRequest = metrics.httpRequest.url;
            }

            
            
            var dlPoint = [video.currentTime, Math.round(previousDownloadedQuality/1000)];
            dlSeries.push(dlPoint);

            if(playSeries.length < 1) {
               var playPoint = [video.currentTime, Math.round(previousPlayedQuality / 1000)];
               if(video.currentTime !== 0) {
                playSeries.push(playPoint); 
            }
        }

        videoSeries.push([parseFloat(video.currentTime), Math.round(parseFloat(metrics.bufferLengthValue))]);

            // if (videoSeries.length > maxGraphPoints) {
            //     videoSeries.splice(0, 1);
            // }

            // if (dlSeries.length > maxGraphPoints) {
            //     dlSeries.splice(0, 1);
            //     playSeries.splice(0, 1);
            // }

            // if (requestSeries.length > 5) {
            //     requestSeries.splice(0, 1);
            // }

            //initialisation of bandwidth chart
            if (!$scope.optionsBandwidthGrid) {
                // $scope.optionsBandwidth.xaxis.min = video.currentTime;
                $scope.optionsBandwidthGrid = {};
                $scope.optionsBandwidthGrid.grid = {markings:[]};
                $scope.optionsBandwidthGrid.yaxis = {ticks: []};
                for (var idx in metrics.bitrateValues) {
                    $scope.optionsBandwidthGrid.grid.markings.push({yaxis: { from: metrics.bitrateValues[idx]/1000, to: metrics.bitrateValues[idx]/1000 },color:"#b0b0b0"});
                    $scope.optionsBandwidthGrid.yaxis.ticks.push([metrics.bitrateValues[idx]/1000, ""+metrics.bitrateValues[idx]/1000+"k"]);
                }
                $scope.optionsBandwidthGrid.yaxis.min = Math.min.apply(null,metrics.bitrateValues)/1000;
                $scope.optionsBandwidthGrid.yaxis.max = Math.max.apply(null,metrics.bitrateValues)/1000;
            }
        }

        if(!$scope.$$phase) {
            $scope.$apply();
        }

        updating = setTimeout(update, updateInterval);
    }

    ////////////////////////////////////////
    //
    // Error Handling
    //
    ////////////////////////////////////////

    function onError(e) {
        console.error(e);
    }

    $scope.bandwidthData = {};
    $scope.bandwidthData.playSeries = playSeries;
    $scope.bandwidthData.requestSeries = requestSeries;
    $scope.bandwidthData.calcBandwidthSeries = calcBandwidthSeries;

    ////////////////////////////////////////
    //
    // Player Setup
    //
    ////////////////////////////////////////

    video = document.querySelector(".video-player");
    context = new Custom.di.CustomContext();
    player = new MediaPlayer(context);
    
    $scope.version = player.getVersion();

    player.startup();
    player.addEventListener("error", onError.bind(this));

    player.attachView(video);
    player.setAutoPlay(true);

    ////////////////////////////////////////
    //
    // Page Setup
    //
    ////////////////////////////////////////

    function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
        return vars;
    }

    // Get url params...
    var vars = getUrlVars();

    $scope.doLoad = function () {


        $scope.playing = false;

        $timeout(function() {

            initMetrics();

            if(typeof updating !== 'undefined') {
                clearTimeout(updating);
            }

            player.attachSource($scope.selectedItem.link, $scope.selectedItem.backUrl);
            update();

            $scope.playing = true;
        }, 1);
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

        
        $scope.selectedItem.link = paramUrl;

        if (vars.hasOwnProperty("autoplay")) {
            startPlayback = (vars.autoplay === 'true');
        }

        if (startPlayback) {
            $scope.doLoad();
        }
    }

    $scope.getChart = function() {
        //playing datas
        graphService.getChart($scope.bandwidthData[0].data).then(function(chartLink) {
            console.log(chartLink);
            $scope.chartLink = chartLink.link;
        });
    };
});