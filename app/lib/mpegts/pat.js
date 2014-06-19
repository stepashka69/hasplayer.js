if (typeof require !== 'undefined') {
    // node.js adaptation
    var mpegts = require('./ts.js');
}

// ----------  ----------

mpegts.si.PAT = function(data){
	mpegts.si.PSISection.call(this,mpegts.si.PAT.prototype.TABLE_ID);
	this.m_listOfProgramAssociation = [];
	this.m_network_pid = null;
	this.parse(data);
};

mpegts.si.PAT.prototype = Object.create(mpegts.si.PSISection.prototype);
mpegts.si.PAT.prototype.constructor = mpegts.si.PAT;

mpegts.si.PAT.prototype.parse = function (data) {
	var id = mpegts.si.PSISection.prototype.parse.call(this,data);
	id++;

	if (!this.m_bValid)
	{
		console.log("PSI Parsing Problem during PAT parsing!");
		return;
	}
	this.m_bValid = false;

	if(this.m_table_id != this.TABLE_ID)
	{
		console.log("PAT Table ID != 0");
		return;
	}

	var remainingBytes = this.getSectionLength() - this.SECTION_LENGTH;

	while (remainingBytes >= 4)
	{
		var prog = new mpegts.si.ProgramAssociation(data.subarray(id,id+4));
		
		if(prog.getProgramNumber() === 0)
		{
			// Network PID
			this.m_network_pid = prog.getProgramMapPid();
			SAFE_DELETE(aProgramAssociation);
		}
		else
		{
			this.m_listOfProgramAssociation.push(prog);
		}
		remainingBytes -= 4;
		id += 4;
	}

	this.m_bValid = true;
};

/**
* returns the PID of the PMT associated to the first program
*
* @return the PID of the PMT associated to the first program
*/
mpegts.si.PAT.prototype.getPmtPid = function()
{
	var pid = mpegts.ts.TsPacket.prototype.UNDEFINED_PID;
	
	if(this.m_listOfProgramAssociation.length >= 1){
		var prog = this.m_listOfProgramAssociation[0];
		pid = prog.getProgramMapPid();
	}
	
	return pid;
};

mpegts.si.PAT.prototype.TABLE_ID	= 0x00;
mpegts.si.PAT.prototype.PID		= 0x00;


mpegts.si.ProgramAssociation = function(data){
	this.m_program_number = 0;
	this.m_program_map_pid = 0;
	this.parse(data);
};

mpegts.si.ProgramAssociation.prototype.getProgramNumber = function () {
	return this.m_program_number;
};

mpegts.si.ProgramAssociation.prototype.getProgramMapPid = function () {
	return this.m_program_map_pid;
};

mpegts.si.ProgramAssociation.prototype.getLength = function () {
	return 4;
};

/**
* Parse the ProgramAssociation from given stream
*/
mpegts.si.ProgramAssociation.prototype.parse = function(data){
	this.m_program_number = mpegts.binary.getValueFrom2Bytes(data.subarray(0, 2));
	this.m_program_map_pid = mpegts.binary.getValueFrom2Bytes(data.subarray(2, 4), 3, 13);
};