var ProtectionDataPanel = function() {
    this.protectionDataContainer = null;
};

ProtectionDataPanel.prototype.init = function(elt) {
    this.protectionDataContainer = elt;
};

ProtectionDataPanel.prototype.clear = function() {
    this.protectionDataContainer.innerHTML = '';
    this.protectionDataContainer.className = 'module hidden';
};

ProtectionDataPanel.prototype.displayDatum = function(protectionName, protectionDatum) {
    var html = '<tr><td class="protection-data-name" colspan="2">' + protectionName + '</td></tr>';

    for (var p in protectionDatum) {
        if (protectionDatum.hasOwnProperty(p)) {
            html += '<tr><td class="protection-key">' + p + '</td><td class="protection-value">' + protectionDatum[p] + '</td></tr>';
        }
    }

    return html;
};

ProtectionDataPanel.prototype.display = function(streamInfos) {
    this.protectionDataContainer.className = 'module';

    var html = '<table>';

    for (var p in streamInfos) {
        if (streamInfos.hasOwnProperty(p)) {
            html += this.displayDatum(p, streamInfos[p]);
        }
    }

    html += '</table>';

    this.protectionDataContainer.innerHTML = html;
};
