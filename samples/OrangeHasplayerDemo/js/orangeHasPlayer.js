var PlayerLoader = function() {
    var orangeHasPlayer,
    video = document.getElementById('player'),
    audioList = document.getElementById('audioCombo'),
    subtitleList = document.getElementById('subtitleCombo'),
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
    audioTracks = [],
    currentaudioTrack = null,
    subtitleTracks = [],
    currentsubtitleTrack = null,

    orangeHasPlayer = new OrangeHasPlayer();
    orangeHasPlayer.init(video);

    loadHasPlayerConfig('hasplayer_config.json');
    orangeHasPlayer.loadMetricsAgent(configMetrics);

    orangeHasPlayer.setDefaultAudioLang('deu');
    orangeHasPlayer.setDefaultSubtitleLang('fre');

    orangeHasPlayer.addEventListener("loadeddata", onload.bind(this));

    function onload(e) {
        //init audio tracks
        audioTracks = orangeHasPlayer.getAudioTracks();
        currentaudioTrack = orangeHasPlayer.getSelectedAudioTrack();

        addCombo(audioTracks, audioList);
        selectCombo(audioTracks, audioList, currentaudioTrack);

        //init subtitles tracks
        subtitleTracks = orangeHasPlayer.getSubtitleTracks();
        currentsubtitleTrack = orangeHasPlayer.getSelectedSubtitleTrack();

        addCombo(subtitleTracks, subtitleList);
        selectCombo(subtitleTracks, subtitleList, currentsubtitleTrack);
    }

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

    function addCombo(tracks, combo) {
        var i, option;

        for (i = 0; i < tracks.length; i++) {
            option = document.createElement("option");
            option.text = tracks[i].id;
            option.value = tracks[i].lang;

            try {
                combo.add(option, null); //Standard 
            }catch(error) {
                combo.add(option); // IE only
            }
            if (combo.style.visibility === 'hidden') {
                combo.style.visibility = 'visible';
            }
        }
    }

    function selectCombo(tracks, combo, currentTrack) {
        var i;

        for (i = 0; i < tracks.length; i++) {
            if (currentTrack === tracks[i]) {
                combo.selectedIndex = i;
            }
        }
    }

    function resetCombo(tracks, combo) {
        var i;

        for (i = tracks.length - 1; i >= 0 ; i--) {
            combo.options.remove(i);
        }

        tracks = [];

        combo.style.visibility='hidden';
    }

    function reset() {
        resetCombo(audioTracks, audioList);
        resetCombo(subtitleTracks, subtitleList);

        currentaudioTrack = null;
        currentsubtitleTrack = null;
    }

    return {
        loadStream: function(streamInfos) {
            reset();
            orangeHasPlayer.load(streamInfos.url, streamInfos.protData);
        },

        changeAudio: function() {            
            orangeHasPlayer.setAudioTrack(audioTracks[audioList.selectedIndex]);
        },

        changeSubtitle: function() {            
            orangeHasPlayer.setSubtitleTrack(subtitleTracks[subtitleList.selectedIndex]);
        }
    };
}
