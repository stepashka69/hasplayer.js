var SettingsPanel = function() {
    this.menuContainer = null;

    // Quick settings
    this.audioListCombobox = null,
    this.subtitleListCombobox = null,
    this.audioTracks = [],
    this.subtitleTracks = [],
    this.currentaudioTrack = null,
    this.currentsubtitleTrack = null,

    // Settings
    this.settingsMenuButton = null;
    this.enableMetricsCheckbox = null;
    this.enableOptimzedZappingCheckbox = null;
    this.metricsAgentCombobox =  null;
    this.defaultAudioLangCombobox = null;
    this.defaultSubtitleLangCombobox = null;
    this.optimizedZappingEnabled = true;
    this.metricsConfig = null;
};

SettingsPanel.prototype.init = function() {
    this.menuContainer = document.getElementById('menu-container');
    this.audioListCombobox = document.getElementById('audioCombo');
    this.subtitleListCombobox = document.getElementById('subtitleCombo');
    this.settingsMenuButton = document.getElementById('settingsMenuButton');
    this.metricsAgentCombobox =  document.getElementById('metrics-agent-options');
    this.enableMetricsCheckbox = document.getElementById('enable-metrics-agent');
    this.defaultAudioLangCombobox = document.getElementById('default_audio_language');
    this.defaultSubtitleLangCombobox = document.getElementById('default_subtitle_language');
    this.enableOptimzedZappingCheckbox = document.getElementById('enable-optimized-zapping');

    this.setupEventListeners();
    this.initMetricsAgentOptions();
};

SettingsPanel.prototype.setupEventListeners = function() {
    this.audioListCombobox.addEventListener('change', this.audioChanged.bind(this));
    this.subtitleListCombobox.addEventListener('change', this.subtitleChanged.bind(this));
    this.settingsMenuButton.addEventListener('click', this.onSettingsMenuButtonClicked.bind(this));
    this.enableMetricsCheckbox.addEventListener('click', this.onEnableMetrics.bind(this));
    this.metricsAgentCombobox.addEventListener('change', this.onSelectMetricsAgent.bind(this));
    this.defaultAudioLangCombobox.addEventListener('change', this.onChangeDefaultAudioLang.bind(this));
    this.defaultSubtitleLangCombobox.addEventListener('change', this.onChangeDefaultSubtitleLang.bind(this));
    this.enableOptimzedZappingCheckbox.addEventListener('click', this.onEnableOptimizedZapping.bind(this));

    minivents.on('language-radio-clicked', this.onLanguageChangedFromPlayer.bind(this));
    minivents.on('subtitle-radio-clicked', this.onSubtitleChangedFromPlayer.bind(this));
};

SettingsPanel.prototype.initMetricsAgentOptions = function() {
        var reqMA = new XMLHttpRequest(),
        self = this;

        reqMA.onload = function () {
            if (reqMA.status === 200) {
                self.metricsConfig = JSON.parse(reqMA.responseText);

                self.metricsAgentCombobox.innerHTML = '';

                for (var i = 0, len = self.metricsConfig.items.length; i < len; i++) {
                    self.metricsAgentCombobox.innerHTML += '<option value="' + i + '">' + self.metricsConfig.items[i].name + '</option>';
                }
                self.metricsAgentCombobox.selectedIndex = -1;
            }
        };
        reqMA.open('GET', './json/metricsagent_config.json', true);
        reqMA.setRequestHeader('Content-type', 'application/json');
        reqMA.send();
};

SettingsPanel.prototype.audioChanged = function(e) {
    changeAudio(e.target.selectedIndex);
    document.getElementById(this.audioTracks[e.target.selectedIndex].id).checked = true;
};

SettingsPanel.prototype.subtitleChanged = function(e) {
    changeSubtitle(e.target.selectedIndex);
    document.getElementById(this.subtitleTracks[e.target.selectedIndex].id).checked = true;
};

SettingsPanel.prototype.getTrackIndex = function(tracks, id) {
    var index = -1;
    for(var i = 0, len = tracks.length; i < len; i++) {
        if (tracks[i].id === id) {
            index = i;
            break;
        }
    }

    return index;
};

SettingsPanel.prototype.onLanguageChangedFromPlayer = function(track) {
    var index = this.getTrackIndex(this.audioTracks, track);

    if (index > -1) {
        changeAudio(this.audioTracks[index]);
        this.audioListCombobox.selectedIndex = index;
    }
};

SettingsPanel.prototype.onSubtitleChangedFromPlayer = function(track) {
    var index = this.getTrackIndex(this.subtitleTracks, track);

    if (index > -1) {
        changeSubtitle(this.subtitleTracks[index]);
        this.subtitleListCombobox.selectedIndex = index;
    }
};

SettingsPanel.prototype.onSettingsMenuButtonClicked = function() {
    if (hasClass(this.menuContainer, 'hidden')) {
        this.menuContainer.className = '';
    } else {
        this.menuContainer.className = 'hidden';
    }
};

SettingsPanel.prototype.onEnableMetrics = function() {
    if (this.enableMetricsCheckbox.checked) {
        this.metricsAgentCombobox.disabled = false;
    } else {
        this.enableMetricsCheckbox.checked = true;
        //this.metricsAgentCombobox.disabled = true;
    }
};

SettingsPanel.prototype.onSelectMetricsAgent = function (value) {
    if (typeof MetricsAgent === 'function') {
        if (this.enableMetricsCheckbox.checked) {
            orangeHasPlayer.loadMetricsAgent(this.metricsConfig.items[this.metricsAgentCombobox.selectedIndex]);
        } else if (this.metricsAgent) {
            this.metricsAgent.stop();
        }
    }
};

SettingsPanel.prototype.onChangeDefaultAudioLang = function() {
    orangeHasPlayer.setDefaultAudioLang(this.defaultAudioLangCombobox.value);
};

SettingsPanel.prototype.onChangeDefaultSubtitleLang = function() {
    orangeHasPlayer.setDefaultSubtitleLang(this.defaultSubtitleLangCombobox.value);
};

SettingsPanel.prototype.onEnableOptimizedZapping = function() {
    this.optimizedZappingEnabled = this.enableOptimzedZappingCheckbox.checked;
};

SettingsPanel.prototype.updateAudioData = function(_audioTracks, _selectedAudioTrack) {
    this.audioTracks = _audioTracks;
    this.currentaudioTrack = _selectedAudioTrack;

    if (this.audioTracks && this.currentaudioTrack) {
        this.addCombo(this.audioTracks, this.audioListCombobox);
        this.selectCombo(this.audioTracks, this.audioListCombobox, this.currentaudioTrack);
    }
};

SettingsPanel.prototype.updateSubtitleData = function(_subtitleTracks, _selectedSubtitleTrack) {
    //init subtitles tracks
    this.subtitleTracks = _subtitleTracks;
    this.currentsubtitleTrack = _selectedSubtitleTrack;

    if (this.subtitleTracks && this.currentsubtitleTrack) {
        this.addCombo(this.subtitleTracks, this.subtitleListCombobox);
        this.selectCombo(this.subtitleTracks, this.subtitleListCombobox, this.currentsubtitleTrack);
    }
};

SettingsPanel.prototype.addCombo = function(tracks, combo) {
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

SettingsPanel.prototype.selectCombo = function(tracks, combo, currentTrack) {
    var i;

    for (i = 0; i < tracks.length; i++) {
        if (currentTrack === tracks[i]) {
            combo.selectedIndex = i;
        }
    }
};

SettingsPanel.prototype.resetCombo = function(tracks, combo) {
    var i;

    for (i = tracks.length - 1; i >= 0; i--) {
        combo.options.remove(i);
    }

    tracks = [];

    combo.style.visibility = 'hidden';
};

SettingsPanel.prototype.reset = function() {
    this.resetCombo(this.audioTracks, this.audioListCombobox);
    this.resetCombo(this.subtitleTracks, this.subtitleListCombobox);

    this.currentaudioTrack = null;
    this.currentsubtitleTrack = null;
};
