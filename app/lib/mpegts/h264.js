
/*
 * The copyright in this software is being made available under the BSD License, included below. This software may be subject to other third party and contributor rights, including patent rights, and no such rights are granted under this license.
 * 
 * Copyright (c) 2013, Orange
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * •  Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * •  Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * •  Neither the name of the Digital Primates nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


mpegts.h264.getSequenceHeader = function (data) { // data as Uint8Array

    var pos = -1,
        length = -1,
        i = 0
        naluType,
        sequenceHeader = null;

    while (i < data.length) {
        if ((data[i] == 0x00) && (data[i+1] == 0x00) && (data[i+2] == 0x00) && (data[i+3] == 0x01)) {

            naluType = data[i + 4] & 0x1F;

            // Start of SPS or PPS
            if ((naluType >= NALUTYPE_SPS) && (naluType <= NALUTYPE_PPS) && (pos === -1) ) {
                pos = i;
            }
            else if (pos > 0)
            {
                length = i - pos;
            }
        }
        i++;
    }

    if (pos > 0) {
        sequenceHeader = new Uint8Array(length);
        sequenceHeader.set(data.subarray(pos, length));
    }

    return sequenceHeader;
};


mpegts.h264.bytestreamToMp4 = function (data) { // data as Uint8Array

    var i = 0,
        startCodeOffset = 0;
        naluSize = 0;

    while (i < data.length) {
        if ((i == length) || ((data[i] == 0x00) && (data[i+1] == 0x00) && (data[i+2] == 0x00) && (data[i+3] == 0x01))) {

            if (startCodeOffset > 0) {
                naluSize = (i - startCodeOffset - 4); // 4 = start code length or NALU-size field length
                data[startCodeOffset] = (nalusize & 0xFF000000) >> 24;
                data[startCodeOffset+1] = (nalusize & 0x00FF0000) >> 16;
                data[startCodeOffset+2] = (nalusize & 0x0000FF00) >> 8;
                data[startCodeOffset+3] = (nalusize & 0x000000FF);
            }

            startCodeOffset = i;
        }
        i++;
    }
};

mpegts.h264.NALUTYPE_NONIDR = 1;
mpegts.h264.NALUTYPE_IDR = 5;
mpegts.h264.NALUTYPE_SEI = 6;
mpegts.h264.NALUTYPE_SPS = 7;
mpegts.h264.NALUTYPE_PPS = 8;
mpegts.h264.NALUTYPE_AU_DELIMITER = 9;


