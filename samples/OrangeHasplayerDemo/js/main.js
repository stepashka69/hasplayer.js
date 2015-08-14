var orangeHasPlayer = null,
    video = null,
    volumeButton = null,
    volumeOnSvg = null,
    volumeOffSvg = null,
    panelVolume = null,
    sliderVolume = null,
    volumeLabel = null;
    volumeTimer = null,
    fullscreenButton = null,
    audioList = null,
    audioListInPlayer = null,
    subtitleList = null,
    audioTracks = [],
    currentaudioTrack = null,
    subtitleTracks = [],
    currentsubtitleTrack = null,
    playPauseButton = null,
    seekbar = null,
    durationText = null,
    currentTimeText = null,
    videoDuration = null,
    downloadedBitrate = [],
    playedBitrate = [],
    subtitlesCSSStyle = null,
    legendChart = null,
    lineChartData = {
        labels : [],
        datasets : [
        {
            label: "Downloaded Bitrate",
            fillColor : "rgba(220,220,220,0.2)",
            strokeColor : "rgba(220,220,220,1)",
            pointColor : "rgba(220,220,220,1)",
            pointStrokeColor : "#fff",
            pointHighlightFill : "#fff",
            pointHighlightStroke : "rgba(220,220,220,1)",
            data : []
        },
        {
            label: "Played Bitrate",
            fillColor : "rgba(151,187,205,0.2)",
            strokeColor : "rgba(151,187,205,1)",
            pointColor : "rgba(151,187,205,1)",
            pointStrokeColor : "#fff",
            pointHighlightFill : "#fff",
            pointHighlightStroke : "rgba(151,187,205,1)",
            data : []
        }]
    };

window.onload = function() {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', document.location + '/../json/sources.json');
    xhr.onreadystatechange = function() {
        //if (xhr.readyState === 3) {
        if (xhr.readyState == 4 && xhr.status == 200) {
            buildStreamsList(xhr.responseText);
        }
    }
    xhr.send();

    getDOMElements();
    createHasPlayer();
    registerGUIEvents();

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
            streamItemProtection = document.createElement('td');

        streamItem.appendChild(streamItemType);
        streamItem.appendChild(streamItemName);
        streamItem.appendChild(streamItemProtocol);
        streamItem.appendChild(streamItemProtection);

        if (stream.type.toLowerCase() === 'live') {
            streamItemTypeIcon.src = 'res/live_icon.png';
        } else if (stream.type.toLowerCase() === 'vod') {
            streamItemTypeIcon.src = 'res/vod_icon.png';
        }

        streamItemType.appendChild(streamItemTypeIcon);
        streamItemName.innerHTML = stream.name;
        streamItemProtocol.innerHTML = stream.protocol;

        var protections = [];
        if (stream.protData) {
            var protectionsNames = Object.getOwnPropertyNames(stream.protData);
            for (var i = 0, len = protectionsNames.length; i < len; i++) {
                if (S(protectionsNames[i]).contains('playready')) {
                    protections.push("PR");
                } else if (S(protectionsNames[i]).contains('widevine')) {
                    protections.push("WV");
                }
            }
        }

        streamItemProtection.innerHTML = protections.join(',');

        streamItem.setAttribute('class', 'stream-item');

        var onStreamClicked = function(streamInfos) {
            reset();
            loadStream(streamInfos);
        }

        streamItem.addEventListener('click', function() {
            onStreamClicked(stream);
        })

        return streamItem;
    }
}

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
    //audioListInPlayer = document.getElementById('audio-tracks');
    subtitleList = document.getElementById('subtitleCombo');
    playPauseButton = document.getElementById('button-playpause');
    //seekbar = document.getElementById('seekBar');
    //durationText = document.getElementById('duration');
    //currentTimeText = document.getElementById('current-time');
}

var registerGUIEvents = function() {
    volumeButton.addEventListener('click', onMuteClicked);
    volumeButton.addEventListener('mouseenter', onMuteEnter);
    panelVolume.addEventListener('mouseover', onPanelVolumeEnter);
    panelVolume.addEventListener('mouseout', onPanelVolumeOut);
    fullscreenButton.addEventListener('click', onFullScreenClicked);
    sliderVolume.addEventListener('change', onSliderVolumeChange);
    /*audioListInPlayer.addEventListener('change', audioChanged);*/
    audioList.addEventListener('change', audioChanged);
    subtitleList.addEventListener('change', subtitleChanged);
    playPauseButton.addEventListener('click', onPlayPauseClicked);
    video.addEventListener('dblclick', onFullScreenClicked); 
    /*seekbar.addEventListener('click', onSeekClicked); */
}

/********************************************************************************************************************
*
*
*                  GUI events
*
*
**********************************************************************************************************************/
var onSeekClicked = function(e) {
    if (videoDuration) {
        setSeekValue(e.offsetX * videoDuration / seekbar.clientWidth);
    }
}

var onPlayPauseClicked = function(e) {
    changePlayerState();
}

var audioChanged = function(e) {
    changeAudio(e.target.selectedIndex);
    if (e.target === audioList) {
       // audioListInPlayer.selectedIndex = audioList.selectedIndex;
    }else{
        audioList.selectedIndex = audioListInPlayer.selectedIndex;
    }
}

var subtitleChanged = function(e) {
    changeSubtitle(e.target.selectedIndex);
}

var onMuteClicked = function() {
    setPlayerMute();
    setVolumeOff(orangeHasPlayer.getMute());
    hideVolumePanel();
}

var onMuteEnter = function() {
    showVolumePanel();
    restartVolumeTimer();
}

var onPanelVolumeEnter = function() {
    stopVolumeTimer();
}

var onSliderVolumeChange = function() {
    setPlayerVolume(sliderVolume.value/100);
    volumeLabel.innerHTML = sliderVolume.value;
    if (sliderVolume.value === 0) {
        sliderVolume.className = "op-volume";
    }else if (sliderVolume.value > 0 &&  sliderVolume.value <= 8) {
        sliderVolume.className = "op-volume op-range8";
    }else if(sliderVolume.value > 8 &&  sliderVolume.value <= 16) {
        sliderVolume.className = "op-volume op-range16";
    }else if(sliderVolume.value >= 16 &&  sliderVolume.value <= 24) {
        sliderVolume.className = "op-volume op-range24";
    }else if(sliderVolume.value >= 24 &&  sliderVolume.value <= 32) {
        sliderVolume.className = "op-volume op-range32";
    }else if(sliderVolume.value >= 32 &&  sliderVolume.value <= 40) {
        sliderVolume.className = "op-volume op-range40";
    }else if(sliderVolume.value >= 40 &&  sliderVolume.value <= 48) {
        sliderVolume.className = "op-volume op-range48";
    }else if(sliderVolume.value >= 48 &&  sliderVolume.value <= 56) {
        sliderVolume.className = "op-volume op-range56";
    }else if(sliderVolume.value >= 56 &&  sliderVolume.value <= 64) {
        sliderVolume.className = "op-volume op-range64";
    }else if(sliderVolume.value >= 64 &&  sliderVolume.value <= 72) {
        sliderVolume.className = "op-volume op-range72";
    }else if(sliderVolume.value >= 72 &&  sliderVolume.value <= 80) {
        sliderVolume.className = "op-volume op-range80";
    }else if(sliderVolume.value >= 80 &&  sliderVolume.value <= 88) {
        sliderVolume.className = "op-volume op-range88";
    }else if(sliderVolume.value >= 88 &&  sliderVolume.value <= 96) {
        sliderVolume.className = "op-volume op-range96";
    }else if(sliderVolume.value >= 96) {
        sliderVolume.className = "op-volume op-range100";
    }
}

var onPanelVolumeOut = function() {
    restartVolumeTimer();
}

var onFullScreenClicked = function() {
    if (!document.fullscreenElement && // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
        if (document.getElementById("player-container").requestFullscreen) {
            document.getElementById("player-container").requestFullscreen();
        } else if (document.getElementById("player-container").msRequestFullscreen) {
            document.getElementById("player-container").msRequestFullscreen();
        } else if (document.getElementById("player-container").mozRequestFullScreen) {
            document.getElementById("player-container").mozRequestFullScreen();
        } else if (document.getElementById("player-container").webkitRequestFullscreen) {
            document.getElementById("player-container").webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            document.getElementById("player-container-demo-3").className = "demo-player.fullscreen";
        }
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
        document.getElementById("player-container-demo-3").className = "demo-player";
    }
    setSubtitlesCSSStyle(subtitlesCSSStyle);
}

/********************************************************************************************************************
*
*
*                  functions called by OrangeHasPlayer to update GUI
*
*
**********************************************************************************************************************/

var handleAudioDatas = function(_audioTracks, _selectedAudioTrack){
    audioTracks = _audioTracks;
    currentaudioTrack = _selectedAudioTrack;

    addCombo(audioTracks, audioList);
    selectCombo(audioTracks, audioList, currentaudioTrack);

    if (audioTracks && audioTracks.length > 1) {
        var selectOptions = "";
        for (i = 0 ; i < audioTracks.length; i++) {
            selectOptions += '<option value="' + audioTracks[i].id + '">' + audioTracks[i].lang + ' - ' + audioTracks[i].id+'</option>';
        }
       /* audioListInPlayer.innerHTML = selectOptions;
        audioListInPlayer.style.visibility = 'visible';
        audioListInPlayer.selectedIndex = audioList.selectedIndex;*/
    }
}

var handleDuration = function(duration) {
  /*  if (duration !== Infinity) {
        seekBar.max = duration;
        durationText.textContent = setTimeWithSeconds(duration);
        videoDuration = duration;
    } else {
        seekBar.max = 0;
        durationText.textContent = null;
        videoDuration = null;
        currentTimeText.textContent  = null;
    }*/
}

var handleTimeUpdate = function(time) {
    /*seekBar.value = time;
    currentTimeText.textContent = setTimeWithSeconds(time);*/
}

var handleSubtitleDatas = function(_subtitleTracks, _selectedSubtitleTrack){
    //init subtitles tracks
    subtitleTracks = _subtitleTracks;
    currentsubtitleTrack = _selectedSubtitleTrack;

    addCombo(subtitleTracks, subtitleList);
    selectCombo(subtitleTracks, subtitleList, currentsubtitleTrack);
}

var handleSubtitleStyleChange = function(style){
    subtitlesCSSStyle = style;
    setSubtitlesCSSStyle(subtitlesCSSStyle);
}

var handlePlayState = function(state) {
    setPlaying(state);
    /*if (state === true) {
        document.getElementById('bufferingDiv').style.visibility="hidden";
    }*/
}

var handleDownloadedBitrate = function(bitrate, time) {
    downloadedBitrate.push(bitrate);
    handleGraphUpdate();
}

var handlePlayBitrate = function(bitrate, time) {
    playedBitrate.push(bitrate);
    handleGraphUpdate();
}

var handleGraphUpdate = function(){
    if (window.myLine !== undefined) {
        if(window.myLine.datasets[0].points.length >20){
            window.myLine.removeData();
        }

        if (playedBitrate.length === 0) {
            playedBitrate.push(downloadedBitrate[0]);
        }
        window.myLine.addData([downloadedBitrate[downloadedBitrate.length-1],playedBitrate[playedBitrate.length-1]],"");
        window.myLine.update();
    }
}

var handleBitrates = function(bitrates){
    var ctx = document.getElementById("canvas").getContext("2d");
    
    window.myLine = new Chart(ctx).Line(lineChartData, {
            responsive: true,
            bezierCurve : false,
            animation: false,
            scaleBeginAtZero: false,
            // Boolean - If we want to override with a hard coded scale
            scaleOverride: true,
            // ** Required if scaleOverride is true **
            // Number - The number of steps in a hard coded scale
            scaleSteps: bitrates.length,
            // Number - The value jump in the hard coded scale
            scaleStepWidth: bitrates[bitrates.length-1]/bitrates.length,
            // Number - The scale starting value
            scaleStartValue: bitrates[0]
    });

    if (legendChart === null) {
        legendChart = window.myLine.generateLegend();
        document.getElementById('chartLegend').innerHTML = "<span style='background-color:rgba(220,220,220,1)'>Downloaded Bitrate</span><br/><br/><span style='background-color:rgba(151,187,205,1)'>Played Bitrate</span>";
    }
}

var handleError = function(e){
    //manage GUI to show errors
}

/**********************************************************************************************************************/

var setSubtitlesCSSStyle = function(style) {
    if (style) {
        var fontSize = style.data.fontSize;

        if (style.data.fontSize[style.data.fontSize.length - 1] === '%') {
            fontSize = (video.clientHeight * style.data.fontSize.substr(0, style.data.fontSize.length - 1)) / 100;
        }

        document.getElementById("cueStyle").innerHTML = '::cue{ background-color:' + style.data.backgroundColor + ';color:' + style.data.color + ';font-size: ' + fontSize + 'px;font-family: ' + style.data.fontFamily + '}';
    }
}

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
}

var selectCombo = function(tracks, combo, currentTrack) {
    var i;

    for (i = 0; i < tracks.length; i++) {
        if (currentTrack === tracks[i]) {
            combo.selectedIndex = i;
        }
    }
}

var resetCombo = function(tracks, combo) {
    var i;

    for (i = tracks.length - 1; i >= 0; i--) {
        combo.options.remove(i);
    }

    tracks = [];

    combo.style.visibility = 'hidden';
}

var reset = function() {
    resetCombo(audioTracks, audioList);
    resetCombo(subtitleTracks, subtitleList);

    /*for (i = audioTracks.length - 1; i >= 0; i--) {
        audioListInPlayer.options.remove(i);
    }*/

    currentaudioTrack = null;
    currentsubtitleTrack = null;
    downloadedBitrate = [];
    playedBitrate = [];

    if (window.myLine !== undefined) {
        window.myLine.clear();
        window.myLine.destroy();
        lineChartData.labels = [];
        lineChartData.datasets[0].data = [];
        lineChartData.datasets[1].data = [];
    }
}

var setVolumeOff = function(value) {
    if (value) {
        volumeOffSvg.style.display = "block";
        volumeOnSvg.style.display = "none";
    } else {
        volumeOffSvg.style.display = "none";
        volumeOnSvg.style.display = "block";
    }
}

var setPlaying = function(value) {
    if(value) {
        playPauseButton.className = "tooltip op-play op-pause stop-anchor";
        playPauseButton.title = "Pause";
    } else {
        playPauseButton.className = "tooltip op-play stop-anchor";
        playPauseButton.title = "Play";
    }
}

var stopVolumeTimer = function() {
    clearTimeout(volumeTimer);
}

var restartVolumeTimer = function() {
    clearTimeout(volumeTimer);
    volumeTimer = setTimeout(function(){hideVolumePanel();}, 3000);
}

var showVolumePanel = function() {
    panelVolume.className = "op-container-volume";
}

var hideVolumePanel = function() {
    clearTimeout(volumeTimer);
    panelVolume.className = "op-container-volume op-hidden";
}

var setTimeWithSeconds = function(sec) {
    var sec_num = parseInt(sec, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
}