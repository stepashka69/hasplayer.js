
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


MediaPlayer.dependencies.HlsDemux.H264_NALUTYPE_NONIDR = 1;
MediaPlayer.dependencies.HlsDemux.H264_NALUTYPE_IDR = 5;
MediaPlayer.dependencies.HlsDemux.H264_NALUTYPE_SEI = 6;
MediaPlayer.dependencies.HlsDemux.H264_NALUTYPE_SPS = 7;
MediaPlayer.dependencies.HlsDemux.H264_NALUTYPE_PPS = 8;
MediaPlayer.dependencies.HlsDemux.H264_NALUTYPE_AU_DELIMITER = 9;


MediaPlayer.dependencies.HlsDemux.SubSample = function () {
    "use strict";

    this.data; // the data array containing thr subsample
    this.offset = 0; // the offset of the first byte at which starts the sample data
    this.length = 0; // the length of the data
};

MediaPlayer.dependencies.HlsDemux = function () {
    "use strict";

    var pat = null,
        pmt = null,
        pidToTrackId = [],
        tracks = [],


        parsePAT = function(data, pos) {

            var packet = null;

            packet = mpegts.tspacket.parse(data, pos);

            if (packet.getPid() !== mpegts.PAT_PID) {
                return;
            }

            pat = mpegts.pat.parse(data, pos);
        },

        parsePMT = function(data, pos) {
            var packet = null,
                elementaryStreams;

            packet = mpegts.tspacket.parse(data, pos);

            if (packet.getPid() !== pat.getPmtPid()) {
                return;
            }

            pmt = mpegts.pmt.parse(data, pos);

            elementaryStreams = pmt.getElementaryStreams();

            
        },

        demuxTsPacket = function(data, index, length) {
            var packet,
                pid,
                track,
                sample = null,
                offset = 0;

            packet = mpegts.ts.parse(data, index, length);

            // If packet has only adaptation field, then ignore
            if (packet.hasAdaptationFieldOnly()) {
                return;
            }

            // Get PID and corresponding track
            pid = packet.getPid();
            track = tracks[pidToTrackId[pid]];

            // PUSI => start storing new AU
            if (packet.getPusi()) {

                // Parse PES header
                pes = mpegts.pes.parse(data, index + packet.getHeaderLength(), packet.getPayloadLength());

                // Store new access unit
                sample = new Sample();
                sample.dts = pes.getDts();
                sample.pts = pes.getPts();
                sample.size = 0;
                sample.subSamples = [];

                track.samples.push(sample);

                // Get start offset of sample data and length
                offset = index + packet.getHeaderLength() + pes.getHeaderLength();

            }
            else {
                // Get currently buffered access unit
                if (track.samples.length > 0) {
                    sample = track.samples[track.samples.length - 1];                
                }

                // Get start offset of sample data and length
                offset = index + packet.getHeaderLength();
            }

            // Store AU part
            if (sample) {
                var subSample = new subSample();
                subSample.data = data;
                subSample.offset = offset;
                subSample.length = length - au_index;
                sample.subSamples.push(subSample);
            }

        },

        h264GetSequenceHeader = function(data) {

            var pos = -1,
                length = -1,
                i = 0
                naluType,
                sequenceHeader = null;

            while (i < data.length) {
                if ((data[i] == 0x00) && (data[i+1] == 0x00) && (data[i+2] == 0x00) && (data[i+3] == 0x01)) {

                    naluType = data[i + 4] & 0x1F;

                    // Start of SPS or PPS
                    if ((naluType >= H264_NALUTYPE_SPS) && (naluType <= H264_NALUTYPE_PPS) && (pos === -1) ) {
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
        },


        h264BytestreamToMp4 = function(data) {

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
        },

        postProcess = function(track) {

            var sample,
                length = 0,
                offset = 0,
                i, s

            // Re-assemble sub-sample parts into
            for (i = 0; i < track.samples.length; i++) {
                sample = track.samples[i];

                for (s = 0; s < sample.subSamples.length; s++) {
                    length += sample.subSamples[s].length;
                }
            }

            // Allocate track data
            track.data = new Uint8Array(length);

            for (i = 0; i < track.samples.length; i++) {
                sample = track.samples[i];

                // Copy all sub-sample parts into track data
                for (s = 0; s < sample.subSamples.length; s++) {
                    track.data.set(data.subarray(sample.subSamples[s].offset, sample.subSamples[s].length), offset);
                    offset += sample.subSamples[s].length;
                }

                // 
                if (track.codecs.contains('avc')) {
                    h264BytestreamToMp4(track.data);
                }
            }

        },

        doInit = function () {
            pat = null;
            pmt = null;
            tracks = [];
        },

        doDemux = function (data) {

            var nbPackets = data.length / mpegts.TS_PACKET_SIZE,
                i = 0,
                packet = null,
                elementaryStream;

            // Parse PSI (PAT, PMT) if not yet received
            i = 0;
            while (pat === null) {
                if (i > data.length) {
                    return;
                }
                parsePAT(data, i);
                i += mpegts.TS_PACKET_SIZE;
            }

            i = 0;
            while (pmt === null) {
                if (i > data.length) {
                    return;
                }
                parsePMT(data, i);
                i += mpegts.TS_PACKET_SIZE;
            }

            // Parse and demux TS packets
            i = 0;
            while (i < data.length) {

                demuxTsPacket(data, i, mpegts.ts.TS_PACKET_SIZE);
                i += mpegts.ts.TS_PACKET_SIZE;
            }

            // Re-assemble samples from sub-samples
            for (i = 0; i < tracks.length; i++) {

            }


        };

    return {
        debug: undefined,

        init: doInit,
        demux: doDemux
    };
};

MediaPlayer.dependencies.HlsDemux.prototype = {
    constructor: MediaPlayer.dependencies.HlsDemux
};