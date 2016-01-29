var PlayerPanel = function(isSubtitleExternDisplay) {
    this.video = null;
    this.playerContainer = null;
    this.controlBarModule = null;
    this.menuModule = null;
    this.menuButton = null;

    this.previousChannel = null;
    this.playPauseButton = null;
    this.nextChannel = null;

    this.panelVolume = null;
    this.volumeButton = null;
    this.volumeOnSvg = null;
    this.volumeOffSvg = null;
    this.sliderVolume = null;
    this.volumeLabel = null;
    this.volumeTimer = null;
    this.fullscreenButton = null;

    this.seekbarContainer = null;
    this.seekbar = null;
    this.seekbarBackground = null;
    this.videoDuration = null;
    this.durationTimeSpan = null;
    this.elapsedTimeSpan = null;

    this.videoQualityButton = null;
    this.qualityModule = null;
    this.closeButton = null;
    this.highBitrateSpan = null;
    this.currentBitrateSpan = null;
    this.lowBitrateSpan = null;

    this.languagesModule = null;
    this.languagesButton = null;

    this.loadingElement = null;

    this.errorModule = null;
    this.titleError = null;
    this.smallErrorMessage = null;
    this.longErrorMessage = null;

    this.barsTimer = null;
    this.hidebarsTimeout = 5000;

    this.isMute = false;
    this.subtitlesCSSStyle = null;
    this.subTitles = null;
    this.isSubtitleExternDisplay = isSubtitleExternDisplay;
};

PlayerPanel.prototype.init = function() {
    this.video = document.getElementById('player');

    if (this.isSubtitleExternDisplay) {
        this.subTitles = document.createElement("div");
        this.subTitles.setAttribute('id','subtitleDisplay');
        document.getElementById('VideoModule').appendChild(this.subTitles);
    }

    this.playerContainer = document.getElementById('demo-player-container');
    this.controlBarModule = document.getElementById('ControlBarModule');
    this.menuModule = document.getElementById('MenuModule');
    this.menuButton = document.getElementById('menuButton');

    this.previousChannel = document.getElementById('previousChannel');
    this.playPauseButton = document.getElementById('button-playpause');
    this.nextChannel = document.getElementById('nextChannel');

    this.panelVolume = document.getElementById('panel-volume');
    this.volumeButton = document.getElementById('button-volume');
    this.volumeOnSvg = document.getElementById('volumeOn');
    this.volumeOffSvg = document.getElementById('volumeOff');
    this.sliderVolume = document.getElementById('slider-volume');
    this.volumeLabel = document.getElementById('volumeLabel');
    this.fullscreenButton = document.getElementById('button-fullscreen');

    this.seekbarContainer = document.querySelector('.bar-container');
    this.seekbar = document.querySelector('.bar-seek');
    this.seekbarBackground = document.querySelector('.bar-background');
    this.durationTimeSpan = document.querySelector('.op-seek-bar-time-remaining span');
    this.elapsedTimeSpan = document.querySelector('.op-seek-bar-time-elapsed span');

    this.videoQualityButton = document.getElementById('videoQualityButton');
    this.qualityModule = document.getElementById('QualityModule');
    this.closeButton = document.getElementById('CloseCrossModule');
    this.highBitrateSpan = document.getElementById('highBitrateSpan');
    this.currentBitrateSpan = document.getElementById('bandwith-binding');
    this.lowBitrateSpan = document.getElementById('lowBitrateSpan');

    this.languagesModule = document.getElementById('LanguagesModule');
    this.languagesButton = document.getElementById('languagesButton');

    this.loadingElement = document.getElementById('LoadingModule');

    this.errorModule = document.getElementById('ErrorModule');
    this.titleError = document.getElementById('titleError');
    this.smallErrorMessage = document.getElementById('smallMessageError');
    this.longErrorMessage = document.getElementById('longMessageError');

    this.setupEventListeners();
};

PlayerPanel.prototype.setupEventListeners = function() {
    this.playerContainer.addEventListener('webkitfullscreenchange', this.onFullScreenChange.bind(this));
    this.playerContainer.addEventListener('mozfullscreenchange', this.onFullScreenChange.bind(this));
    this.playerContainer.addEventListener('fullscreenchange', this.onFullScreenChange.bind(this));
    this.playerContainer.addEventListener('mouseenter', this.showBarsTimed.bind(this));
    this.playerContainer.addEventListener('mousemove', this.showBarsTimed.bind(this));
    this.playerContainer.addEventListener('click', this.showBarsTimed.bind(this));
    this.volumeButton.addEventListener('click', this.onMuteEnter.bind(this));
    this.volumeButton.addEventListener('mouseenter', this.onMuteEnter.bind(this));
    this.panelVolume.addEventListener('mouseover', this.onPanelVolumeEnter.bind(this));
    this.panelVolume.addEventListener('mouseout', this.onPanelVolumeOut.bind(this));
    this.fullscreenButton.addEventListener('click', this.onFullScreenClicked.bind(this));
    this.sliderVolume.addEventListener('change', this.onSliderVolumeChange.bind(this));

    this.videoQualityButton.addEventListener('click', this.onVideoQualityClicked.bind(this));
    this.playPauseButton.addEventListener('click', this.onPlayPauseClicked.bind(this));
    this.video.addEventListener('dblclick', this.onFullScreenClicked.bind(this));
    this.video.addEventListener('ended', this.onVideoEnded.bind(this));

    this.previousChannel.addEventListener('click', this.onPreviousClicked.bind(this));
    this.nextChannel.addEventListener('click', this.onNextChannelClicked.bind(this));

    this.seekbarContainer.addEventListener('mouseenter', this.onSeekBarModuleEnter.bind(this));
    this.seekbarContainer.addEventListener('mouseleave', this.onSeekBarModuleLeave.bind(this));
    this.seekbarBackground.addEventListener('click', this.onSeekClicked.bind(this));
    this.seekbar.addEventListener('click', this.onSeekClicked.bind(this));

    this.menuButton.addEventListener('click', this.onMenuClicked.bind(this));
    this.languagesButton.addEventListener('click', this.onLanguagesClicked.bind(this));
    this.closeButton.addEventListener('click', this.onCloseButtonClicked.bind(this));

    this.video.addEventListener('waiting', this.onWaiting.bind(this));
    this.video.addEventListener('playing', this.onPlaying.bind(this));
};


/**************************************
 * Events handlers
 **************************************/

PlayerPanel.prototype.onFullScreenChange = function(e) {
    var state = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
    if (!state) {
        document.getElementById('demo-player-container').className = 'demo-player';
    }
};

PlayerPanel.prototype.onMenuClicked = function() {
    if (hasClass(this.menuModule, 'op-hidden-translate-up')) {
        this.menuModule.className = 'op-menu op-show-translate-up';
    } else {
        this.menuModule.className = 'op-menu op-hidden-translate-up';
    }
};

PlayerPanel.prototype.onMuteEnter = function() {
    this.showVolumePanel();
    this.restartVolumeTimer();
};

PlayerPanel.prototype.restartVolumeTimer = function() {
    var self = this;

    clearTimeout(this.volumeTimer);
    this.volumeTimer = setTimeout(function() {
        self.hideVolumePanel();
    }, 3000);
};

PlayerPanel.prototype.onPanelVolumeEnter = function() {
    this.stopVolumeTimer();
};

PlayerPanel.prototype.onPanelVolumeOut = function() {
    this.restartVolumeTimer();
};

PlayerPanel.prototype.stopVolumeTimer = function() {
    clearTimeout(this.volumeTimer);
};

PlayerPanel.prototype.onMuteClicked = function() {
    setPlayerMute();
    this.setVolumeOff(orangeHasPlayer.getMute());
    this.hideVolumePanel();
};

PlayerPanel.prototype.showVolumePanel = function() {
    this.panelVolume.className = 'op-container-volume';
};

PlayerPanel.prototype.hideVolumePanel = function() {
    clearTimeout(this.volumeTimer);
    this.panelVolume.className = 'op-container-volume op-hidden';
};

PlayerPanel.prototype.onSliderVolumeChange = function() {
    if (this.sliderVolume.value === '0') {
        this.onMuteClicked();
        this.isMute = true;
    } else if (this.isMute) {
        this.onMuteClicked();
        this.isMute = false;
    }

    setPlayerVolume(parseInt(this.sliderVolume.value, 10) / 100);
};

PlayerPanel.prototype.onVideoQualityClicked = function() {
    if (!hasClass(this.languagesModule, 'op-hidden')) {
        this.languagesModule.className = 'op-screen op-languages op-hidden';
    }

    if (hasClass(this.qualityModule, 'op-hidden')) {
        this.qualityModule.className = 'op-screen op-settings-quality';
        this.hideControlBar();
        this.enableMiddleContainer(true);
        clearTimeout(this.barsTimer);
    } else {
        this.qualityModule.className = 'op-screen op-settings-quality op-hidden';
        this.showControlBar();
        this.enableMiddleContainer(false);
        this.showBarsTimed();
    }
};

PlayerPanel.prototype.setCurrentBitrate = function(bitrate) {
    this.currentBitrateSpan.innerHTML = bitrate / 1000000;
};

PlayerPanel.prototype.onPreviousClicked = function() {
    minivents.emit('play-prev-stream');
};

PlayerPanel.prototype.onPlayPauseClicked = function(e) {
    changePlayerState();
};

PlayerPanel.prototype.onNextChannelClicked = function() {
    minivents.emit('play-next-stream');
};

PlayerPanel.prototype.onSeekBarModuleEnter = function(e) {
    this.seekbar.className = 'bar-seek bar-seek-zoom';
    this.seekbarBackground.className = 'bar-background bar-seek-zoom';
};

PlayerPanel.prototype.onSeekBarModuleLeave = function(e) {
    this.seekbar.className = 'bar-seek';
    this.seekbarBackground.className = 'bar-background';
};

PlayerPanel.prototype.onSeekClicked = function(e) {
    if (!this.videoDuration) {
        return;
    }

    if (this.videoDuration !== Infinity) {
        setSeekValue(e.offsetX * this.videoDuration / this.seekbarBackground.clientWidth);
    } else {
        var range = orangeHasPlayer.getDVRWindowRange(),
            progress = e.offsetX / this.seekbarBackground.clientWidth,
            duration = range.end - range.start,
            seekTime = range.start + (duration * progress);

        setSeekValue(seekTime);
    }
};

PlayerPanel.prototype.setPlaying = function(value) {
    if (value) {
        this.playPauseButton.className = 'tooltip op-play op-pause stop-anchor';
        this.playPauseButton.title = 'Pause';
    } else {
        this.playPauseButton.className = 'tooltip op-play stop-anchor';
        this.playPauseButton.title = 'Play';
    }
};

PlayerPanel.prototype.setDuration = function(duration) {
    this.videoDuration = duration;
    if (duration !== Infinity) {
        this.durationTimeSpan.textContent = setTimeWithSeconds(duration);
    } else {
        this.durationTimeSpan.textContent = '00:00:00';
        this.setPlayingTime(0);
    }
};

PlayerPanel.prototype.setPlayingTime = function(time) {
    var progress;

    this.elapsedTimeSpan.textContent = setTimeWithSeconds(time);
    if (this.videoDuration !== Infinity) {
        progress = (time / this.videoDuration) * 100;
        this.seekbar.style.width = progress + '%';
    } else {
        var range = orangeHasPlayer.getDVRWindowRange();
        if (range !== null && time > 0) {
            this.durationTimeSpan.textContent = setTimeWithSeconds(range.end);
            progress = ((time - range.start) / (range.end - range.start)) * 100;
            this.seekbar.style.width = progress + '%';
        }
    }
};

PlayerPanel.prototype.setVolumeOff = function(value) {
    if (value) {
        this.volumeOffSvg.style.display = 'block';
        this.volumeOnSvg.style.display = 'none';
    } else {
        this.volumeOffSvg.style.display = 'none';
        this.volumeOnSvg.style.display = 'block';
    }
};

PlayerPanel.prototype.onVolumeChange = function(volumeLevel) {
    var sliderValue = parseInt(this.sliderVolume.value, 10);
    this.volumeLabel.innerHTML = Math.round(volumeLevel * 100);
    if (sliderValue === 0) {
        this.sliderVolume.className = 'op-volume';
    } else if (sliderValue > 0 && sliderValue <= 8) {
        this.sliderVolume.className = 'op-volume op-range8';
    } else if (sliderValue > 8 && sliderValue <= 16) {
        this.sliderVolume.className = 'op-volume op-range16';
    } else if (sliderValue >= 16 && sliderValue <= 24) {
        this.sliderVolume.className = 'op-volume op-range24';
    } else if (sliderValue >= 24 && sliderValue <= 32) {
        this.sliderVolume.className = 'op-volume op-range32';
    } else if (sliderValue >= 32 && sliderValue <= 40) {
        this.sliderVolume.className = 'op-volume op-range40';
    } else if (sliderValue >= 40 && sliderValue <= 48) {
        this.sliderVolume.className = 'op-volume op-range48';
    } else if (sliderValue >= 48 && sliderValue <= 56) {
        this.sliderVolume.className = 'op-volume op-range56';
    } else if (sliderValue >= 56 && sliderValue <= 64) {
        this.sliderVolume.className = 'op-volume op-range64';
    } else if (sliderValue >= 64 && sliderValue <= 72) {
        this.sliderVolume.className = 'op-volume op-range72';
    } else if (sliderValue >= 72 && sliderValue <= 80) {
        this.sliderVolume.className = 'op-volume op-range80';
    } else if (sliderValue >= 80 && sliderValue <= 88) {
        this.sliderVolume.className = 'op-volume op-range88';
    } else if (sliderValue >= 88 && sliderValue <= 96) {
        this.sliderVolume.className = 'op-volume op-range96';
    } else if (sliderValue >= 96) {
        this.sliderVolume.className = 'op-volume op-range100';
    }
};

PlayerPanel.prototype.onVideoEnded = function(e) {
    minivents.emit('video-ended');
};

PlayerPanel.prototype.showLoadingElement = function() {
    if (!trickModeEnabled) {
        this.loadingElement.className = 'op-loading';
    }
};

PlayerPanel.prototype.hideLoadingElement = function() {
    this.loadingElement.className = 'op-loading op-none';
};

PlayerPanel.prototype.onWaiting = function() {
    this.showLoadingElement();
};

PlayerPanel.prototype.onPlaying = function() {
    this.hideLoadingElement();
};

PlayerPanel.prototype.hideControlBar = function() {
    this.controlBarModule.className = 'op-control-bar op-none';
};

PlayerPanel.prototype.showControlBar = function() {
    this.controlBarModule.className = 'op-control-bar';
};

PlayerPanel.prototype.showErrorModule = function() {
    this.errorModule.className = 'op-error';
};

PlayerPanel.prototype.hideErrorModule = function() {
    this.errorModule.className = 'op-error op-hidden';
};

PlayerPanel.prototype.hideBars = function() {
    this.controlBarModule.className = 'op-control-bar op-fade-out';
    this.menuModule.className = 'op-menu op-hidden-translate-up';

    this.languagesModule.className = 'op-screen op-languages op-hidden';
    this.qualityModule.className = 'op-screen op-settings-quality op-hidden';
    this.enableMiddleContainer(false);
    this.closeButton.className = 'op-close op-hidden';
};

PlayerPanel.prototype.showBarsTimed = function(e) {
    if (hasClass(document.querySelector('.op-middle-container'), 'disabled')) {
        var self = this;
        clearTimeout(this.barsTimer);
        this.barsTimer = setTimeout(function() {
            self.hideBars();
        }, self.hidebarsTimeout);
        this.controlBarModule.className = 'op-control-bar';
    }
};

PlayerPanel.prototype.onFullScreenClicked = function() {
    if (!document.fullscreenElement && // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
        if (this.playerContainer.requestFullscreen) {
            this.playerContainer.requestFullscreen();
        } else if (this.playerContainer.msRequestFullscreen) {
            this.playerContainer.msRequestFullscreen();
        } else if (this.playerContainer.mozRequestFullScreen) {
            this.playerContainer.mozRequestFullScreen();
        } else if (this.playerContainer.webkitRequestFullscreen) {
            this.playerContainer.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
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
    this.applySubtitlesCSSStyle(this.subtitlesCSSStyle);
};

PlayerPanel.prototype.resetSeekbar = function() {
    this.seekbar.style.width = 0;
    this.durationTimeSpan.textContent = '00:00:00';
    this.elapsedTimeSpan.textContent = '00:00:00';
};

PlayerPanel.prototype.applySubtitlesCSSStyle = function(style) {
    var fontSize;

    if(!this.isSubtitleExternDisplay){
        document.getElementById('cueStyle').innerHTML = '::cue{ background-color:' + style.backgroundColor + ';color:' + style.color + ';font-size: ' + fontSize + 'px;font-family: ' + style.fontFamily + '}';
    }else{
        this.subTitles.style.bottom = (this.controlBarModule.clientHeight + (this.video.videoHeight * 0.05)) + "px"; // set the text to appear at 5% from the top of the video

        if (style) {

            fontSize = style.fontSize;

            if (style.fontSize && style.fontSize[style.fontSize.length - 1] === '%') {
                fontSize = (this.video.clientHeight * style.fontSize.substr(0, style.fontSize.length - 1)) / 100;
            }
            this.subTitles.style.position = 'absolute';
            this.subTitles.style.display = 'block';
            this.subTitles.style.textAlign = 'center';
            this.subTitles.style.padding = '10px';
            this.subTitles.style.backgroundColor = style.backgroundColor;
            this.subTitles.style.color = style.color;
            this.subTitles.style.fontSize = fontSize+'px';
            this.subTitles.style.fontFamily = style.fontFamily;
        }
    }
};

PlayerPanel.prototype.enterSubtitle = function(subtitleData) {
    var style = subtitleData.style;
    
    this.subtitlesCSSStyle = style;
   
    this.applySubtitlesCSSStyle(style);

    if (this.isSubtitleExternDisplay && subtitleData.text) {
        this.subTitles.innerText = subtitleData.text;   // write the text
        this.subTitles.style.left = ((this.video.clientWidth / 2) - (this.subTitles.clientWidth/2))+'px';  // center subtitle on the video
    }
};

PlayerPanel.prototype.cleanSubtitlesDiv = function(){
    if(this.isSubtitleExternDisplay) {
      this.subTitles.innerText = '';
      this.subTitles.style.backgroundColor = 'rgba(0,0,0,0)';
    }
};

PlayerPanel.prototype.exitSubtitle = function(subtitleData) {
    this.cleanSubtitlesDiv();
};

PlayerPanel.prototype.onLanguagesClicked = function() {
    if (!hasClass(this.qualityModule, 'op-hidden')) {
        this.qualityModule.className = 'op-screen op-settings-quality op-hidden';
    }

    if (hasClass(this.languagesModule, 'op-hidden')) {
        this.languagesModule.className = 'op-screen op-languages';
        this.hideControlBar();
        this.enableMiddleContainer(true);
        clearTimeout(this.barsTimer);
    } else {
        this.languagesModule.className = 'op-screen op-languages op-hidden';
        this.showControlBar();
        this.enableMiddleContainer(false);
        this.showBarsTimed();
    }
};

PlayerPanel.prototype.onCloseButtonClicked = function() {
    this.languagesModule.className = 'op-screen op-languages op-hidden';
    this.qualityModule.className = 'op-screen op-settings-quality op-hidden';
    this.enableMiddleContainer(false);
    this.closeButton.className = 'op-close op-hidden';
    this.showControlBar();
};

PlayerPanel.prototype.enableMiddleContainer = function(enabled) {
    if (enabled) {
        document.querySelector('.op-middle-container').className = 'op-middle-container';
        this.closeButton.className = 'op-close';
    } else {
        document.querySelector('.op-middle-container').className = 'op-middle-container disabled';
        this.closeButton.className = 'op-close op-hidden';
    }
};

PlayerPanel.prototype.createLanguageLine = function(audioTrack, selectedAudioTrack, type) {
    var checked = selectedAudioTrack.id === audioTrack.id ? 'checked="checked"' : '',
        lang = audioTrack.lang !== undefined ? audioTrack.lang : audioTrack.id,
        html = '<div class="op-languages-line">' +
        '<input type="radio" name="' + type + '" id="' + audioTrack.id + '" value="' + audioTrack.id + '" ' + checked + ' >' +
        '<label for="' + audioTrack.id + '">' +
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

PlayerPanel.prototype.addLanguageLine = function(audioTrack, selectedAudioTrack) {
    var html = this.createLanguageLine(audioTrack, selectedAudioTrack, 'language'),
        languageContainer = document.querySelector('.op-summary');
    languageContainer.insertAdjacentHTML('beforeend', html);
    document.getElementById(audioTrack.id).addEventListener('click', this.onLanguageRadioClicked.bind(this));
};

PlayerPanel.prototype.addSubtitleLine = function(subtitleTrack, selectedSubtitleTrack) {
    var html = this.createLanguageLine(subtitleTrack, selectedSubtitleTrack, 'subtitle'),
        subtitleContainer = document.querySelector('.op-panel-container');
    subtitleContainer.insertAdjacentHTML('beforeend', html);
    document.getElementById(subtitleTrack.id).addEventListener('click', this.onSubtitleRadioClicked.bind(this));
};

PlayerPanel.prototype.updateAudioData = function(_audioTracks, _currenTrack) {
    var i = 0;
    if (_audioTracks && _currenTrack) {
        for (i = 0; i < _audioTracks.length; i += 1) {
            this.addLanguageLine(_audioTracks[i], _currenTrack);
        }
    }
};

PlayerPanel.prototype.updateSubtitleData = function(_subtitleTracks, _selectedSubtitleTrack) {
    var i = 0;

    if (_subtitleTracks && _selectedSubtitleTrack) {
        for (i = 0; i < _subtitleTracks.length; i += 1) {
            this.addSubtitleLine(_subtitleTracks[i], _selectedSubtitleTrack);
        }
    }
};

PlayerPanel.prototype.onLanguageRadioClicked = function(e) {
    minivents.emit('language-radio-clicked', e.target.value);
};

PlayerPanel.prototype.onSubtitleRadioClicked = function(e) {
    minivents.emit('subtitle-radio-clicked', e.target.value);
};

PlayerPanel.prototype.displayError = function(code, message) {
    this.titleError.innerHTML = code;
    this.smallErrorMessage.innerHTML = message;
    this.showErrorModule();
};

PlayerPanel.prototype.resetLanguageLines = function() {
    var languageLines = document.getElementsByClassName('op-languages-line');

    if (languageLines !== null) {
        while (languageLines.length > 0) {
            languageLines[0].removeEventListener('click', this.onLanguageRadioClicked.bind(this));
            languageLines[0].parentNode.removeChild(languageLines[0]);
        }
    }
};

PlayerPanel.prototype.reset = function() {
    this.resetSeekbar();
    this.resetLanguageLines();

    this.hideErrorModule();
    this.showBarsTimed();
    this.cleanSubtitlesDiv();
};