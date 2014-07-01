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

Hls.dependencies.HlsFragmentController = function () {
    "use strict";
    var lastRequestQuality = null;

    var generateInitSegment = function(data) {
            var manifest = rslt.manifestModel.getValue();

            // Process the HLS chunk to get media tracks description
            var tracks = rslt.hlsDemux.getTracks(new Uint8Array(data));

            // Add track duration
            for (var i = 0; i < tracks.length; i++) {
                tracks[i].duration = manifest.mediaPresentationDuration;
            }
            // Generate init segment (moov)
            return rslt.mp4Processor.generateInitSegment(tracks);
        },

        generateMediaSegment = function(data) {
            // Process the HLS chunk to get media tracks description
            //var tracks = rslt.hlsDemux.getTracks(new Uint8Array(data));
            var tracks = rslt.hlsDemux.demux(new Uint8Array(data));

            // Generate media segment (moov)
            return rslt.mp4Processor.generateMediaSegment(tracks, rslt.sequenceNumber++);
        };
    
    var rslt = Custom.utils.copyMethods(MediaPlayer.dependencies.FragmentController);

    rslt.manifestModel = undefined;
    rslt.hlsDemux = undefined;
    rslt.mp4Processor = undefined;

    rslt.sequenceNumber = 1;

    rslt.process = function (bytes, request, representations) {

        var result = null,
            InitSegmentData = null,
            manifest = this.manifestModel.getValue();

        if ((bytes === null) || (bytes === undefined) || (bytes.byteLength === 0)) {
            return Q.when(bytes);
        }

        // Intialize output data
        result = new Uint8Array(bytes);

        // Media segment => genrate corresponding moof data segment from demultiplexed mpeg-2 ts chunk
        if (request && (request.type === "Media Segment") && representations && (representations.length > 0)) {

            // Get current adaptation containing provided representations
            // (Note: here representations is of type Dash.vo.Representation)
            var adaptation = manifest.Period_asArray[representations[0].adaptation.period.index].AdaptationSet_asArray[representations[0].adaptation.index];

            if (lastRequestQuality === null || lastRequestQuality !== request.quality) {
                lastRequestQuality = request.quality;
                InitSegmentData = generateInitSegment(bytes);
                request.index = undefined;
                request.quality = 1;
            }

            result = generateMediaSegment(bytes);

            //new quality => append init segment + media segment in Buffer
            if (InitSegmentData !== null) {
                var catArray = new Uint8Array(InitSegmentData.length+result.length);
                catArray.set(InitSegmentData,0);
                catArray.set(result, InitSegmentData.length);
                result = catArray;
            }
            //console.saveBinArray(result, "moof_" + rslt.sequenceNumber + ".mp4");
        }

        if (request !== undefined) {
            //console.saveBinArray(result, request.streamType + "_" + request.index + "_" + request.quality + ".mp4");
        }

        return Q.when(result);
    };

    return rslt;
};

Hls.dependencies.HlsFragmentController.prototype = {
    constructor: Hls.dependencies.HlsFragmentController
};
