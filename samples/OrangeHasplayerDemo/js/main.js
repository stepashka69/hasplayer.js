var // Quick settings
    audioListCombobox = null,
    subtitleListCombobox = null,
    audioTracks = [],
    subtitleTracks = [],
    currentaudioTrack = null,
    currentsubtitleTrack = null,

    // Settings
    settingsMenuButton = null,
    enableMetricsCheckbox = null,
    enableOptimzedZappingCheckbox = null,
    metricsAgentCombobox =  null,
    defaultAudioLangCombobox = null,
    defaultSubtitleLangCombobox = null,
    optimizedZappingEnabled = true,
    metricsConfig = null,

    // Main Container
    streamUrl = null,
    menuContainer = null,

    // Modules
    playerWrapper = null,
    streamsPanel = null,
    graph = null,
    protectionDataViewer = null,

    minivents = null;


window.onload = function() {
    minivents = new Events();

    playerWrapper = new PlayerPanel();
    playerWrapper.init();

    streamsPanel = new StreamsPanel();
    streamsPanel.init();

    graph = new Graph();
    protectionDataViewer = new ProtectionDataViewer();
    protectionDataViewer.init(document.getElementById('protection-data-container'));

    initMetricsAgentOptions();
    getDOMElements();
    createHasPlayer();
    registerGUIEvents();
};

var initMetricsAgentOptions = function() {
        var reqMA = new XMLHttpRequest();
        reqMA.onload = function () {
            if (reqMA.status === 200) {
                metricsConfig = JSON.parse(reqMA.responseText);

                metricsAgentCombobox.innerHTML = '';

                for (var i = 0, len = metricsConfig.items.length; i < len; i++) {
                    metricsAgentCombobox.innerHTML += '<option value="' + i + '">' + metricsConfig.items[i].name + '</option>';
                }
                metricsAgentCombobox.selectedIndex = -1;
            }
        };
        reqMA.open('GET', './json/metricsagent_config.json', true);
        reqMA.setRequestHeader('Content-type', 'application/json');
        reqMA.send();
};

var getDOMElements = function() {
    audioListCombobox = document.getElementById('audioCombo');
    subtitleListCombobox = document.getElementById('subtitleCombo');
    streamUrl = document.querySelector('.stream-url');
    menuContainer = document.getElementById('menu-container');
    settingsMenuButton = document.getElementById('settingsMenuButton');
    metricsAgentCombobox =  document.getElementById('metrics-agent-options');
    enableMetricsCheckbox = document.getElementById('enable-metrics-agent');
    defaultAudioLangCombobox = document.getElementById('default_audio_language');
    defaultSubtitleLangCombobox = document.getElementById('default_subtitle_language');
    enableOptimzedZappingCheckbox = document.getElementById('enable-optimized-zapping');
};

var registerGUIEvents = function() {
    audioListCombobox.addEventListener('change', audioChanged);
    subtitleListCombobox.addEventListener('change', subtitleChanged);
    settingsMenuButton.addEventListener('click', onSettingsMenuButtonClicked);
    enableMetricsCheckbox.addEventListener('click', onEnableMetrics);
    metricsAgentCombobox.addEventListener('change', onSelectMetricsAgent);
    defaultAudioLangCombobox.addEventListener('change', onChangeDefaultAudioLang);
    defaultSubtitleLangCombobox.addEventListener('change', onChangeDefaultSubtitleLang);
    enableOptimzedZappingCheckbox.addEventListener('click', onEnableOptimizedZapping);

    minivents.on('language-radio-clicked', onLanguageChangedFromPlayer);
    minivents.on('subtitle-radio-clicked', onSubtitleChangedFromPlayer);
};

/********************************************************************************************************************
 *
 *
 *                  GUI events
 *
 *
 **********************************************************************************************************************/
var onStreamClicked = function(streamInfos) {
    reset();
    loadStream(streamInfos);

    if (streamInfos.protData) {
        protectionDataViewer.display(streamInfos.protData);
    }

    graph.initTimer();

    streamUrl.innerHTML = streamInfos.url;
};

var audioChanged = function(e) {
    changeAudio(e.target.selectedIndex);
    document.getElementById(audioTracks[e.target.selectedIndex].id).checked = true;
};

var subtitleChanged = function(e) {
    changeSubtitle(e.target.selectedIndex);
    document.getElementById(subtitleTracks[e.target.selectedIndex].id).checked = true;
};

var getTrackIndex = function(tracks, id) {
    var index = -1;
    for(var i = 0, len = tracks.length; i < len; i++) {
        if (tracks[i].id === id) {
            index = i;
            break;
        }
    }

    return index;
};

var onLanguageChangedFromPlayer = function(track) {
    var index = getTrackIndex(audioTracks, track);

    if (index > -1) {
        changeAudio(index);
        audioListCombobox.selectedIndex = index;
    }
};

var onSubtitleChangedFromPlayer = function(track) {
    var index = getTrackIndex(subtitleTracks, track);

    if (index > -1) {
        changeSubtitle(index);
        subtitleListCombobox.selectedIndex = index;
    }
};

var onSettingsMenuButtonClicked = function() {
    if (hasClass(menuContainer, 'hidden')) {
        menuContainer.className = '';
    } else {
        menuContainer.className = 'hidden';
    }
};

var onEnableMetrics = function() {
    if (enableMetricsCheckbox.checked) {
        metricsAgentCombobox.disabled = false;
    } else {
        enableMetricsCheckbox.checked = true;
        //metricsAgentCombobox.disabled = true;
    }
};

var onSelectMetricsAgent = function (value) {
    if (typeof MetricsAgent === 'function') {
        if (enableMetricsCheckbox.checked) {
            orangeHasPlayer.loadMetricsAgent(metricsConfig.items[metricsAgentCombobox.selectedIndex]);
        } else if (metricsAgent) {
            metricsAgent.stop();
        }
    }
};

var onChangeDefaultAudioLang = function(e) {
    orangeHasPlayer.setDefaultAudioLang(defaultAudioLangCombobox.value);
};

var onChangeDefaultSubtitleLang = function(e) {
    orangeHasPlayer.setDefaultSubtitleLang(defaultSubtitleLangCombobox.value);
};

var onEnableOptimizedZapping = function(e) {
    optimizedZappingEnabled = enableOptimzedZappingCheckbox.checked;
};


/********************************************************************************************************************
 *
 *
 *                  functions called by OrangeHasPlayer to update GUI
 *
 *
 **********************************************************************************************************************/

var handleAudioDatas = function(_audioTracks, _selectedAudioTrack) {
    audioTracks = _audioTracks;
    currentaudioTrack = _selectedAudioTrack;

    playerWrapper.resetLanguageLines();

    if (audioTracks && currentaudioTrack) {
        addCombo(audioTracks, audioListCombobox);
        selectCombo(audioTracks, audioListCombobox, currentaudioTrack);

        for (var i = 0; i < audioTracks.length; i++) {
            playerWrapper.addLanguageLine(audioTracks[i], currentaudioTrack);
        }
    }
};

var handleSubtitleDatas = function(_subtitleTracks, _selectedSubtitleTrack) {
    //init subtitles tracks
    subtitleTracks = _subtitleTracks;
    currentsubtitleTrack = _selectedSubtitleTrack;

    if (subtitleTracks) {
        addCombo(subtitleTracks, subtitleListCombobox);
        selectCombo(subtitleTracks, subtitleListCombobox, currentsubtitleTrack);

        for (var i = 0; i < subtitleTracks.length; i++) {
            playerWrapper.addSubtitleLine(subtitleTracks[i], _selectedSubtitleTrack);
        }
    }
};

var handleSubtitleStyleChange = function(style) {
    playerWrapper.setSubtitlesCSSStyle(style);
};

var handlePlayState = function(state) {
    playerWrapper.setPlaying(state);
    if (state === true) {
        playerWrapper.hideLoadingElement();
        graph.timer.start();
    } else {
        graph.timer.pause();
    }
};

var handleVolumeChange = function(volumeLevel) {
    playerWrapper.onVolumeChange(volumeLevel);
};

var handleDuration = function(duration) {
   playerWrapper.setDuration(duration);
};

var handleTimeUpdate = function(time) {
    playerWrapper.setPlayingTime(time);
};

var handleDownloadedBitrate = function(bitrate, time) {
    graph.lastDownloadedBitrate = bitrate;
};

var handlePlayBitrate = function(bitrate, time) {
    graph.lastPlayedBitrate = bitrate;
    playerWrapper.setCurrentBitrate(bitrate);
};

var handleBitrates = function(bitrates) {
    var ctx = document.getElementById('canvas').getContext('2d');
    graph.init(ctx, bitrates);
};

var handleError = function(e) {
    playerWrapper.displayError(e.event.code, e.event.message);
};

/**********************************************************************************************************************/

var addCombo = function(tracks, combo) {
    var i, option;

    for (i = 0; i < tracks.length; i++) {
        option = document.createElement('option');
        option.text = tracks[i].id;
        option.value = tracks[i].lang;

        try {
            combo.add(option, null); //Standard
        } catch (error) {
            combo.add(option); // IE only
        }
        if (combo.style.visibility === 'hidden') {
            combo.style.visibility = 'visible';
        }
    }
};

var selectCombo = function(tracks, combo, currentTrack) {
    var i;

    for (i = 0; i < tracks.length; i++) {
        if (currentTrack === tracks[i]) {
            combo.selectedIndex = i;
        }
    }
};

var resetCombo = function(tracks, combo) {
    var i;

    for (i = tracks.length - 1; i >= 0; i--) {
        combo.options.remove(i);
    }

    tracks = [];

    combo.style.visibility = 'hidden';
};

var reset = function() {
    resetCombo(audioTracks, audioListCombobox);
    resetCombo(subtitleTracks, subtitleListCombobox);

    protectionDataViewer.clear();

    playerWrapper.reset();

    currentaudioTrack = null;
    currentsubtitleTrack = null;

    graph.reset();
};
