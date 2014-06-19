// ----------  ----------
mpegts.binary.readBytes = function(buf, pos, nbBytes) {
    var value = 0;
    for (var i = 0; i < nbBytes; i++) {
        value = value << 8;
        value = value + buf[pos];
        pos++;
    }
    return value;
};

/**
* Returns a bit value from the given byte
* @param data the input byte
* @param bitIndex the bit index inside the byte (0=msb to 7=lsb)
* @return the bit value as a boolean (0 => false, 1 => true)
*/
mpegts.binary.getBitFromByte = function(data, bitIndex)
{
	var cMask = 0x00;
	cMask += (1 << (7 - bitIndex));

	return ((data & cMask) !== 0);
};

/**
* Returns the value extracted from three consecutive bytes
* @param pBytes the input bytes
* @param msbIndex the index of the first bit to extract ( 0=msb to 15=lsb )
* @param nbBits the number of bits to extract (if '-1' then extract up to the last bit)
* @return the value of the extracted bits as an unsigned short, or 0xFFFFFFFF if a problem has occured
*/
mpegts.binary.getValueFrom3Bytes = function(pBytes, msbIndex/* = 0*/, nbBits/* = -1*/)
{
	if (typeof nbBits === "undefined") {
		nbBits = -1;
	}
	if (typeof msbIndex === "undefined") {
		msbIndex = 0;
	}
	var nbBits2 = nbBits == -1?-1:(nbBits - (16 - msbIndex));
	var nbLsbShift = nbBits == -1?0:(8 - nbBits2);
	var cValue0 = mpegts.binary.getValueFromByte(pBytes[0], msbIndex);
	var cValue1 = mpegts.binary.getValueFromByte(pBytes[1]);
	var cValue2 = mpegts.binary.getValueFromByte(pBytes[2], 0, nbBits2, false);

	return ((((cValue0 << 16) & 0x00FF0000) | ((cValue1 << 8) & 0x0000FF00) | (cValue2 & 0x000000FF)) >> nbLsbShift);
};

/**
* Returns the value extracted from two consecutive bytes
* @param data the input bytes
* @param msbIndex the index of the first bit to extract ( 0=msb to 15=lsb )
* @param nbBits the number of bits to extract (if '-1' then extract up to the last bit)
* @return the value of the extracted bits as an unsigned short, or 0xFFFF if a problem has occured
*/
mpegts.binary.getValueFrom2Bytes = function(data, msbIndex/* = 0*/, nbBits/* = -1*/)
{
	if (typeof nbBits === "undefined") {
		nbBits = -1;
	}
	if (typeof msbIndex === "undefined") {
		msbIndex = 0;
	}

	var nbBits1 = nbBits == -1?-1:(nbBits - (8 - msbIndex));
	var nbLsbShift = nbBits == -1?0:(8 - nbBits1);
	var cValue0 = mpegts.binary.getValueFromByte(data[0], msbIndex);
	var cValue1 = mpegts.binary.getValueFromByte(data[1], 0, nbBits1, false);

	return ((((cValue0 << 8) & 0xFF00) | (cValue1 & 0x00FF)) >> nbLsbShift);
};

/**
* Returns the value extracted from the given byte
* @param data the input byte
* @param msbIndex the index of the first bit to extract ( 0=msb to 7=lsb )
* @param nbBits the number of bits to extract (if '-1' then extract up to the last bit)
* @param bShift true if the bits have to be shifted to the right
* @return the value of the extracted bits as an unsigned char, or 0xFF if a problem has occurred
*/
mpegts.binary.getValueFromByte = function(data, msbIndex/* = 0*/, nbBits/* = -1*/, bShift/* = true*/)
{
	var cMask = 0x00;
	var i = 0;

	if (typeof nbBits === "undefined") {
		nbBits = -1;
	}
	if (typeof msbIndex === "undefined") {
		msbIndex = 0;
	}

	var lsbIndex = (nbBits == -1)?7:(msbIndex + nbBits - 1);
	for (i = msbIndex; i <= lsbIndex; i++)
	{
		cMask += (1 << (7 - i));
	}

	var cValue = data & cMask;
	if (bShift || typeof bShift === "undefined")
	{
		cValue >>= (7 - lsbIndex);
	}
	return cValue;
};