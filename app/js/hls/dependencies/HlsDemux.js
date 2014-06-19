
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



Hls.dependencies.HlsDemux = function () {
    "use strict";

    var pat = null,
        pmt = null,
        pidToTrackId = [],
        tracks = [],

        getTsPacket = function (data, pid) {

            var i = 0;

            while (i < data.length) {
                var tsPacket = new mpegts.ts.TsPacket();
                tsPacket.parse(data.subarray(i, i + mpegts.ts.TsPacket.prototype.TS_PACKET_SIZE));

                if (tsPacket.getPid() === pid) {
                    return tsPacket;
                }
                
                i += mpegts.ts.TsPacket.prototype.TS_PACKET_SIZE;
            }

            return null;
        },

        getPAT = function (data) {

            var tsPacket = getTsPacket(data, mpegts.ts.TsPacket.prototype.PAT_PID);

            if (tsPacket === null) {
                return null;
            }

            // TODO: get PAT section

        },

        getPMT = function (data, pid) {

            var tsPacket = getTsPacket(data, pid);

            if (tsPacket === null) {
                return null;
            }

            // TODO: get PMT section

            var track = new MediaPlayer.vo.Mp4Track();
            track.type = 'video';
            track.trackId = 0;
            track.codecs="avc";
            track.timescale = 90000;

            pidToTrackId[257] = 0;
            tracks.push(track);

            track = new MediaPlayer.vo.Mp4Track();
            track.type = 'audio';
            track.trackId = 1;
            track.codecs="aac";
            track.timescale = 90000;

            pidToTrackId[256] = 1;
            tracks.push(track);



        },

        demuxTsPacket = function(data) {
            var tsPacket,
                pid,
                track,
                sample = null;

            tsPacket = new mpegts.ts.TsPacket();
            tsPacket.parse(data);

            // If packet has only adaptation field, then ignore
            /*if (tsPacket.hasAdaptationFieldOnly()) {
                return;
            }*/

            // Get PID and corresponding track
            pid = tsPacket.getPid();
            track = tracks[pidToTrackId[pid]];

            // PUSI => start storing new AU
            if (tsPacket.getPusi()) {

                // Parse PES header
                var pesPacket = new mpegts.pes.PesPacket();
                pesPacket.parse(tsPacket.getPayload());

                // Store new access unit
                sample = new MediaPlayer.vo.Mp4Track.Sample();
                sample.dts = pesPacket.getDts();
                sample.pts = pesPacket.getPts();
                sample.size = 0;
                sample.subSamples = [];

                // Store payload of PES packet as a subsample
                sample.subSamples.push(pesPacket.getPayload());

                track.samples.push(sample);
            }
            else {
                // Get currently buffered access unit
                if (track.samples.length > 0) {
                    sample = track.samples[track.samples.length - 1];
                }

                // Store payload of TS packet as a subsample
                sample.subSamples.push(tsPacket.getPayload());
            }
        },

        postProcess = function(track) {

            var sample,
                length = 0,
                offset = 0,
                i, s;

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
                    track.data.set(sample.subSamples[s], offset);
                    offset += sample.subSamples[s].length;
                }

                // 
                if (track.codecs.contains('avc')) {
                    mpegts.h264.bytestreamToMp4(track.data);
                }
            }

        },

        doInit = function () {
            pat = null;
            pmt = null;
            tracks = [];
        },

        doDemux = function (data) {

            var nbPackets = data.length / mpegts.ts.TsPacket.prototype.TS_PACKET_SIZE,
                i = 0;

            this.debug.log("[HlsDemux] Demux chunk, size = " + data.length + ", nb packets = " + nbPackets);
            debugger;

            // Parse PSI (PAT, PMT) if not yet received
            if (pat === null) {
                pat = getPAT(data);
                if (pat === null) {
                    return;
                }
            }

            if (pmt === null) {
                pmt = getPMT(data, 4096/*pat.getPmtPid()*/);
                if (pmt === null) {
                    return;
                }
            }

            // Parse and demux TS packets
            i = 0;
            while (i < data.length) {

                demuxTsPacket(data.subarray(i, i + mpegts.ts.TsPacket.prototype.TS_PACKET_SIZE));
                i += mpegts.ts.mpegts.ts.TsPacket.prototype.TS_PACKET_SIZE;
            }

            // Re-assemble samples from sub-samples
            for (i = 0; i < tracks.length; i++) {
                postProcess(tracks[i]);
            }


        };

    return {
        debug: undefined,

        init: doInit,
        demux: doDemux,

        getTracks: function() {
            return tracks;
        }
    };
};

Hls.dependencies.HlsDemux.prototype = {
    constructor: Hls.dependencies.HlsDemux
};


