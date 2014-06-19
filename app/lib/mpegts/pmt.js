// ----------  ----------

mpegts.si.PMT = function(){
	mpegts.si.PSISection.call(this,mpegts.si.PMT.prototype.TABLE_ID);
	this.m_listOfComponents = [];
	this.m_PCR_PID = null;
	this.m_program_info_length = null;
};

mpegts.si.PMT.prototype = Object.create(mpegts.si.PSISection.prototype);
mpegts.si.PMT.prototype.constructor = mpegts.si.PMT;

mpegts.si.PMT.prototype.parse = function (data) {
	var id = mpegts.si.PSISection.prototype.parse.call(this,data);
	id++;

	if (!this.m_bValid)
	{
		console.log("PSI Parsing Problem during PMT parsing!");
		return;
	}
	this.m_bValid = false;

	// Check table_id field value
	if(this.m_table_id != this.TABLE_ID)
	{
		console.log("PMT Table ID != 2");
		return;
	}

	var remainingBytes = this.getSectionLength() - this.SECTION_LENGTH; 

	// check if we have almost PCR_PID and program_info_length fields
	if (remainingBytes < 4)
	{
		return;
	}

	this.m_PCR_PID = mpegts.binary.getValueFrom2Bytes(data.subarray(id, id+2), 3);
	id += 2;
	this.m_program_info_length = mpegts.binary.getValueFrom2Bytes(data.subarray(id, id+2), 4);
	id += 2;
	
	// Parse program descriptors
	id += this.m_program_info_length;
	
	// Parse ES descriptions
	remainingBytes = (this.m_section_length - this.SECTION_LENGTH - 4 - this.m_program_info_length);
	var pESDescription = null;
	while (remainingBytes > 0)
	{
		//to do
		pESDescription = new mpegts.si.ESDescription(data.subarray(id, id+remainingBytes));
		this.m_listOfComponents.push(pESDescription);
		remainingBytes -= pESDescription.getLength();
		id += pESDescription.getLength();
	}

	this.m_bValid = true;
};

mpegts.si.PMT.prototype.TABLE_ID	= 0x02;

mpegts.si.ESDescription = function(data){
	/** ES description fields */
	this.m_stream_type = null;
	this.m_elementary_PID = null;
	this.m_ES_info_length = null;
	this.parse(data);
};

/**
* Gets the stream type associated to this ES
* @return the stream type associated to this ES
*/
mpegts.si.ESDescription.prototype.getStreamType = function() {
	return this.m_stream_type;
};

/**
* Gets the pid on which this ES may be found
* @return the pid on which this ES may be found
*/
mpegts.si.ESDescription.prototype.getPID = function() {
	return this.m_elementary_PID;
};

/**
* Returns the elementary stream description length
* @return the elementary stream description length
*/
mpegts.si.ESDescription.prototype.getLength = function() {
	return 5 + this.m_ES_info_length;
};

/**
* Parse the ESDescription from given bytestream
* @param the bytestream to parse
* @return the bytestream length
*/
mpegts.si.ESDescription.prototype.parse = function(data)
{
	this.m_stream_type = data[0];
	this.m_elementary_PID = mpegts.binary.getValueFrom2Bytes(data.subarray(1, 3), 3);
	this.m_ES_info_length = mpegts.binary.getValueFrom2Bytes(data.subarray(3, 5), 4);
};