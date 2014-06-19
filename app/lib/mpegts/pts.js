if (typeof require !== 'undefined') {
    // node.js adaptation
    var goog = { math: { Long : require("long") }};
}

// ----------  ----------

mpegts.Pts = function(data){
	//initialize an unsigned 64 bits long number
    this.m_lPTS = goog.math.Long.fromNumber(0);
	//=> PTS is defined on 33 bits
	//=> In the first byte, bit number 2 to 4 is useful
	var bits3230 = data[0] >> 1 & 0x7;

	//thirty-third bit in the high member
	this.m_lPTS.high_ = bits3230 >> 2;
	//32 and 31 bits in th low member, shift by 30 bits
	this.m_lPTS.low_ = ((bits3230 & 0x3) << 30) >>> 0; //=> http://www.codeonastick.com/2013/06/javascript-convert-signed-integer-to.html unsigned int!!!!!!
	
	//=> In the second byte, all the bits are useful
	var bits2922 = data[1];
	this.m_lPTS.low_ = (this.m_lPTS.low_ | (bits2922 << 22))>>> 0;//=> http://www.codeonastick.com/2013/06/javascript-convert-signed-integer-to.html unsigned int!!!!!!
	
    //=> In the third byte, bit number 2 to 8 is useful
	var bits2115 = data[2] >> 1;
	this.m_lPTS.low_ = (this.m_lPTS.low_ | (bits2115 << 15))>>> 0;//=> http://www.codeonastick.com/2013/06/javascript-convert-signed-integer-to.html unsigned int!!!!!!

	//=> In the fourth byte, all the bits are useful
    var bits1407 = data[3];
	this.m_lPTS.low_ = (this.m_lPTS.low_ | (bits1407 << 7))>>> 0;//=> http://www.codeonastick.com/2013/06/javascript-convert-signed-integer-to.html unsigned int!!!!!!
    
    //=> In the fifth byte, bit number 2 to 8 is useful
	var bits0701 = data[4] >> 1;
	this.m_lPTS.low_ = (this.m_lPTS.low_ | bits0701)>>> 0;//=> http://www.codeonastick.com/2013/06/javascript-convert-signed-integer-to.html unsigned int!!!!!!

    this.m_fPTS = goog.math.Long.fromBits(this.m_lPTS.low_, this.m_lPTS.high_).toNumber() / mpegts.Pts.prototype.SYSTEM_CLOCK_FREQUENCY;
};

/**
* Returns the PTS value in units of system clock frequency.
* @return the PTS value in units of system clock frequency
*/
mpegts.Pts.prototype.getValue = function() {
	return this.m_lPTS;
};

/**
* Returns the PTS value in seconds.
* @return the PTS value in seconds
*/
mpegts.Pts.prototype.getValueInSeconds = function() {
	return this.m_fPTS;
};

mpegts.Pts.prototype.SYSTEM_CLOCK_FREQUENCY = 90000;
