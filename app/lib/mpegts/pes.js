if (typeof require !== 'undefined') {
    // node.js adaptation
    var mpegts = require('./ts.js');
}

// ---------- PES Packet class ----------

mpegts.pes.PesPacket = function(){
};

mpegts.pes.PesPacket.prototype.getHeaderLength = function() {
    //return m_nPID;
};

mpegts.pes.PesPacket.prototype.getPTS = function() {
    //return m_nPID;
};

mpegts.pes.PesPacket.prototype.getDTS = function() {
    //return m_nPID;
};