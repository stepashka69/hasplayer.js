var StreamsPanel = function() {
    this.selectedStreamElement = null;
    this.streamFilters = {
        vod: true,
        live: true,
        hls: true,
        mss: true,
        dash: true
    };

    this.live_icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAH4AAABZCAMAAADPVGA0AAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAA3XAAAN1wFCKJt4AAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAsRQTFRFAAAA////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////JmmGNgAAAOt0Uk5TAAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFC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';
    this.vod_icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIkAAABoCAMAAADy4iPcAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAA3XAAAN1wFCKJt4AAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAo5QTFRFAAAA////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////gqK45QAAANl0Uk5TAAECAwQFBgcICgsNDg8QERITFBUXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ2Nzg5Ojw+P0BBQkRFRkdISUxNTlBRUlNUVVZYWVxdXl9gYmNkZWZnaGlrbG1ub3JzdHV2d3l6e3x9fn+AgYKDhIWGh4iJioyNjo+QkZKTlZaXmJmanJ6foKKkpaanqKmqq6ytrq+wsbO0t7q7vL7AwsXGyMnKy8zNz9DR0tPU1dbX2drb3N3e4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/iBuvXoAAASuSURBVGje7Zr7V1RVFMc/MjkExUMITC20RMowtDKpbOipaaOBlTX4ICmcKDNTacqEpIc9SSUrg8rMHhChiaUIiqb2pIJBoOb8N/1w57WHmbu810UrW+f8tM/+zrn3c+fcu+/ee13Uf2WgSTSJJjnfSdxut7tSuPrcYgwKcaXQDgqtVmjNQmsWWp3QOtxut9sNwHQh/IoYfiFOEdpeoS0W2gtC2yS0+4T2WUTQJJpEk2gSTaJJ/i0Sn8/ne10IAz4xhoX4qtB6hNYktBahtQitSWjHfD6fz6czJU2iSTSJJtEk5xFJ4EDDZu/yp+p3nRglkseA9IGR/g6A98LTo4+OD7/oZ9b3i5/2hJUxGZddU7LyzcO2SDoAto/0VwFZoZLd73WKpCO3MT5JaBSs/9HG7swGbh/hHc4FVgUn3dcGz3BBRuhcniEzEkhZ67dMshVwHI/1fgTQbthdkwAc7p2nAmroSP0NACwYkiRlXq/X6y1fXJIVZJlxxCpJbwrwbKz3XmCmYf5eADCrLay9nQVQIUm+DE87t+QDMP6Q1WenFJgW4/s5Gag37PsBbo3+szuyAT5MQKJUYFsaQEGfRZI9AF9IXz2Q/EskCZ4hD9rmBC71JyJRqvMKgEqLJIE8oFz6ZgGLDPMmwNEas+ZJgNrEJOrbVMB51GJkWweki1t9P8DHxiEBlsYuGcgBrgwkJlG1AI9bJOlOArZFeyqBCX8ppZRaE+80SnkB2kxI/swAJluN9q6YkDJ0CVBt2HOB/AQBsc6ERFUAHLJI0gAkHYuqqwC+M6BS4m2OUoFxgNuM5F1i/+mzIPGnAzWR+T1AsWG2A7wcZ00JkGdGchzgaavv4mViC35yAm8Y9m6A3XGWrABSzUhUMvCIVZKvREipA1L/MOwdAK1xljwBcMaMJAcotZyfTAc8oUkR8EDQfgXg+zgrngf4wYxkGnCnZZJNQFp/VDDZG00S7wl4DuCkGclU4C7LJKfHRm70VcDkYNBSjYl2pxpg0IwkG1hiPXucD9xmPLfZwIaQ/xOAT23dsc6oDMcCSVM4pOwCHOG+zTdmT/HlZiRdAM9YJxnOBTYqpdQ84I5IuDWLbIvMSN6RifDZ5/ZVwNRA8I7ZEfHfYjfalwN02yA5CPC5UpuBzIGY97+NN+BvFwFX2ap3ZgMPK1UIrIhy7wN40HpWUAOw3hbJViDN3wbwdbS/GHC0WM2UWi8EUk7ZIulNARoqgMKRyaXV7LFjEsBam9VoKXDzuKhrDY4ygLnRZd+BbIAPEmbUw6+lAlx3xibJnmCh4oyp33rzAYrCWxZ4KxNgeYIqY7i9ZiIAU3rsVuiBPINkQazQOQHAsbDx5N9q8PCL1wMwb1CSzPd4PB5P2d1zUoMXVHzCfq9gnXGI5hFCV2GoGk0PVZtLB82r0cy64XPoWnQnAeTGOUR/1VhxnpztphX6mDkv9Z1b/8QFsDo+ZWWka1G0JVHX4uKJV9+4sPr906PfyVm9bM3odXJ0n02TaBJNokk0yf+exOVyuR6SbTmXGDLvXCK0/ULbIDRZ6e0U2kah7XO5XC6X/upDk2gSTaJJNIn+xi/UuNPf+GkSTaJJ7Ix/AM0hoKaSUmWoAAAAAElFTkSuQmCC';
};

StreamsPanel.prototype.init = function() {
    this.initStreamListFilter();
    this.loadStreamList();
    this.setupEventListeners();
};

StreamsPanel.prototype.setupEventListeners = function() {
    minivents.on('play-prev-stream', this.onPlayPreviousStream.bind(this));
    minivents.on('play-next-stream', this.onPlayNextStream.bind(this));
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

StreamsPanel.prototype.buildStreamsList = function(streamsList) {
    var tableNode = this.initStreamTable();

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
        streamItemTypeIcon.src = self.live_icon;
    } else if (stream.type.toLowerCase() === 'vod') {
        className += ' stream-vod';
        streamItemTypeIcon.src = self.vod_icon;
    }

    streamItemType.appendChild(streamItemTypeIcon);
    streamItemName.innerHTML = stream.name;
    streamItemProtocol.innerHTML = stream.protocol;
    className += ' stream-' + stream.protocol.toLowerCase();

    var protections = [];
    if (stream.protData) {
        var protectionsNames = Object.getOwnPropertyNames(stream.protData);
        for (var i = 0, len = protectionsNames.length; i < len; i++) {
            if (protectionsNames[i].indexOf('playready') > -1) {
                className += ' stream-playready';
                protections.push('PR');
            } else if (protectionsNames[i].indexOf('widevine') > -1) {
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
    var self = this;

    if (window.jsonData) { // Used for built version of the app
        self.buildStreamsList(window.jsonData.sources);
    } else {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', document.location + '/../json/sources.json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                self.buildStreamsList(JSON.parse(xhr.responseText));
            }
        };
        xhr.send();
    }
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

StreamsPanel.prototype.onPlayPreviousStream = function() {
    if (this.selectedStreamElement.previousSibling) {
        this.selectedStreamElement.previousSibling.click();
    }
};

StreamsPanel.prototype.onPlayNextStream = function() {
    if (this.selectedStreamElement.nextSibling) {
        this.selectedStreamElement.nextSibling.click();
    }
};
