angular.module('HASPlayer').controller('PlayerController', function($scope) {
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
    firstAccess = true,
    updateInterval = 333,
    updating = null,
    previousRequest = null;

    $scope.action.updating = null;
    
    $scope.bandwidthData.playSeries = [];

    $scope.bandwidthData.requestSeries = [];

    $scope.bandwidthData.calcBandwidthSeries = [];
    //Player INIT
    $scope.action.initMetrics = function() {

        // assign an empty array is not working... why ? reference in bufferData ?
        videoSeries.splice(0, videoSeries.length);
        audioSeries.splice(0, audioSeries.length);
        dlSeries.splice(0, dlSeries.length);
        playSeries.splice(0, playSeries.length);

        firstAccess=true;
    };

    $scope.action.update = function(e) {
        // we take only video metrics with httpRequest
        if(e.data && e.data.stream==="video" && e.data.value){
            var httpRequest = e.data.value;
            //filter on Media Segment (skip initialization) and take only those which has finished
            if(httpRequest.type === "Media Segment" && httpRequest.tfinish){

                var lastTrace = httpRequest.trace[httpRequest.trace.length-1] || null;
                // on attends que la vidéo démarre pour commencer les traces
                if(lastTrace && video.currentTime !== 0){
                    var metricsExt = $scope.data.player.getMetricsExt();
                    var bitrateValues = metricsExt.getBitratesForType("video");
                    var time = new Date().getTime()/1000;
                    var bandwidth = lastTrace.b[0]*8/ (httpRequest.tfinish.getTime() - httpRequest.trequest.getTime());
                    if(bandwidth>10000){
                        bandwidth = 10000;
                    }else{
                        bandwidth = parseFloat(bandwidth);
                    }
                    $scope.bandwidthData.calcBandwidthSeries.push([time, bandwidth]);
                    $scope.bandwidthData.playSeries.push([time,bandwidth]);
                    $scope.bandwidthData.requestSeries.push([time,bitrateValues[httpRequest.quality]/1000]);
                    $scope.$apply();
                }
            }
        }
       
    };

    ////////////////////////////////////////
    //
    // Error Handling
    //
    ////////////////////////////////////////

    function onError(e) {
        console.error(e);
    }


    ////////////////////////////////////////
    //
    // Player Setup
    //
    ////////////////////////////////////////

    video = document.querySelector(".video-player");

    context = new Custom.di.CustomContext();
    $scope.data.player = new MediaPlayer(context);
    
    $scope.version = $scope.data.player.getVersion();

    $scope.data.player.startup();
    $scope.data.player.addEventListener("error", onError.bind(this));

    $scope.data.player.attachView(video);
    $scope.data.player.setAutoPlay(true);

    $scope.data.player.attachSource($scope.data.selectedItem.link, $scope.data.selectedItem.backUrl);

    $scope.action.initMetrics();
    $scope.data.player.addEventListener("metricUpdated",$scope.action.update,false);


    // videojs(video, { "controls": true, "autoplay": true, "preload": "auto" });
});