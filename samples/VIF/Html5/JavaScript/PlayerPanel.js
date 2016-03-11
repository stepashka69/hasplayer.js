var PlayerPanel = function(isSubtitleExternDisplay) {
    this.video = null;
    this.playerContainer = null;
    
    this.videoDuration = null;

    this.loadingElement = null;

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
    this.loadingElement = document.getElementById('LoadingModule');

    this.setupEventListeners();
};

PlayerPanel.prototype.setupEventListeners = function() {
    this.playerContainer.addEventListener('webkitfullscreenchange', this.onFullScreenChange.bind(this));
    this.playerContainer.addEventListener('mozfullscreenchange', this.onFullScreenChange.bind(this));
    this.playerContainer.addEventListener('fullscreenchange', this.onFullScreenChange.bind(this));
       
    this.video.addEventListener('dblclick', this.onFullScreenClicked.bind(this));
    this.video.addEventListener('ended', this.onVideoEnded.bind(this));

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

PlayerPanel.prototype.onVideoEnded = function(e) {
    minivents.emit('video-ended');
};

PlayerPanel.prototype.showLoadingElement = function() {
    if (orangeHasPlayer.getTrickModeSpeed() === 1) {
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

PlayerPanel.prototype.applySubtitlesCSSStyle = function(style) {
    var fontSize;

    if(!this.isSubtitleExternDisplay){
        document.getElementById('cueStyle').innerHTML = '::cue{ background-color:' + style.backgroundColor + ';color:' + style.color + ';font-size: ' + fontSize + 'px;font-family: ' + style.fontFamily + '}';
    }else{
        this.subTitles.style.bottom = (this.video.videoHeight * 0.05) + "px"; // set the text to appear at 5% from the top of the video

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

PlayerPanel.prototype.enableMiddleContainer = function(enabled) {
    if (enabled) {
        document.querySelector('.op-middle-container').className = 'op-middle-container';
        this.closeButton.className = 'op-close';
    } else {
        document.querySelector('.op-middle-container').className = 'op-middle-container disabled';
        this.closeButton.className = 'op-close op-hidden';
    }
};

PlayerPanel.prototype.reset = function() {
    this.resetSeekbar();
    this.resetLanguageLines();

    this.hideErrorModule();
    this.showBarsTimed();
    this.cleanSubtitlesDiv();
};