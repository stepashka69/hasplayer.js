var PlayerLoader = function() {
    var orangeHasPlayer,
    video = document.getElementById('player'),
    previousPlayedQuality = 0,
    previousDownloadedQuality = 0,
    config,
    configMetrics = {
        "name": "csQoE (local)",
        "activationUrl": "http://localhost:8080/config",
        "serverUrl": "http://localhost:8080/metrics",
        "dbServerUrl": "http://localhost:8080/metricsDB",
        "collector": "HasPlayerCollector",
        "formatter": "CSQoE",
        "sendingTime": 10000
    },

    orangeHasPlayer = new OrangeHasPlayer();
    orangeHasPlayer.init(video);

    loadHasPlayerConfig('hasplayer_config.json');
    orangeHasPlayer.loadMetricsAgent(configMetrics);

    orangeHasPlayer.setDefaultAudioLang('deu');
    orangeHasPlayer.setDefaultSubtitleLang('fre');

    function loadHasPlayerConfig(fileUrl) {
        var reqConfig = new XMLHttpRequest();

        reqConfig.onload = function() {
            if (reqConfig.status === 200) {
                config = JSON.parse(reqConfig.responseText);
                if (orangeHasPlayer && config) {
                    orangeHasPlayer.setParams(config);
                }
            }
        };

        reqConfig.open("GET", fileUrl, true);
        reqConfig.setRequestHeader("Content-type", "application/json");
        reqConfig.send();
    };

    return {
        loadStream: function(streamInfos) {
            orangeHasPlayer.load(streamInfos.url, streamInfos.protData);
        }
    };
}
