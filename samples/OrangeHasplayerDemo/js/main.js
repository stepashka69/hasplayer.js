var // Main Container
    streamUrl = null,

    // Modules
    playerPanel = null,
    streamsPanel = null,
    graphPanel = null,
    protectionDataPanel = null,
    settingsPanel = null,
    isChrome = false,

    minivents = null;

window.onload = function() {
    minivents = new Events();

    isChrome = bowser.chrome === true ? true : false;

    playerPanel = new PlayerPanel(!isChrome);
    playerPanel.init();

    streamsPanel = new StreamsPanel();
    streamsPanel.init();

    graphPanel = new GraphPanel();
    protectionDataPanel = new ProtectionDataPanel();
    protectionDataPanel.init(document.getElementById('protection-data-container'));

    settingsPanel = new SettingsPanel();
    settingsPanel.init();

    getDOMElements();
    createHasPlayer(!isChrome);

    displayVersion();

    var urlParam = getURLParameter('url');
    if (urlParam) {
        onStreamClicked({url: urlParam, protData: undefined});
    }
};

var getDOMElements = function() {
    streamUrl = document.querySelector('.stream-url');
};

var displayVersion = function() {
    var title = document.getElementById('app-title');
    title.innerHTML += ' ' + orangeHasPlayer.getVersionFull();
};

var getURLParameter = function (name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
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
    loadStream(streamInfos, settingsPanel.optimizedZappingEnabled);

    if (streamInfos.protData) {
        protectionDataPanel.display(streamInfos.protData);
    }

    graphPanel.initTimer();

    streamUrl.innerHTML = streamInfos.url;
};


/********************************************************************************************************************
 *
 *
 *                  functions called by OrangeHasPlayer to update GUI
 *
 *
 **********************************************************************************************************************/

var handleAudioData = function(_audioTracks, _selectedAudioTrack) {
    settingsPanel.updateAudioData(_audioTracks, _selectedAudioTrack);
    playerPanel.resetLanguageLines();
    playerPanel.updateAudioData(_audioTracks, _selectedAudioTrack);
};

var handleSubtitleData = function(_subtitleTracks, _selectedSubtitleTrack) {
    settingsPanel.updateSubtitleData(_subtitleTracks, _selectedSubtitleTrack);
    playerPanel.updateSubtitleData(_subtitleTracks, _selectedSubtitleTrack);
};

var handleSubtitleEnter = function(subtitleData) {
    playerPanel.enterSubtitle(subtitleData);
};

var handleSubtitleExit = function(subtitleData) {
    playerPanel.exitSubtitle(subtitleData);
};

var handlePlayState = function(state) {
    playerPanel.setPlaying(state);
    if (state === true) {
        playerPanel.hideLoadingElement();
        graphPanel.timer.start();
    } else {
        graphPanel.timer.pause();
    }
};

var handleBuffering = function(show){
    if (show === true) {
        playerPanel.showLoadingElement();
    }else{
        playerPanel.hideLoadingElement();
    }
};

var handleVolumeChange = function(volumeLevel) {
    playerPanel.onVolumeChange(volumeLevel);
};

var handleDuration = function(duration) {
   playerPanel.setDuration(duration);
};

var handleTimeUpdate = function(time) {
    playerPanel.setPlayingTime(time);
};

var handleDownloadedBitrate = function(bitrate, time) {
    graphPanel.lastDownloadedBitrate = bitrate;
};

var handlePlayBitrate = function(bitrate, time) {
    graphPanel.lastPlayedBitrate = bitrate;
    playerPanel.setCurrentBitrate(bitrate);
};

var handleBufferLevelUpdated = function(type, level) {
    if (type === "video") {
        settingsPanel.videoBufferLength.innerHTML = level +" s";
    }else if (type === "audio") {
        settingsPanel.audioBufferLength.innerHTML = level +" s";
    }
};

var handleBitrates = function(bitrates) {
    var ctx = document.getElementById('canvas').getContext('2d');
    graphPanel.init(ctx, bitrates);
};

var handleWarning = function(warning) {
    console.warn("Code: " + warning.code + ", message: " + warning.message, warning.data);
};

var handleError = function(error) {
    playerPanel.displayError(error.code, error.message);
};

var handleVideoEnd = function(){
    playerPanel.reset();
    handleBuffering(false);
};

/**********************************************************************************************************************/

var reset = function() {
    protectionDataPanel.clear();
    playerPanel.reset();
    graphPanel.reset();
    settingsPanel.reset();
};