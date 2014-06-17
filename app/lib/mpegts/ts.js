// TS trame manipulation library
// (C) 2014 Orange

var mpegts = (function() {
    var mpegts = {
        pes:{},
        psi:{},
        binary:{},
        ts:{},
        Pts:{},
    };
    
    mpegts.parse = function (data) {
        var i = 0;
        while(i<=data.length)
        {
            var tsPacket = new mpegts.ts.TsPacket();
            tsPacket.parse(data.subarray(i,i+mpegts.ts.TsPacket.prototype.TS_PACKET_SIZE));

            if ((tsPacket.getPusi() && tsPacket.getPid() === 305)||(tsPacket.getPusi() && tsPacket.getPid() === 289)) {
                debugger;
                var pesPacket = new mpegts.pes.PesPacket();
                pesPacket.parse(data.subarray(i+tsPacket.getPayloadIndex(),i+tsPacket.getPayloadLength()));
            }
            i+= mpegts.ts.TsPacket.prototype.TS_PACKET_SIZE;
        }
    };
   
    return mpegts;
})();

mpegts.ts.TsPacket = function(){
    this.m_cSync = null;
    this.m_bTransportError = null;
    this.m_bPUSI = null;
    this.m_bTransportPriority = null;
    this.m_nPID = null;
    this.m_cTransportScramblingCtrl = null;
    this.m_cAdaptationFieldCtrl = null;
    this.m_cContinuityCounter = null;
    this.m_pAdaptationField = null;
    this.m_IdPayload = null;
    this.m_cPayloadLength = null;
    this.m_bDirty = null;
    this.m_time = null;
    this.m_arrivalTime = null;
    this.m_bIgnored = null;
};

mpegts.ts.TsPacket.prototype.parse = function(data) {
    var byteId = 0;
    this.m_cSync = data[byteId];
    if (this.m_cSync !== this.SYNC_WORD) {
        console.log("TS Packet Malformed!");
        return;
    }

    byteId++;

    this.m_bTransportError = mpegts.binary.getBitFromByte(data[byteId], 0);
    this.m_bPUSI = mpegts.binary.getBitFromByte(data[byteId], 1);
    this.m_bTransportPriority = mpegts.binary.getBitFromByte(data[byteId], 2);
    this.m_nPID = mpegts.binary.getValueFrom2Bytes(data.subarray(byteId, byteId+2), 3, 13);
    
    byteId += 2;

    this.m_cTransportScramblingCtrl = mpegts.binary.getValueFromByte(data[byteId], 0, 2);
    this.m_cAdaptationFieldCtrl = mpegts.binary.getValueFromByte(data[byteId], 2, 2);
    this.m_cContinuityCounter = mpegts.binary.getValueFromByte(data[byteId], 4, 4);

    byteId++;

    debugger;
    // Adaptation field
    // NAN => to Validate
    if(this.m_cAdaptationFieldCtrl & 0x02)
    {
        debugger;
        // Check adaptation field length before parsing
        var cAFLength = data[byteId];
        if ((cAFLength + byteId) >= this.TS_PACKET_SIZE)
        {
            console.log("TS Packet Size Problem!");
            return;
        }
        this.m_pAdaptationField = new mpegts.ts.AdaptationField();
        this.m_pAdaptationField.parse(data.subarray(byteId));
        byteId += this.m_pAdaptationField.getLength();
    }

    // Check packet validity
    if (this.m_cAdaptationFieldCtrl === 0x00)
    {
        console.log("TS Packet is invalid!");
        return;
    }

    // Payload
    if(this.m_cAdaptationFieldCtrl & 0x01)
    {
        this.m_cPayloadLength = this.TS_PACKET_SIZE - byteId;
        this.m_IdPayload = byteId;
    }
};

mpegts.ts.TsPacket.prototype.getPid = function() {
    return this.m_nPID;
};

mpegts.ts.TsPacket.prototype.getPayloadIndex = function() {
    return this.m_IdPayload;
};

mpegts.ts.TsPacket.prototype.getPayloadLength = function() {
    return this.m_cPayloadLength;
};

mpegts.ts.TsPacket.prototype.getPusi = function() {
    return this.m_bPUSI;
};

mpegts.ts.TsPacket.prototype.SYNC_WORD = 0x47;
mpegts.ts.TsPacket.prototype.TS_PACKET_SIZE = 188;
mpegts.ts.TsPacket.prototype.STREAM_ID_PROGRAM_STREAM_MAP = 0xBC;
mpegts.ts.TsPacket.prototype.STREAM_ID_PADDING_STREAM = 0xBE;
mpegts.ts.TsPacket.prototype.STREAM_ID_PADDING_STREAM = 0xBE;
mpegts.ts.TsPacket.prototype.STREAM_ID_PRIVATE_STREAM_2 = 0xBF;
mpegts.ts.TsPacket.prototype.STREAM_ID_ECM_STREAM = 0xF0;
mpegts.ts.TsPacket.prototype.STREAM_ID_EMM_STREAM = 0xF1;
mpegts.ts.TsPacket.prototype.STREAM_ID_DSMCC_STREAM = 0xF2;
mpegts.ts.TsPacket.prototype.STREAM_ID_H2221_TYPE_E_STREAM = 0xF8;
mpegts.ts.TsPacket.prototype.STREAM_ID_PROGRAM_STREAM_DIRECTORY = 0xFF;


// This module is intended to work both on node.js and inside browser.
// Since these environments differ in a way modules are stored/accessed,
// we need to export the module in the environment-dependant way

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = mpegts; // node.js
else
    window.mpegts = mpegts;  // browser

