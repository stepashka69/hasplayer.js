var StreamsPanel = function() {
    this.selectedStreamElement = null;
    this.streamFilters = {
        vod: true,
        live: true,
        hls: true,
        mss: true,
        dash: true
    };
};

StreamsPanel.prototype.init = function() {
    this.initStreamListFilter();
    this.loadStreamList();
};

StreamsPanel.prototype.initStreamTable = function() {
     // Prepare stream table
    var tableNode = document.getElementById('streams-table');

    if (tableNode) {
        clearContent(tableNode);
    } else {
        tableNode = document.createElement('table');
        tableNode.id = 'streams-table';
        document.getElementById('streams-container').appendChild(tableNode);
    }

    return tableNode;
};

StreamsPanel.prototype.buildStreamsList = function(jsonList) {
    var tableNode = this.initStreamTable(),
        streamsList = JSON.parse(jsonList);

    // Add stream elements
    for (var i = 0, len = streamsList.items.length; i < len; i++) {
        var stream = streamsList.items[i];

        if (stream.protocol) {
            var streamItem = this.createStreamEntry(stream);
            tableNode.appendChild(streamItem);
        }
    }
};

StreamsPanel.prototype.createStreamEntry = function(stream) {
    var streamItem = document.createElement('tr'),
        streamItemName = document.createElement('td'),
        streamItemProtocol = document.createElement('td'),
        streamItemType = document.createElement('td'),
        streamItemTypeIcon = document.createElement('img'),
        streamItemProtection = document.createElement('td'),
        className = 'stream-item',
        self = this;

    streamItem.appendChild(streamItemType);
    streamItem.appendChild(streamItemName);
    streamItem.appendChild(streamItemProtocol);
    streamItem.appendChild(streamItemProtection);

    if (stream.type.toLowerCase() === 'live') {
        className += ' stream-live';
        streamItemTypeIcon.src = 'res/live_icon.png';
    } else if (stream.type.toLowerCase() === 'vod') {
        className += ' stream-vod';
        streamItemTypeIcon.src = 'res/vod_icon.png';
    }

    streamItemType.appendChild(streamItemTypeIcon);
    streamItemName.innerHTML = stream.name;
    streamItemProtocol.innerHTML = stream.protocol;
    className += ' stream-' + stream.protocol.toLowerCase();

    var protections = [];
    if (stream.protData) {
        var protectionsNames = Object.getOwnPropertyNames(stream.protData);
        for (var i = 0, len = protectionsNames.length; i < len; i++) {
            if (S(protectionsNames[i]).contains('playready')) {
                className += ' stream-playready';
                protections.push('PR');
            } else if (S(protectionsNames[i]).contains('widevine')) {
                className += ' stream-widevine';
                protections.push('WV');
            }
        }
    }

    streamItemProtection.innerHTML = protections.join(',');

    streamItem.setAttribute('class', className);

    streamItem.addEventListener('click', function() {
        if (self.selectedStreamElement !== null) {
            self.selectedStreamElement.id = '';
        }

        self.selectedStreamElement = this;
        self.selectedStreamElement.id = 'stream-selected';
        onStreamClicked(stream);
    });

    return streamItem;
};

StreamsPanel.prototype.loadStreamList = function() {
    var xhr = new XMLHttpRequest(),
        self = this;

    xhr.open('GET', document.location + '/../json/sources.json');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            self.buildStreamsList(xhr.responseText);
        }
    };
    xhr.send();
};

StreamsPanel.prototype.filterStreams = function() {
    var elts = document.getElementsByClassName('stream-item');

    for (var i = 0, len = elts.length; i < len; i++) {
        if ((this.streamFilters.vod && hasClass(elts[i], 'stream-vod') ||
            this.streamFilters.live && hasClass(elts[i], 'stream-live')) &&
            (this.streamFilters.hls && hasClass(elts[i], 'stream-hls') ||
            this.streamFilters.mss && hasClass(elts[i], 'stream-mss') ||
            this.streamFilters.dash && hasClass(elts[i], 'stream-dash'))) {
            elts[i].style.display = '';
        } else {
            elts[i].style.display = 'none';
        }
    }
};

StreamsPanel.prototype.initStreamListFilter = function() {
    var vodFilter = document.getElementById('display-vod-streams'),
    liveFilter = document.getElementById('display-live-streams'),
    hlsFilter = document.getElementById('display-hls-streams'),
    mssFilter = document.getElementById('display-mss-streams'),
    dashFilter = document.getElementById('display-dash-streams'),
    self = this;

    vodFilter.addEventListener('click', function(e) { self.streamFilters.vod = this.checked; self.filterStreams(); });
    liveFilter.addEventListener('click', function(e) { self.streamFilters.live = this.checked; self.filterStreams(); });
    hlsFilter.addEventListener('click', function(e) { self.streamFilters.hls = this.checked; self.filterStreams(); });
    mssFilter.addEventListener('click', function(e) { self.streamFilters.mss = this.checked; self.filterStreams(); });
    dashFilter.addEventListener('click', function(e) { self.streamFilters.dash = this.checked; self.filterStreams(); });
};
