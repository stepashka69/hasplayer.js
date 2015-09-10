var video = null,
    playerContainer = null,
    protectionDataContainer = null,
    streamUrl = null,
    volumeButton = null,
    volumeOnSvg = null,
    volumeOffSvg = null,
    panelVolume = null,
    sliderVolume = null,
    volumeLabel = null,
    volumeTimer = null,
    fullscreenButton = null,
    menuButton = null,
    menuModule = null,
    globalMenu = null,
    videoQualityButton = null,
    controlBarModule = null,
    qualityModule = null,
    closeButton = null,
    highBitrateSpan = null,
    currentBitrateSpan = null,
    lowBitrateSpan = null,
    languagesModule = null,
    errorModule = null,
    titleError = null,
    smallErrorMessage = null,
    longErrorMessage = null,
    languagesButton = null,
    loadingElement = null,
    audioList = null,
    audioListInPlayer = null,
    subtitleList = null,
    enableMetricsCheckbox = null,
    enableOptimzedZappingCheckbox = null,
    metricsOptions =  null,
    configMetrics = null,
    defaultAudioLangCombobox = null,
    defaultSubtitleLangCombobox = null,
    optimizedZappingEnabled = true,
    audioTracks = [],
    currentaudioTrack = null,
    subtitleTracks = [],
    currentsubtitleTrack = null,
    playPauseButton = null,
    seekbarContainer = null,
    seekbar = null,
    seekbarBackground = null,
    durationText = null,
    currentTimeText = null,
    videoDuration = null,
    previousChannel = null,
    nextChannel = null,
    selectedItem = null,
    subtitlesCSSStyle = null,
    legendChart = null,
    durationTime = null;
    durationTimeSpan = null,
    elapsedTimeSpan = null,
    hidebarsTimeout = 5000,
    updateGraph = false,
    graphUpdateTimeInterval = 200, // in milliseconds
    graphUpdateWindow = 30000, // in milliseconds
    graphSteps = graphUpdateWindow / graphUpdateTimeInterval,
    graphTimer = null,
    graphElapsedTime = 0,
    isMute = false,
    lastChartTimeLabel = -1;
    firstChartTime = -1,
    timer = null,
    streamFilters = {
        vod: true,
        live: true,
        hls: true,
        mss: true,
        dash: true
    },
    lineChartData = {
        labels: [],
        datasets: [{
            label: "— Downloaded Bitrate",
            fillColor: "rgba(41, 128, 185, 0.2)",
            strokeColor: "rgba(41, 128, 185, 1)",
            pointColor: "rgba(41, 128, 185, 1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(220,220,220,1)",
            data: []
        }, {
            label: "— Played Bitrate",
            fillColor: "rgba(231, 76, 60, 0.2)",
            strokeColor: "rgba(231, 76, 60, 1)",
            pointColor: "rgba(231, 76, 60, 1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            data: []
        }]
    };

window.onload = function() {

    var buildStreamsList = function(jsonList) {
        // Prepare stream table
        var tableNode = document.getElementById('streams-table'),
            i;

        if (tableNode) {
            while (tableNode.firstChild) {
                tableNode.removeChild(tableNode.firstChild);
            }
        } else {
            tableNode = document.createElement('table');
            tableNode.id = 'streams-table';
            document.getElementById('streams-container').appendChild(tableNode);
        }

        var streamsList = JSON.parse(jsonList);

        // Add stream elements
        for (i = 0, len = streamsList.items.length; i < len; i++) {
            var stream = streamsList.items[i];

            if (stream.protocol) {
                var streamItem = createStreamEntry(stream);
                tableNode.appendChild(streamItem);
            }
        }
    };

    var createStreamEntry = function(stream) {
        var streamItem = document.createElement('tr'),
            streamItemName = document.createElement('td'),
            streamItemProtocol = document.createElement('td'),
            streamItemType = document.createElement('td'),
            streamItemTypeIcon = document.createElement('img'),
            streamItemProtection = document.createElement('td'),
            className = "stream-item";

        streamItem.appendChild(streamItemType);
        streamItem.appendChild(streamItemName);
        streamItem.appendChild(streamItemProtocol);
        streamItem.appendChild(streamItemProtection);

        if (stream.type.toLowerCase() === 'live') {
            className += " stream-live";
            streamItemTypeIcon.src = 'res/live_icon.png';
        } else if (stream.type.toLowerCase() === 'vod') {
            className += " stream-vod";
            streamItemTypeIcon.src = 'res/vod_icon.png';
        }

        streamItemType.appendChild(streamItemTypeIcon);
        streamItemName.innerHTML = stream.name;
        streamItemProtocol.innerHTML = stream.protocol;
        className += " stream-" + stream.protocol.toLowerCase();

        var protections = [];
        if (stream.protData) {
            var protectionsNames = Object.getOwnPropertyNames(stream.protData);
            for (var i = 0, len = protectionsNames.length; i < len; i++) {
                if (S(protectionsNames[i]).contains('playready')) {
                    className += " stream-playready";
                    protections.push("PR");
                } else if (S(protectionsNames[i]).contains('widevine')) {
                    className += " stream-widevine";
                    protections.push("WV");
                }
            }
        }

        streamItemProtection.innerHTML = protections.join(',');

        streamItem.setAttribute('class', className);

        streamItem.addEventListener('click', function() {
            if (selectedItem !== null) {
                selectedItem.id = '';
            }

            selectedItem = this;
            selectedItem.id = 'stream-selected';
            onStreamClicked(stream);
        });

        return streamItem;
    };

    var loadStreamList = function() {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', document.location + '/../json/sources.json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                buildStreamsList(xhr.responseText);
            }
        };
        xhr.send();
    };

    loadStreamList();
    initMetricsAgentOptions();
    getDOMElements();
    createHasPlayer();
    registerGUIEvents();
};

var initStreamListFilter = function() {
    var vodFilter = document.getElementById('display-vod-streams'),
    liveFilter = document.getElementById('display-live-streams'),
    hlsFilter = document.getElementById('display-hls-streams'),
    mssFilter = document.getElementById('display-mss-streams'),
    dashFilter = document.getElementById('display-dash-streams');

    var filterStreams = function() {
        var elts = document.getElementsByClassName("stream-item");

        for (var i = 0, len = elts.length; i < len; i++) {
            var className = elts[i].className;
            var hidden = false;
            if ((streamFilters.vod && (className.indexOf("stream-vod") !== -1) ||
                streamFilters.live && (className.indexOf("stream-live") !== -1)) &&
                (streamFilters.hls && (className.indexOf("stream-hls") !== -1) ||
                streamFilters.mss && (className.indexOf("stream-mss") !== -1) ||
                streamFilters.dash && (className.indexOf("stream-dash") !== -1))) {
                elts[i].style.display = "";
            } else {
                elts[i].style.display = "none";
            }
        }
    };

    vodFilter.addEventListener("click", function(e) { streamFilters.vod = this.checked; filterStreams(); });
    liveFilter.addEventListener("click", function(e) { streamFilters.live = this.checked; filterStreams(); });
    hlsFilter.addEventListener("click", function(e) { streamFilters.hls = this.checked; filterStreams(); });
    mssFilter.addEventListener("click", function(e) { streamFilters.mss = this.checked; filterStreams(); });
    dashFilter.addEventListener("click", function(e) { streamFilters.dash = this.checked; filterStreams(); });
};

var initMetricsAgentOptions = function() {
        var reqMA = new XMLHttpRequest();
        reqMA.onload = function () {
            if (reqMA.status === 200) {
                configMetrics = JSON.parse(reqMA.responseText);

                metricsOptions.innerHTML = '';

                for (var i = 0, len = configMetrics.items.length; i < len; i++) {
                    metricsOptions.innerHTML += '<option value="' + i + '">' + configMetrics.items[i].name + '</option>';
                }
                metricsOptions.selectedIndex = -1;
            }
        };
        reqMA.open("GET", "./json/metricsagent_config.json", true);
        reqMA.setRequestHeader("Content-type", "application/json");
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
    audioList = document.getElementById('audioCombo');
    previousChannel = document.getElementById('previousChannel');
    nextChannel = document.getElementById('nextChannel');
    subtitleList = document.getElementById('subtitleCombo');
    playPauseButton = document.getElementById('button-playpause');
    playerContainer = document.getElementById("demo-player-container");
    loadingElement = document.getElementById("LoadingModule");
    menuButton = document.getElementById("menuButton");
    menuModule = document.getElementById("MenuModule");
    languagesModule = document.getElementById("LanguagesModule");
    languagesButton = document.getElementById("languagesButton");
    videoQualityButton = document.getElementById("videoQualityButton");
    qualityModule = document.getElementById("QualityModule");
    closeButton = document.getElementById("CloseCrossModule");
    controlBarModule = document.getElementById("ControlBarModule");

    highBitrateSpan = document.getElementById("highBitrateSpan");
    currentBitrateSpan = document.getElementById("bandwith-binding");
    lowBitrateSpan = document.getElementById("lowBitrateSpan");

    errorModule = document.getElementById("ErrorModule");
    titleError = document.getElementById("titleError");
    smallErrorMessage = document.getElementById("smallMessageError");
    longErrorMessage = document.getElementById("longMessageError");

    durationTimeSpan = document.querySelector(".op-seek-bar-time-remaining span");
    elapsedTimeSpan = document.querySelector(".op-seek-bar-time-elapsed span");

    seekbarContainer = document.querySelector(".bar-container");
    seekbar = document.querySelector('.bar-seek');
    seekbarBackground = document.querySelector('.bar-background');

    protectionDataContainer = document.getElementById('protection-data-container');

    streamUrl = document.querySelector(".stream-url");

    globalMenu = document.getElementById("globalMenu");
    menuContainer = document.getElementById("menu-container");

    metricsOptions =  document.getElementById("metrics-agent-options");
    enableMetricsCheckbox = document.getElementById("enable-metrics-agent");

    defaultAudioLangCombobox = document.getElementById("default_audio_language");
    defaultSubtitleLangCombobox = document.getElementById("default_subtitle_language");

    enableOptimzedZappingCheckbox = document.getElementById("enable-optimized-zapping");
};

var registerGUIEvents = function() {
    volumeButton.addEventListener('click', onMuteEnter);
    volumeButton.addEventListener('mouseenter', onMuteEnter);
    panelVolume.addEventListener('mouseover', onPanelVolumeEnter);
    panelVolume.addEventListener('mouseout', onPanelVolumeOut);
    fullscreenButton.addEventListener('click', onFullScreenClicked);
    sliderVolume.addEventListener('change', onSliderVolumeChange);
    audioList.addEventListener('change', audioChanged);
    subtitleList.addEventListener('change', subtitleChanged);
    playPauseButton.addEventListener('click', onPlayPauseClicked);
    video.addEventListener('dblclick', onFullScreenClicked);
    video.addEventListener("ended", onVideoEnded);

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

    globalMenu.addEventListener('click', onGlobalMenuClicked);

    enableMetricsCheckbox.addEventListener('click', onEnableMetrics);
    metricsOptions.addEventListener('change', onSelectMetricsAgent);

    defaultAudioLangCombobox.addEventListener('change', onChangeDefaultAudioLang);
    defaultSubtitleLangCombobox.addEventListener('change', onChangeDefaultSubtitleLang);

    enableOptimzedZappingCheckbox.addEventListener('click', onEnableOptimizedZapping);

    initStreamListFilter();
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

    clearProtectionData();

    if (streamInfos.protData) {
        displayProtectionData(streamInfos.protData);
    }
    showBarsTimed();

    if (graphTimer === null) {
        graphTimer = new LoopTimer(handleGraphUpdate, graphUpdateTimeInterval);
    } else {
        graphTimer.stop();
    }

    streamUrl.innerHTML = streamInfos.url;
};

var onFullScreenChange = function(e) {
    var state = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
    if (!state) {
        document.getElementById("demo-player-container").className = "demo-player";
    }
};

var onSeekBarModuleEnter = function(e) {
    seekbar.className = "bar-seek bar-seek-zoom";
    seekbarBackground.className = "bar-background bar-seek-zoom";
};

var onSeekBarModuleLeave = function(e) {
    seekbar.className = "bar-seek";
    seekbarBackground.className = "bar-background";
};

var onSeekClicked = function(e) {
    if (durationTime) {
        setSeekValue(e.offsetX * durationTime / seekbarBackground.clientWidth);
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

    if (e.target === audioList) {
        // audioListInPlayer.selectedIndex = audioList.selectedIndex;
    } else {
        audioList.selectedIndex = audioListInPlayer.selectedIndex;
    }
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
        audioList.selectedIndex = index;
    }
};

var onSubtitleRadioClicked = function(e) {
    var index = getTrackIndex(subtitleTracks, e.target.value);

    if (index !== -1) {
        changeSubtitle(index);
        subtitleList.selectedIndex = index;
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
    if (sliderVolume.value === "0") {
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
        document.getElementById("demo-player-container").className = "demo-player-fullscreen";
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
        document.getElementById("demo-player-container").className = "demo-player";
    }
    setSubtitlesCSSStyle(subtitlesCSSStyle);
};

var onPreviousClicked = function() {
    selectedItem.previousSibling.click();
};

var onNextChannelClicked = function() {
    selectedItem.nextSibling.click();
};

var onMenuClicked = function() {
    if (hasClass(menuModule, "op-hidden-translate-up")) {
        menuModule.className = "op-menu op-show-translate-up";
    } else {
        menuModule.className = "op-menu op-hidden-translate-up";
    }
};

var onLanguagesClicked = function() {
    if (!hasClass(qualityModule, "op-hidden")) {
        qualityModule.className = "op-screen op-settings-quality op-hidden";
    }

    if (hasClass(languagesModule, "op-hidden")) {
        languagesModule.className = "op-screen op-languages";
        hideControlBar();
        enableMiddleContainer(true);
        clearTimeout(timer);
    } else {
        languagesModule.className = "op-screen op-languages op-hidden";
        showControlBar();
        enableMiddleContainer(false);
        showBarsTimed();
    }
};

var onVideoQualityClicked = function() {
    if (!hasClass(languagesModule, "op-hidden")) {
        languagesModule.className = "op-screen op-languages op-hidden";
    }

    if (hasClass(qualityModule, "op-hidden")) {
        qualityModule.className = "op-screen op-settings-quality";
        hideControlBar();
        enableMiddleContainer(true);
        clearTimeout(timer);
    } else {
        qualityModule.className = "op-screen op-settings-quality op-hidden";
        showControlBar();
        enableMiddleContainer(false);
        showBarsTimed();
    }

};

var onCloseButtonClicked = function() {
    languagesModule.className = "op-screen op-languages op-hidden";
    qualityModule.className = "op-screen op-settings-quality op-hidden";
    enableMiddleContainer(false);
    closeButton.className = "op-close op-hidden";
    showControlBar();
};

var onGlobalMenuClicked = function() {
    if (menuContainer.className.indexOf("menu-container-closed") !== -1) {
        menuContainer.className = "";
    } else {
        menuContainer.className = 'menu-container-closed';
    }
};

var onEnableMetrics = function() {
    if (enableMetricsCheckbox.checked) {
        metricsOptions.disabled = false;
    } else {
        enableMetricsCheckbox.checked = true;
        //metricsOptions.disabled = true;
    }
};

var onSelectMetricsAgent = function (value) {
    if (typeof MetricsAgent === 'function') {
        if (enableMetricsCheckbox.checked) {
            orangeHasPlayer.loadMetricsAgent(configMetrics.items[metricsOptions.selectedIndex]);
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

    var checked = selectedAudioTrack.id === audioTrack.id ? 'checked="checked"' : "";
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
        addCombo(audioTracks, audioList);
        selectCombo(audioTracks, audioList, currentaudioTrack);

        for (i = 0; i < audioTracks.length; i++) {
            addLanguageLine(audioTracks[i], currentaudioTrack);
        }
    }
};

var handleDuration = function(duration) {
    durationTime = duration;
    if (duration !== Infinity) {
        durationTimeSpan.textContent = setTimeWithSeconds(duration);
    } else {
        durationTimeSpan.textContent = "00:00:00";
        handleTimeUpdate(0);
    }
};

var handleVolumeChange = function(volumeLevel) {
    volumeLabel.innerHTML = Math.round(volumeLevel * 100);
    if (sliderVolume.value === 0) {
        sliderVolume.className = "op-volume";
    } else if (sliderVolume.value > 0 && sliderVolume.value <= 8) {
        sliderVolume.className = "op-volume op-range8";
    } else if (sliderVolume.value > 8 && sliderVolume.value <= 16) {
        sliderVolume.className = "op-volume op-range16";
    } else if (sliderVolume.value >= 16 && sliderVolume.value <= 24) {
        sliderVolume.className = "op-volume op-range24";
    } else if (sliderVolume.value >= 24 && sliderVolume.value <= 32) {
        sliderVolume.className = "op-volume op-range32";
    } else if (sliderVolume.value >= 32 && sliderVolume.value <= 40) {
        sliderVolume.className = "op-volume op-range40";
    } else if (sliderVolume.value >= 40 && sliderVolume.value <= 48) {
        sliderVolume.className = "op-volume op-range48";
    } else if (sliderVolume.value >= 48 && sliderVolume.value <= 56) {
        sliderVolume.className = "op-volume op-range56";
    } else if (sliderVolume.value >= 56 && sliderVolume.value <= 64) {
        sliderVolume.className = "op-volume op-range64";
    } else if (sliderVolume.value >= 64 && sliderVolume.value <= 72) {
        sliderVolume.className = "op-volume op-range72";
    } else if (sliderVolume.value >= 72 && sliderVolume.value <= 80) {
        sliderVolume.className = "op-volume op-range80";
    } else if (sliderVolume.value >= 80 && sliderVolume.value <= 88) {
        sliderVolume.className = "op-volume op-range88";
    } else if (sliderVolume.value >= 88 && sliderVolume.value <= 96) {
        sliderVolume.className = "op-volume op-range96";
    } else if (sliderVolume.value >= 96) {
        sliderVolume.className = "op-volume op-range100";
    }
};

var handleTimeUpdate = function(time) {
    elapsedTimeSpan.textContent = setTimeWithSeconds(time);
    if (durationTime !== Infinity) {
        var progress = (time / durationTime) * 100;
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
        addCombo(subtitleTracks, subtitleList);
        selectCombo(subtitleTracks, subtitleList, currentsubtitleTrack);

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
        showLoadingElement();
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
    var label = "";

    elapsedTime /= 1000;

    if (elapsedTime >= lastChartTimeLabel + 1) {
        lastChartTimeLabel = Math.floor(elapsedTime);
        label = lastChartTimeLabel;
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
    var ctx = document.getElementById("canvas").getContext("2d");

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
            legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<lineChartData.datasets.length; i++){%><li><span style=\"color:<%=lineChartData.datasets[i].strokeColor%>\"><%if(lineChartData.datasets[i].label){%><%=lineChartData.datasets[i].label%><%}%></span></li><%}%></ul>"

        });

        if (legendChart === null) {
            legendChart = window.myLine.generateLegend();
            document.getElementById('chartLegend').innerHTML = legendChart;
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

        document.getElementById("cueStyle").innerHTML = '::cue{ background-color:' + style.data.backgroundColor + ';color:' + style.data.color + ';font-size: ' + fontSize + 'px;font-family: ' + style.data.fontFamily + '}';
    }
};

var addCombo = function(tracks, combo) {
    var i, option;

    for (i = 0; i < tracks.length; i++) {
        option = document.createElement("option");
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
    durationTimeSpan.textContent = "00:00:00";
    elapsedTimeSpan.textContent = "00:00:00";
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
    resetCombo(audioTracks, audioList);
    resetCombo(subtitleTracks, subtitleList);

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

    lastChartTimeLabel = -1;
    firstChartTime = -1;
    graphElapsedTime = 0;
};

var setVolumeOff = function(value) {
    if (value) {
        volumeOffSvg.style.display = "block";
        volumeOnSvg.style.display = "none";
    } else {
        volumeOffSvg.style.display = "none";
        volumeOnSvg.style.display = "block";
    }
};

var setPlaying = function(value) {
    if (value) {
        playPauseButton.className = "tooltip op-play op-pause stop-anchor";
        playPauseButton.title = "Pause";
    } else {
        playPauseButton.className = "tooltip op-play stop-anchor";
        playPauseButton.title = "Play";
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
    panelVolume.className = "op-container-volume";
};

var hideVolumePanel = function() {
    clearTimeout(volumeTimer);
    panelVolume.className = "op-container-volume op-hidden";
};

var showLoadingElement = function() {
    loadingElement.className = "op-loading";
};

var hideLoadingElement = function() {
    loadingElement.className = "op-loading op-none";
};

var hideControlBar = function() {
    controlBarModule.className = "op-control-bar op-none";
};

var showControlBar = function() {
    controlBarModule.className = "op-control-bar";
};

var showErrorModule = function() {
    errorModule.className = "op-error";
};

var hideErrorModule = function() {
    errorModule.className = "op-error op-hidden";
};

var hideBars = function() {
    controlBarModule.className = "op-control-bar op-fade-out";
    menuModule.className = "op-menu op-hidden-translate-up";

    languagesModule.className = "op-screen op-languages op-hidden";
    qualityModule.className = "op-screen op-settings-quality op-hidden";
    enableMiddleContainer(false);
    closeButton.className = "op-close op-hidden";
};

var showBarsTimed = function(e) {
    if (hasClass(document.querySelector('.op-middle-container'), "disabled")) {
        clearTimeout(timer);
        timer = setTimeout(hideBars, hidebarsTimeout);
        controlBarModule.className = "op-control-bar";
    }
};

var clearProtectionData = function() {
    protectionDataContainer.innerHTML = "";
};

var displayProtectionData = function(streamInfos) {
    var html = "<table>";

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
        document.querySelector('.op-middle-container').className = "op-middle-container";
        closeButton.className = "op-close";
    } else {
        document.querySelector('.op-middle-container').className = "op-middle-container disabled";
        closeButton.className = "op-close op-hidden";
    }
};

var setTimeWithSeconds = function(sec) {
    var sec_num = parseInt(sec, 10); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var time = hours + ':' + minutes + ':' + seconds;
    return time;
};

function hasClass(element, className) {
    return element.className && new RegExp("(^|\\s)" + className + "(\\s|$)").test(element.className);
};
