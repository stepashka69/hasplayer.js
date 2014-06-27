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

    var getIndex = function (adaptation, manifest) {

            var periods = manifest.Period_asArray,
                i, j;

            for (i = 0; i < periods.length; i += 1) {
                var adaptations = periods[i].AdaptationSet_asArray;
                for (j = 0; j < adaptations.length; j += 1) {
                    if (adaptations[j] === adaptation) {
                        return j;
                    }
                }
            }

            return -1;
        },

        processTfrf = function(tfrf, adaptation) {

            var manifest = rslt.manifestModel.getValue(),
                segmentsUpdated = false,
                // Get adaptation's segment timeline (always a SegmentTimeline in Smooth Streaming use case)
                segments = adaptation.SegmentTemplate.SegmentTimeline.S,
                entries = tfrf.entry,
                fragment_absolute_time = 0,
                fragment_duration = 0,
                segment = null,
                r = 0,
                t = 0,
                i = 0,
                availabilityStartTime = null;

            // Go through tfrf entries
            while (i < entries.length)
            {
                fragment_absolute_time = entries[i].fragment_absolute_time;
                fragment_duration = entries[i].fragment_duration;

                // Get timestamp of the last segment
                segment = segments[segments.length-1];
                r = (segment.r === undefined)?0:segment.r;
                t = segment.t + (segment.d * r);

                if (fragment_absolute_time > t)
                {
                    rslt.debug.log("[HlsFragmentController] Add new segment - t = " + (fragment_absolute_time / 10000000.0));
                    if (fragment_duration === segment.d)
                    {
                        segment.r = r + 1;
                    }
                    else
                    {
                        segments.push({
                            't': fragment_absolute_time,
                            'd': fragment_duration
                        });
                    }
                    segmentsUpdated = true;
                }

                i += 1;
            }

            // In case we have added some segments, we also check if some out of date segments
            // may not been removed
            if (segmentsUpdated) {

                // Get timestamp of the last segment
                segment = segments[segments.length-1];
                r = (segment.r === undefined)?0:segment.r;
                t = segment.t + (segment.d * r);

                // Determine the segments' availability start time
                availabilityStartTime = t - (manifest.timeShiftBufferDepth * 10000000);

                // Remove segments prior to availability start time
                segment = segments[0];
                while (segment.t < availabilityStartTime)
                {
                    rslt.debug.log("[HlsFragmentController] Remove segment  - t = " + (segment.t / 10000000.0));
                    if ((segment.r !== undefined) && (segment.r > 0))
                    {
                        segment.t += segment.d;
                        segment.r -= 1;
                    }
                    else
                    {
                        segments.splice(0, 1);
                    }
                    segment = segments[0];
                }
            }

            return segmentsUpdated;
        },

        generateInitSegment = function(data) {

            // Initialize demux
            //rslt.hlsDemux.init();

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
            // Initialize demux
            //rslt.hlsDemux.init();

            // Process the HLS chunk to get media tracks description
            //var tracks = rslt.hlsDemux.getTracks(new Uint8Array(data));
            var tracks = rslt.hlsDemux.demux(new Uint8Array(data));

            // Generate media segment (moov)
            return rslt.mp4Processor.generateMediaSegment(tracks, rslt.sequenceNumber++);
        },

        getInitData = function(representation) {
            // return data in byte format
            // call MP4 lib to generate the init
            
            // Get required media information from manifest  to generate initialisation segment
            //var representation = getRepresentationForQuality(quality, adaptation);
            if(representation){
                if(!representation.initData){
                    var manifest = rslt.manifestModel.getValue();
                    var adaptation = representation.adaptation;
                    var realAdaptation = manifest.Period_asArray[adaptation.period.index].AdaptationSet_asArray[adaptation.index];
                    var realRepresentation = realAdaptation.Representation_asArray[representation.index];
                    var media = {};
                    media.type = rslt.getType() || 'und';
                    media.trackId = adaptation.index + 1; // +1 since track_id shall start from '1'
                    media.timescale = representation.timescale;
                    media.duration = representation.adaptation.period.duration;
                    media.codecs = realRepresentation.codecs;
                    media.codecPrivateData = realRepresentation.codecPrivateData;
                    media.bandwidth = realRepresentation.bandwidth;

                    //DRM Protected Adaptation is detected
                    if (realAdaptation.ContentProtection !== undefined){
                        media.contentProtection = realAdaptation.ContentProtection;
                    }

                    // Video related informations
                    media.width = realRepresentation.width || realAdaptation.maxWidth;
                    media.height = realRepresentation.height || realAdaptation.maxHeight;

                    // Audio related informations
                    media.language = realAdaptation.lang ? realAdaptation.lang : 'und';

                    media.channels = getAudioChannels(realAdaptation, realRepresentation);
                    media.samplingRate = getAudioSamplingRate(realAdaptation, realRepresentation);

                    representation.initData =  rslt.mp4Processor.generateInitSegment(media);

                    //console.saveBinArray(representation.initData, "init_evolution_"+media.type+"_"+media.bandwidth+".mp4");
                }
                return representation.initData;
            }else{
                return null;
            }
        };

    
    var rslt = Custom.utils.copyMethods(MediaPlayer.dependencies.FragmentController);

    rslt.manifestModel = undefined;
    rslt.hlsDemux = undefined;
    rslt.mp4Processor = undefined;

    rslt.sequenceNumber = 1;

    rslt.process = function (bytes, request, representations) {

        var result = null,
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

            //var res = convertFragment(result, request, adaptation);
            result = generateMediaSegment(bytes);
            //console.saveBinArray(result, "moof_" + rslt.sequenceNumber + ".mp4");

           /* result = res.bytes;
            if (res.segmentsUpdated) {
                representations = [];
            }*/
        }

        // Note: request = 'undefined' in case of initialization segments
        if ((request === undefined)) {

            // Initialization segment => generate moov initialization segment from PSI tables
            result = generateInitSegment(bytes);
            //console.saveBinArray(result, "moov.mp4");


            // PATCH timescale value in mvhd and mdhd boxes in case of live streams within chrome
            /*if ((navigator.userAgent.indexOf("Chrome") >= 0) && (manifest.type === "dynamic")) {
                var init_segment = mp4lib.deserialize(result);
                // FIXME unused variables ?
                var moov = init_segment.getBoxByType("moov");
                var mvhd = moov.getBoxByType("mvhd");
                var trak = moov.getBoxByType("trak");
                var mdia = trak.getBoxByType("mdia");
                var mdhd = mdia.getBoxByType("mdhd");

                mvhd.timescale /= 1000;
                mdhd.timescale /= 1000;

                result = mp4lib.serialize(init_segment);
            }*/
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
