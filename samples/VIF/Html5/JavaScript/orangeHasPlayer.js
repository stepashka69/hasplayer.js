var orangeHasPlayer = null,
    config = null,
    video = null,
    currentStreamInfos = null,
    playerPanel = null,
    stream = {
            "type": "VOD",
            "protocol": "MSS",
            "name": "VIF",
            "url": streamMss,
            "browsers": "cdsbi"
    };

/********************************************************************************************************************
 *
 *
 *                  Init functions
 *
 *
 **********************************************************************************************************************/
function createHasPlayer(isSubtitleExternDisplay) {
    orangeHasPlayer = new OrangeHasPlayer();
    video = document.getElementById('player');

    orangeHasPlayer.init(video);
    orangeHasPlayer.enableSubtitleExternDisplay(isSubtitleExternDisplay);
    orangeHasPlayer.setInitialQualityFor('video', 0);
    orangeHasPlayer.setInitialQualityFor('audio', 0);

    /* hasPlayerConfig_dev */
    loadHasPlayerConfig('./Html5/json/hasplayer_config.json');
    /* hasPlayerConfig_dev */

    orangeHasPlayer.setDebug(false);
    orangeHasPlayer.setDefaultAudioLang('fra');
    orangeHasPlayer.setDefaultSubtitleLang('fre');
    orangeHasPlayer.enableSubtitles(true);
    registerHasPlayerEvents();

    playerPanel = new PlayerPanel(true);
    playerPanel.init();
    stream.url = streamMss;
    loadStream(stream, 'true');
}

function registerHasPlayerEvents() {
    orangeHasPlayer.addEventListener('warning', onWarning);
    orangeHasPlayer.addEventListener('error', onError);
    orangeHasPlayer.addEventListener('cueEnter', onSubtitleEnter);
    orangeHasPlayer.addEventListener('cueExit', onSubtitleExit);
    orangeHasPlayer.addEventListener('play', onPlay);
    orangeHasPlayer.addEventListener('pause', onPause);
    orangeHasPlayer.addEventListener('ended', onEnd);
    orangeHasPlayer.addEventListener('state_changed', onStateChanged);
    orangeHasPlayer.addEventListener('manifestUrlUpdate', onManifestUrlUpdate);
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

    reqConfig.open('GET', fileUrl, true);
    reqConfig.setRequestHeader('Content-type', 'application/json');
    reqConfig.send();
}

/********************************************************************************************************************
 *
 *
 *                   OrangeHasPlayer Events
 *
 *
 **********************************************************************************************************************/

/**
 * [onSubtitlesStyleChanged description]
 * @param  {[type]} e [description]
 */
function onSubtitleEnter(e) {
    handleSubtitleEnter(e.data);
}

function onSubtitleExit(e) {
    handleSubtitleExit(e.data);
}

/**
 * [onWarning description]
 * @param  {[type]} e [description]
 */
function onWarning(e) {
    console.log(e.data);
}

/**
 * [onError description]
 * @param  {[type]} e [description]
 */
function onError(e) {
    orangeHasPlayer.reset(2);
    console.log(e.data);
}

function onPlay() {
    handlePlayState(true);
}

function onPause() {
    handlePlayState(false);
}

function onEnd() {
    handleVideoEnd();
}

function onStateChanged(e) {
    if (e.detail.type === 'video') {
        if (e.detail.state === 'buffering') {
            handleBuffering(true);
        } else if (e.detail.state === 'playing') {
            handleBuffering(false);
        }
    }
}

function onManifestUrlUpdate() {
    if (currentStreamInfos) {
        orangeHasPlayer.refreshManifest(currentStreamInfos.url);
    }
}

/********************************************************************************************************************
 *
 *
 *                   OrangeHasPlayer function calls
 *
 *
 **********************************************************************************************************************/
function loadStream(streamInfos, optimizedZappingEnabled) {
    handleBuffering(true);
    if (!optimizedZappingEnabled) {
        orangeHasPlayer.setInitialQualityFor('video', 0);
        orangeHasPlayer.setInitialQualityFor('audio', 0);
    }
    currentStreamInfos = streamInfos;
   
    orangeHasPlayer.load(streamInfos.url, streamInfos.protData);
}

/**********************************************************************************************************************/

var handleBuffering = function(show){
    if (show === true) {
        playerPanel.showLoadingElement();
    }else{
        playerPanel.hideLoadingElement();
    }
};

var handlePlayState = function(state) {
    if (state === true) {
        playerPanel.hideLoadingElement();
    }
};

var handleSubtitleEnter = function(subtitleData) {
    playerPanel.enterSubtitle(subtitleData);
};

var handleSubtitleExit = function(subtitleData) {
    playerPanel.exitSubtitle(subtitleData);
};