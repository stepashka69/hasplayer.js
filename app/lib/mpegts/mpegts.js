var mpegts = (function() {
    return {
        pes:{},
        si:{},
        binary:{},
        ts:{},
        Pts:{},
        aac:{},
        h264:{}
    };
}());

// This module is intended to work both on node.js and inside browser.
// Since these environments differ in a way modules are stored/accessed,
// we need to export the module in the environment-dependant way

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = mpegts; // node.js
else
    window.mpegts = mpegts;  // browser