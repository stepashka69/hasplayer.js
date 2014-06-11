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

    /** Optional fields */
   /* PCR* m_pPCR;
    PCR* m_pOPCR;
    unsigned char  m_cSpliceCountDown;
	unsigned char* m_pPrivateData;
	unsigned char* m_pAFExtension;*/

	/** AU_information field (private data) */
	//AUInformation* m_pAUInformation;
    
    /** The number of stuffing bytes */
    //unsigned char m_cNbStuffingBytes;

	/** A boolean indicating if some fields have been modified */
	//bool m_bDirty;
};

mpegts.ts.AdaptationField.prototype.getLength = function() {
	return (this.m_cAFLength + 1);
};

mpegts.ts.AdaptationField.prototype.parse = function(uint8array) {
	this.m_cAFLength = uint8array[0];

	if (this.this.m_cAFLength === 0)
	{
		console.log("AdaptationField Length Problem!");
        return;
	}

	var index = 1;

	this.m_bDiscontinuityInd		= mpegts.binary.getBitFromByte(uint8array[index], 0);
	this.m_bRAI						= mpegts.binary.getBitFromByte(uint8array[index], 1);
	this.m_bESPriority				= mpegts.binary.getBitFromByte(uint8array[index], 2);
	this.m_bPCRFlag					= mpegts.binary.getBitFromByte(uint8array[index], 3);
	this.m_bOPCRFlag				= mpegts.binary.getBitFromByte(uint8array[index], 4);
	this.m_bSplicingPointFlag		= mpegts.binary.getBitFromByte(uint8array[index], 5);
	this.m_bPrivateDataFlag			= mpegts.binary.getBitFromByte(uint8array[index], 6);
	this.m_bAdaptationFieldExtFlag	= mpegts.binary.getBitFromByte(uint8array[index], 7);

	//to complete
};