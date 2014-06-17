if (typeof require !== 'undefined') {
    // node.js adaptation
    var mpegts = require('./ts.js');
}

// ---------- Adaptation Field class ----------

mpegts.ts.AdaptationField = function(){
 	/** adaptation field fields */
    this.m_cAFLength = null;
    this.m_bDiscontinuityInd = null;
    this.m_bRAI = null;
    this.m_bESPriority = null;

    /** Optional fields flags */
    this.m_bPCRFlag = null;
    this.m_bOPCRFlag = null;
    this.m_bSplicingPointFlag = null;
    this.m_bPrivateDataFlag = null;
    this.m_bAdaptationFieldExtFlag = null;
};

mpegts.ts.AdaptationField.prototype.getLength = function() {
	return (this.m_cAFLength + 1);
};

mpegts.ts.AdaptationField.prototype.parse = function(data) {
	this.m_cAFLength = data[0];

	if (this.m_cAFLength === 0)
	{
		console.log("AdaptationField Length Problem!");
        return;
	}

	var index = 1;

	this.m_bDiscontinuityInd		= mpegts.binary.getBitFromByte(data[index], 0);
	this.m_bRAI						= mpegts.binary.getBitFromByte(data[index], 1);
	this.m_bESPriority				= mpegts.binary.getBitFromByte(data[index], 2);
	this.m_bPCRFlag					= mpegts.binary.getBitFromByte(data[index], 3);
	this.m_bOPCRFlag				= mpegts.binary.getBitFromByte(data[index], 4);
	this.m_bSplicingPointFlag		= mpegts.binary.getBitFromByte(data[index], 5);
	this.m_bPrivateDataFlag			= mpegts.binary.getBitFromByte(data[index], 6);
	this.m_bAdaptationFieldExtFlag	= mpegts.binary.getBitFromByte(data[index], 7);

	//other flags are not useful for the conversion HLS => MP4
};