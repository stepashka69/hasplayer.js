window.onload = function() {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', document.location + '/../json/sources.json');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 3) {
            buildStreamsList(xhr.responseText);
        }
    }
    xhr.send();

    var playerLoader = new PlayerLoader();

    var buildStreamsList = function (jsonList) {
        // Prepare stream table
        var tableNode = document.getElementById('streams-table');

        if (tableNode) {
            while(tableNode.firstChild) {
                tableNode.removeChild(tableNode.firstChild);
            }
        } else {
            tableNode = document.createElement('table');
            tableNode.id = 'streams-table';
            document.getElementById('streams-container').appendChild(tableNode);
        }

        var streamsList = JSON.parse(jsonList);

        // Add stream elements
        for (var i = 0, len = streamsList.items.length; i < len; i++) {
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
            var protectionsNames  = Object.getOwnPropertyNames(stream.protData);
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
            playerLoader.loadStream(streamInfos);
        }

        streamItem.addEventListener('click', function() {
            onStreamClicked(stream);
        })

        return streamItem;
    }
}
