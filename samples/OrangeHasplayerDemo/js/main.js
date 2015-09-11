    // Player
var video = null,
    playerContainer = null,
    controlBarModule = null,
    menuModule = null,
    menuButton = null,

    previousChannel = null,
    playPauseButton = null,
    nextChannel = null,

    panelVolume = null,
    volumeButton = null,
    volumeOnSvg = null,
    volumeOffSvg = null,
    sliderVolume = null,
    volumeLabel = null,
    volumeTimer = null,
    fullscreenButton = null,

    seekbarContainer = null,
    seekbar = null,
    seekbarBackground = null,
    videoDuration = null,
    durationTimeSpan = null,
    elapsedTimeSpan = null,

    videoQualityButton = null,
    qualityModule = null,
    closeButton = null,
    highBitrateSpan = null,
    currentBitrateSpan = null,
    lowBitrateSpan = null,

    languagesModule = null,
    languagesButton = null,

    errorModule = null,
    titleError = null,
    smallErrorMessage = null,
    longErrorMessage = null,

    barsTimer = null,
    hidebarsTimeout = 5000,

    isMute = false,
    subtitlesCSSStyle = null,

    // Spinner
    loadingElement = null,

    // Quick settings
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

    // Protection data
    protectionDataContainer = null,

    // Main Container
    streamUrl = null,

    // Graph
    graphContainer = null,
    graphLegend = null,
    updateGraph = false,
    graphUpdateTimeInterval = 200, // in milliseconds
    graphUpdateWindow = 30000, // in milliseconds
    graphSteps = graphUpdateWindow / graphUpdateTimeInterval,
    graphTimer = null,
    graphElapsedTime = 0,
    lastGraphTimeLabel = -1;
    firstGraphTime = -1,

    lineChartData = {
        labels: [],
        datasets: [{
            label: '&mdash; Downloaded Bitrate',
            fillColor: 'rgba(41, 128, 185, 0.2)',
            strokeColor: 'rgba(41, 128, 185, 1)',
            pointColor: 'rgba(41, 128, 185, 1)',
            pointStrokeColor: '#fff',
            pointHighlightFill: '#fff',
            pointHighlightStroke: 'rgba(220,220,220,1)',
            data: []
        }, {
            label: '&mdash; Played Bitrate',
            fillColor: 'rgba(231, 76, 60, 0.2)',
            strokeColor: 'rgba(231, 76, 60, 1)',
            pointColor: 'rgba(231, 76, 60, 1)',
            pointStrokeColor: '#fff',
            pointHighlightFill: '#fff',
            pointHighlightStroke: 'rgba(151,187,205,1)',
            data: []
        }]
    };

window.onload = function() {
    var streamsPanel = new StreamsPanel();
    streamsPanel.init();
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
    video = document.getElementById('player');
    volumeButton = document.getElementById('button-volume');
    panelVolume = document.getElementById('panel-volume');
    sliderVolume = document.getElementById('slider-volume');
    volumeOnSvg = document.getElementById('volumeOn');
    volumeOffSvg = document.getElementById('volumeOff');
    volumeLabel = document.getElementById('volumeLabel');
    fullscreenButton = document.getElementById('button-fullscreen');
    audioListCombobox = document.getElementById('audioCombo');
    previousChannel = document.getElementById('previousChannel');
    nextChannel = document.getElementById('nextChannel');
    subtitleListCombobox = document.getElementById('subtitleCombo');
    playPauseButton = document.getElementById('button-playpause');
    playerContainer = document.getElementById('demo-player-container');
    loadingElement = document.getElementById('LoadingModule');
    menuButton = document.getElementById('menuButton');
    menuModule = document.getElementById('MenuModule');
    languagesModule = document.getElementById('LanguagesModule');
    languagesButton = document.getElementById('languagesButton');
    videoQualityButton = document.getElementById('videoQualityButton');
    qualityModule = document.getElementById('QualityModule');
    closeButton = document.getElementById('CloseCrossModule');
    controlBarModule = document.getElementById('ControlBarModule');

    highBitrateSpan = document.getElementById('highBitrateSpan');
    currentBitrateSpan = document.getElementById('bandwith-binding');
    lowBitrateSpan = document.getElementById('lowBitrateSpan');

    errorModule = document.getElementById('ErrorModule');
    titleError = document.getElementById('titleError');
    smallErrorMessage = document.getElementById('smallMessageError');
    longErrorMessage = document.getElementById('longMessageError');

    durationTimeSpan = document.querySelector('.op-seek-bar-time-remaining span');
    elapsedTimeSpan = document.querySelector('.op-seek-bar-time-elapsed span');

    seekbarContainer = document.querySelector('.bar-container');
    seekbar = document.querySelector('.bar-seek');
    seekbarBackground = document.querySelector('.bar-background');

    protectionDataContainer = document.getElementById('protection-data-container');

    streamUrl = document.querySelector('.stream-url');

    settingsMenuButton = document.getElementById('settingsMenuButton');
    menuContainer = document.getElementById('menu-container');

    metricsAgentCombobox =  document.getElementById('metrics-agent-options');
    enableMetricsCheckbox = document.getElementById('enable-metrics-agent');

    defaultAudioLangCombobox = document.getElementById('default_audio_language');
    defaultSubtitleLangCombobox = document.getElementById('default_subtitle_language');

    enableOptimzedZappingCheckbox = document.getElementById('enable-optimized-zapping');

    graphContainer = document.getElementById('bitrate-graph-container');
};

var registerGUIEvents = function() {
    volumeButton.addEventListener('click', onMuteEnter);
    volumeButton.addEventListener('mouseenter', onMuteEnter);
    panelVolume.addEventListener('mouseover', onPanelVolumeEnter);
    panelVolume.addEventListener('mouseout', onPanelVolumeOut);
    fullscreenButton.addEventListener('click', onFullScreenClicked);
    sliderVolume.addEventListener('change', onSliderVolumeChange);
    audioListCombobox.addEventListener('change', audioChanged);
    subtitleListCombobox.addEventListener('change', subtitleChanged);
    playPauseButton.addEventListener('click', onPlayPauseClicked);
    video.addEventListener('dblclick', onFullScreenClicked);
    video.addEventListener('ended', onVideoEnded);

    playerContainer.addEventListener('webkitfullscreenchange', onFullScreenChange);
    playerContainer.addEventListener('mozfullscreenchange', onFullScreenChange);
    playerContainer.addEventListener('fullscreenchange', onFullScreenChange);
    playerContainer.addEventListener('mouseenter', showBarsTimed);
    playerContainer.addEventListener('mousemove', showBarsTimed);
    playerContainer.addEventListener('click', showBarsTimed);

    previousChannel.addEventListener('click', onPreviousClicked);
    nextChannel.addEventListener('click', onNextChannelClicked);

    menuButton.addEventListener('click', onMenuClicked);
    languagesButton.addEventListener('click', onLanguagesClicked);
    closeButton.addEventListener('click', onCloseButtonClicked);

    videoQualityButton.addEventListener('click', onVideoQualityClicked);

    seekbarContainer.addEventListener('mouseenter', onSeekBarModuleEnter);
    seekbarContainer.addEventListener('mouseleave', onSeekBarModuleLeave);
    seekbarBackground.addEventListener('click', onSeekClicked);
    seekbar.addEventListener('click', onSeekClicked);

    settingsMenuButton.addEventListener('click', onSettingsMenuButtonClicked);

    enableMetricsCheckbox.addEventListener('click', onEnableMetrics);
    metricsAgentCombobox.addEventListener('change', onSelectMetricsAgent);

    defaultAudioLangCombobox.addEventListener('change', onChangeDefaultAudioLang);
    defaultSubtitleLangCombobox.addEventListener('change', onChangeDefaultSubtitleLang);

    enableOptimzedZappingCheckbox.addEventListener('click', onEnableOptimizedZapping);


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
    hideErrorModule();
    showLoadingElement();
    loadStream(streamInfos);

    if (streamInfos.protData) {
        displayProtectionData(streamInfos.protData);
    }

    if (graphTimer === null) {
        graphTimer = new LoopTimer(handleGraphUpdate, graphUpdateTimeInterval);
    } else {
        graphTimer.stop();
    }

    streamUrl.innerHTML = streamInfos.url;

    showBarsTimed();
};

var onFullScreenChange = function(e) {
    var state = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
    if (!state) {
        document.getElementById('demo-player-container').className = 'demo-player';
    }
};

var onSeekBarModuleEnter = function(e) {
    seekbar.className = 'bar-seek bar-seek-zoom';
    seekbarBackground.className = 'bar-background bar-seek-zoom';
};

var onSeekBarModuleLeave = function(e) {
    seekbar.className = 'bar-seek';
    seekbarBackground.className = 'bar-background';
};

var onSeekClicked = function(e) {
    if (videoDuration) {
        setSeekValue(e.offsetX * videoDuration / seekbarBackground.clientWidth);
    }
};

var onVideoEnded = function(e) {
    graphTimer.stop();
};

var onPlayPauseClicked = function(e) {
    changePlayerState();
};

var audioChanged = function(e) {
    changeAudio(e.target.selectedIndex);
    document.getElementById(audioTracks[e.target.selectedIndex].id).checked = true;
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

var onLanguageRadioClicked = function(e) {
    var index = getTrackIndex(audioTracks, e.target.value);

    if (index !== -1) {
        changeAudio(index);
        audioListCombobox.selectedIndex = index;
    }
};

var onSubtitleRadioClicked = function(e) {
    var index = getTrackIndex(subtitleTracks, e.target.value);

    if (index !== -1) {
        changeSubtitle(index);
        subtitleListCombobox.selectedIndex = index;
    }
};

var subtitleChanged = function(e) {
    changeSubtitle(e.target.selectedIndex);
    document.getElementById(subtitleTracks[e.target.selectedIndex].id).checked = true;
};

var onMuteClicked = function() {
    setPlayerMute();
    setVolumeOff(orangeHasPlayer.getMute());
    hideVolumePanel();
};

var onMuteEnter = function() {
    showVolumePanel();
    restartVolumeTimer();
};

var onPanelVolumeEnter = function() {
    stopVolumeTimer();
};

var onSliderVolumeChange = function() {
    if (sliderVolume.value === '0') {
        onMuteClicked();
        isMute = true;
    } else if (isMute) {
        onMuteClicked();
        isMute = false;
    }

    setPlayerVolume(sliderVolume.value / 100);
};

var onPanelVolumeOut = function() {
    restartVolumeTimer();
};

var onFullScreenClicked = function() {
    if (!document.fullscreenElement && // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
        if (playerContainer.requestFullscreen) {
            playerContainer.requestFullscreen();
        } else if (playerContainer.msRequestFullscreen) {
            playerContainer.msRequestFullscreen();
        } else if (playerContainer.mozRequestFullScreen) {
            playerContainer.mozRequestFullScreen();
        } else if (playerContainer.webkitRequestFullscreen) {
            playerContainer.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
        document.getElementById('demo-player-container').className = 'demo-player-fullscreen';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        document.getElementById('demo-player-container').className = 'demo-player';
    }
    setSubtitlesCSSStyle(subtitlesCSSStyle);
};

var onPreviousClicked = function() {
    if (selectedStreamElement.previousSibling) {
        selectedStreamElement.previousSibling.click();
    }
};

var onNextChannelClicked = function() {
    if (selectedStreamElement.nextSibling) {
        selectedStreamElement.nextSibling.click();
    }
};

var onMenuClicked = function() {
    if (hasClass(menuModule, 'op-hidden-translate-up')) {
        menuModule.className = 'op-menu op-show-translate-up';
    } else {
        menuModule.className = 'op-menu op-hidden-translate-up';
    }
};

var onLanguagesClicked = function() {
    if (!hasClass(qualityModule, 'op-hidden')) {
        qualityModule.className = 'op-screen op-settings-quality op-hidden';
    }

    if (hasClass(languagesModule, 'op-hidden')) {
        languagesModule.className = 'op-screen op-languages';
        hideControlBar();
        enableMiddleContainer(true);
        clearTimeout(barsTimer);
    } else {
        languagesModule.className = 'op-screen op-languages op-hidden';
        showControlBar();
        enableMiddleContainer(false);
        showBarsTimed();
    }
};

var onVideoQualityClicked = function() {
    if (!hasClass(languagesModule, 'op-hidden')) {
        languagesModule.className = 'op-screen op-languages op-hidden';
    }

    if (hasClass(qualityModule, 'op-hidden')) {
        qualityModule.className = 'op-screen op-settings-quality';
        hideControlBar();
        enableMiddleContainer(true);
        clearTimeout(barsTimer);
    } else {
        qualityModule.className = 'op-screen op-settings-quality op-hidden';
        showControlBar();
        enableMiddleContainer(false);
        showBarsTimed();
    }

};

var onCloseButtonClicked = function() {
    languagesModule.className = 'op-screen op-languages op-hidden';
    qualityModule.className = 'op-screen op-settings-quality op-hidden';
    enableMiddleContainer(false);
    closeButton.className = 'op-close op-hidden';
    showControlBar();
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

var createLanguageLine = function(audioTrack, selectedAudioTrack, type) {
    var checked = selectedAudioTrack.id === audioTrack.id ? 'checked="checked"' : '';
    var lang =  audioTrack.lang !== undefined ? audioTrack.lang : audioTrack.id;
    var html = '<div class="op-languages-line">' +
                '<input type="radio" name="' + type + '" id="' + audioTrack.id + '" value="' + audioTrack.id + '" ' + checked + ' >' +
                '<label for="' +  audioTrack.id + '">' +
                '<span class="op-radio">' +
                '<svg version="1.1" id="Calque_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 32 32" enable-background="new 0 0 32 32" xml:space="preserve"><g id="Calque_3" display="none">	<rect x="-0.1" display="inline" fill="none" width="32" height="32"></rect></g><g id="Calque_1_1_"><g><g><circle fill="none" stroke="#000000" stroke-width="2" stroke-miterlimit="10" cx="15.9" cy="16" r="13"></circle></g></g></g></svg>' +
                '</span>' +
                '<span class="op-radiocheck">' +
                '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 32 32" enable-background="new 0 0 32 32" xml:space="preserve"><g id="Calque_3" display="none">	<rect x="-0.1" y="0" display="inline" fill="none" width="32" height="32"></rect></g><g id="Calque_1">	<g>		<g>			<circle fill="none" stroke="#000000" stroke-width="2" stroke-miterlimit="10" cx="15.9" cy="16" r="13"></circle></g></g></g><g id="Calque_2">	<path fill-rule="evenodd" clip-rule="evenodd" d="M15.9,7.9c4.5,0,8.1,3.6,8.1,8.1s-3.6,8.1-8.1,8.1c-4.5,0-8.1-3.6-8.1-8.1		S11.5,7.9,15.9,7.9z"></path></g></svg>' +
                '</span>' +
                '<span> ' + lang + '</span>' +
                '</label>' +
                '</div>';
    return html;
};

var addLanguageLine = function(audioTrack, selectedAudioTrack) {
    var html = createLanguageLine(audioTrack, selectedAudioTrack, 'language');
    var languageContainer = document.querySelector('.op-summary');
    languageContainer.insertAdjacentHTML('beforeend', html);
    document.getElementById(audioTrack.id).addEventListener('click', onLanguageRadioClicked);
};

var addSubtitleLine = function(subtitleTrack, selectedSubtitleTrack) {
    var html = createLanguageLine(subtitleTrack, selectedSubtitleTrack, 'subtitle');
    var subtitleContainer = document.querySelector('.op-panel-container');
    subtitleContainer.insertAdjacentHTML('beforeend', html);
    document.getElementById(subtitleTrack.id).addEventListener('click', onSubtitleRadioClicked);
};

var handleAudioDatas = function(_audioTracks, _selectedAudioTrack) {
    audioTracks = _audioTracks;
    currentaudioTrack = _selectedAudioTrack;

    resetLanguageLines();

    if (audioTracks && currentaudioTrack) {
        addCombo(audioTracks, audioListCombobox);
        selectCombo(audioTracks, audioListCombobox, currentaudioTrack);

        for (i = 0; i < audioTracks.length; i++) {
            addLanguageLine(audioTracks[i], currentaudioTrack);
        }
    }
};

var handleDuration = function(duration) {
    videoDuration = duration;
    if (duration !== Infinity) {
        durationTimeSpan.textContent = setTimeWithSeconds(duration);
    } else {
        durationTimeSpan.textContent = '00:00:00';
        handleTimeUpdate(0);
    }
};

var handleVolumeChange = function(volumeLevel) {
    volumeLabel.innerHTML = Math.round(volumeLevel * 100);
    if (sliderVolume.value === 0) {
        sliderVolume.className = 'op-volume';
    } else if (sliderVolume.value > 0 && sliderVolume.value <= 8) {
        sliderVolume.className = 'op-volume op-range8';
    } else if (sliderVolume.value > 8 && sliderVolume.value <= 16) {
        sliderVolume.className = 'op-volume op-range16';
    } else if (sliderVolume.value >= 16 && sliderVolume.value <= 24) {
        sliderVolume.className = 'op-volume op-range24';
    } else if (sliderVolume.value >= 24 && sliderVolume.value <= 32) {
        sliderVolume.className = 'op-volume op-range32';
    } else if (sliderVolume.value >= 32 && sliderVolume.value <= 40) {
        sliderVolume.className = 'op-volume op-range40';
    } else if (sliderVolume.value >= 40 && sliderVolume.value <= 48) {
        sliderVolume.className = 'op-volume op-range48';
    } else if (sliderVolume.value >= 48 && sliderVolume.value <= 56) {
        sliderVolume.className = 'op-volume op-range56';
    } else if (sliderVolume.value >= 56 && sliderVolume.value <= 64) {
        sliderVolume.className = 'op-volume op-range64';
    } else if (sliderVolume.value >= 64 && sliderVolume.value <= 72) {
        sliderVolume.className = 'op-volume op-range72';
    } else if (sliderVolume.value >= 72 && sliderVolume.value <= 80) {
        sliderVolume.className = 'op-volume op-range80';
    } else if (sliderVolume.value >= 80 && sliderVolume.value <= 88) {
        sliderVolume.className = 'op-volume op-range88';
    } else if (sliderVolume.value >= 88 && sliderVolume.value <= 96) {
        sliderVolume.className = 'op-volume op-range96';
    } else if (sliderVolume.value >= 96) {
        sliderVolume.className = 'op-volume op-range100';
    }
};

var handleTimeUpdate = function(time) {
    elapsedTimeSpan.textContent = setTimeWithSeconds(time);
    if (videoDuration !== Infinity) {
        var progress = (time / videoDuration) * 100;
        seekbar.style.width = progress + '%';
     } else {
        seekbar.style.width = 0;
     }
};

var handleSubtitleDatas = function(_subtitleTracks, _selectedSubtitleTrack) {
    //init subtitles tracks
    subtitleTracks = _subtitleTracks;
    currentsubtitleTrack = _selectedSubtitleTrack;

    if (subtitleTracks) {
        addCombo(subtitleTracks, subtitleListCombobox);
        selectCombo(subtitleTracks, subtitleListCombobox, currentsubtitleTrack);

        for (i = 0; i < subtitleTracks.length; i++) {
            addSubtitleLine(subtitleTracks[i], _selectedSubtitleTrack);
        }
    }
};

var handleSubtitleStyleChange = function(style) {
    subtitlesCSSStyle = style;
    setSubtitlesCSSStyle(subtitlesCSSStyle);
};

var handlePlayState = function(state) {
    setPlaying(state);
    if (state === true) {
        hideLoadingElement();
        graphTimer.start();
    } else {
        graphTimer.pause();
    }
};

var handleDownloadedBitrate = function(bitrate, time) {
    lastDownloadedBitrate = bitrate;
};

var handlePlayBitrate = function(bitrate, time) {
    lastPlayedBitrate = bitrate;
    currentBitrateSpan.innerHTML = bitrate/1000000;
};

var timeLabel = function(elapsedTime) {
    var label = '';

    elapsedTime /= 1000;

    if (elapsedTime >= lastGraphTimeLabel + 1) {
        lastGraphTimeLabel = Math.floor(elapsedTime);
        label = lastGraphTimeLabel;
    }

    return label;
};

var handleGraphUpdate = function() {
    if (window.myLine !== undefined && updateGraph) {

        if (window.myLine.datasets[0].points.length > graphSteps) {
            window.myLine.removeData();
        }

        graphElapsedTime += graphUpdateTimeInterval;
        window.myLine.addData([lastDownloadedBitrate, lastPlayedBitrate], timeLabel(graphElapsedTime));
        window.myLine.update();
    }
};

var handleBitrates = function(bitrates) {
    graphContainer.className = 'module';

    var ctx = document.getElementById('canvas').getContext('2d');

    if (bitrates) {
        window.myLine = new Chart(ctx).LineConstant(lineChartData, {
            responsive: true,
            constantCurve: true,
            stepsCount: graphSteps,
            animation: false,
            scaleBeginAtZero: false,
            // Boolean - If we want to override with a hard coded scale
            scaleOverride: true,
            // ** Required if scaleOverride is true **
            // Number - The number of steps in a hard coded scale
            scaleSteps: bitrates.length - 1,
            // Number - The value jump in the hard coded scale
            scaleStepWidth: bitrates[bitrates.length - 1] / (bitrates.length - 1),
            // Number - The scale starting value
            scaleStartValue: bitrates[0],
            pointDot : false,
            showTooltips: false,
            scaleShowVerticalLines : false,
            scaleLabels: bitrates,
            legendTemplate : '<ul class="<%=name.toLowerCase()%>-legend"><% for (var i=0; i<lineChartData.datasets.length; i++){%><li><span style="color:<%=lineChartData.datasets[i].strokeColor%>"><%if(lineChartData.datasets[i].label){%><%=lineChartData.datasets[i].label%><%}%></span></li><%}%></ul>'

        });

        if (graphLegend === null) {
            graphLegend = window.myLine.generateLegend();
            document.getElementById('chartLegend').innerHTML = graphLegend;
        }

        highBitrateSpan.innerHTML = bitrates[bitrates.length - 1]/1000000;
        lowBitrateSpan.innerHTML = bitrates[0]/1000000;

        lastPlayedBitrate = null;

        updateGraph = true;



        // Init first graph value
        graphElapsedTime = 0;
        window.myLine.addData([lastDownloadedBitrate, lastPlayedBitrate], timeLabel(graphElapsedTime));
    }
};

var handleError = function(e) {
    //manage GUI to show errors

    titleError.innerHTML = e.event.code;
    smallErrorMessage.innerHTML = e.event.message;

    showErrorModule();
};

/**********************************************************************************************************************/

var setSubtitlesCSSStyle = function(style) {
    if (style) {
        var fontSize = style.data.fontSize;

        if (style.data.fontSize[style.data.fontSize.length - 1] === '%') {
            fontSize = (video.clientHeight * style.data.fontSize.substr(0, style.data.fontSize.length - 1)) / 100;
        }

        document.getElementById('cueStyle').innerHTML = '::cue{ background-color:' + style.data.backgroundColor + ';color:' + style.data.color + ';font-size: ' + fontSize + 'px;font-family: ' + style.data.fontFamily + '}';
    }
};

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

var resetSeekbar = function() {
    seekbar.style.width = 0;
    durationTimeSpan.textContent = '00:00:00';
    elapsedTimeSpan.textContent = '00:00:00';
};

var resetLanguageLines = function() {
    var languageLines = document.getElementsByClassName('op-languages-line');

    if (languageLines !== null) {
        while(languageLines.length > 0) {
            languageLines[0].removeEventListener('click');
            languageLines[0].parentNode.removeChild(languageLines[0]);
        }
    }
};

var reset = function() {
    resetCombo(audioTracks, audioListCombobox);
    resetCombo(subtitleTracks, subtitleListCombobox);

    clearProtectionData();

    resetSeekbar();
    resetLanguageLines();

    currentaudioTrack = null;
    currentsubtitleTrack = null;
    lastDownloadedBitrate = null;
    lastPlayedBitrate = null;

    if (window.myLine !== undefined) {
        window.myLine.destroy();
        lineChartData.labels = [];
        lineChartData.datasets[0].data = [];
        lineChartData.datasets[1].data = [];
        updateGraph = false;
    }

    lastGraphTimeLabel = -1;
    firstGraphTime = -1;
    graphElapsedTime = 0;
};

var setVolumeOff = function(value) {
    if (value) {
        volumeOffSvg.style.display = 'block';
        volumeOnSvg.style.display = 'none';
    } else {
        volumeOffSvg.style.display = 'none';
        volumeOnSvg.style.display = 'block';
    }
};

var setPlaying = function(value) {
    if (value) {
        playPauseButton.className = 'tooltip op-play op-pause stop-anchor';
        playPauseButton.title = 'Pause';
    } else {
        playPauseButton.className = 'tooltip op-play stop-anchor';
        playPauseButton.title = 'Play';
    }
};

var stopVolumeTimer = function() {
    clearTimeout(volumeTimer);
};

var restartVolumeTimer = function() {
    clearTimeout(volumeTimer);
    volumeTimer = setTimeout(function() {
        hideVolumePanel();
    }, 3000);
};

var showVolumePanel = function() {
    panelVolume.className = 'op-container-volume';
};

var hideVolumePanel = function() {
    clearTimeout(volumeTimer);
    panelVolume.className = 'op-container-volume op-hidden';
};

var showLoadingElement = function() {
    loadingElement.className = 'op-loading';
};

var hideLoadingElement = function() {
    loadingElement.className = 'op-loading op-none';
};

var hideControlBar = function() {
    controlBarModule.className = 'op-control-bar op-none';
};

var showControlBar = function() {
    controlBarModule.className = 'op-control-bar';
};

var showErrorModule = function() {
    errorModule.className = 'op-error';
};

var hideErrorModule = function() {
    errorModule.className = 'op-error op-hidden';
};

var hideBars = function() {
    controlBarModule.className = 'op-control-bar op-fade-out';
    menuModule.className = 'op-menu op-hidden-translate-up';

    languagesModule.className = 'op-screen op-languages op-hidden';
    qualityModule.className = 'op-screen op-settings-quality op-hidden';
    enableMiddleContainer(false);
    closeButton.className = 'op-close op-hidden';
};

var showBarsTimed = function(e) {
    if (hasClass(document.querySelector('.op-middle-container'), 'disabled')) {
        clearTimeout(barsTimer);
        barsTimer = setTimeout(hideBars, hidebarsTimeout);
        controlBarModule.className = 'op-control-bar';
    }
};

var clearProtectionData = function() {
    protectionDataContainer.innerHTML = '';
    protectionDataContainer.className = 'module hidden';
};

var displayProtectionData = function(streamInfos) {
    protectionDataContainer.className = 'module';

    var html = '<table>';

    for (var p in streamInfos) {
        if (streamInfos.hasOwnProperty(p)) {
            html += displayProtectionDatum(p, streamInfos[p]);
        }
    }

    html += '</table>';

    protectionDataContainer.innerHTML = html;
};

var displayProtectionDatum = function(protectionName, protectionDatum) {
    var html = '<tr><td class="protection-data-name" colspan="2">' + protectionName + '</td></tr>';

    for (var p in protectionDatum) {
        if (protectionDatum.hasOwnProperty(p)) {
            html += '<tr><td class="protection-key">' + p + '</td><td class="protection-value">' + protectionDatum[p] + '</td></tr>';
        }
    }

    return html;
};

var enableMiddleContainer = function(enabled) {
    if (enabled) {
        document.querySelector('.op-middle-container').className = 'op-middle-container';
        closeButton.className = 'op-close';
    } else {
        document.querySelector('.op-middle-container').className = 'op-middle-container disabled';
        closeButton.className = 'op-close op-hidden';
    }
};

var setTimeWithSeconds = function(sec) {
    var sec_num = parseInt(sec, 10); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) {
        hours = '0' + hours;
    }
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    var time = hours + ':' + minutes + ':' + seconds;
    return time;
};

var hasClass = function(element, className) {
    return element.className && new RegExp('(^|\\s)' + className + '(\\s|$)').test(element.className);
};

var clearContent = function(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
};
