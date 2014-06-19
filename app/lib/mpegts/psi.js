if (typeof require !== 'undefined') {
    // node.js adaptation
    var mpegts = require('./ts.js');
}

// ----------  ----------

mpegts.si.PSISection = function(table_id){
	this.m_table_id = table_id;
	this.m_section_syntax_indicator = 1;
	this.m_section_length = mpegts.si.PSISection.prototype.SECTION_LENGTH;
	this.m_transport_stream_id = 0;
	this.m_version_number = 0;
	this.m_current_next_indicator = true;
	this.m_section_number = 0;
	this.m_last_section_number = 0;
	this.m_bValid = null;
};

mpegts.si.PSISection.prototype.parse = function (data) {
	this.m_bValid = false;

	var id = 0;

	var pointerField = data[id];

	//if pointerField = 0 payload data start immediately otherwise, shift pointerField value
	pointerField === 0? id++:id += pointerField;

	this.m_table_id					= data[id];
	id++;
	this.m_section_syntax_indicator	= mpegts.binary.getBitFromByte(data[id], 0);
	this.m_section_length			= mpegts.binary.getValueFrom2Bytes(data.subarray(id, id+2), 4);
	id+=2;
	this.m_transport_stream_id		= mpegts.binary.getValueFrom2Bytes(data.subarray(id, id+2));
	id+=2;
	this.m_version_number			= mpegts.binary.getValueFromByte(data[id], 2, 5);
	this.m_current_next_indicator	= mpegts.binary.getBitFromByte(data[id], 7);
	id++;
	this.m_section_number			= data[id];
	id++;
	this.m_last_section_number		= data[id];

	/*if (nLength < (m_section_length + 3))
	{
		m_bComplete = false;
		SAFE_DELETE(m_pBytestream);
		m_pBytestream = new unsigned char[m_section_length + 3];
		memcpy(m_pBytestream, pBytestream, nLength);
		m_nSectionIndex = nLength;
		return;
	}

	m_nSectionIndex = 0;
	m_bComplete = true;*/
	this.m_bValid = true;

	return id;
};

mpegts.si.PSISection.prototype.getSectionLength = function() {
	return this.m_section_length;
};

mpegts.si.PSISection.prototype.SECTION_LENGTH = 9;
mpegts.si.PSISection.prototype.HEADER_LENGTH = 8;