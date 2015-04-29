/*
 * The copyright in this software is being made available under the BSD License, included below. This software may be subject to other third party and contributor rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Akamai Technologies
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * •  Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * •  Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * •  Neither the name of the Akamai Technologies nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
MediaPlayer.utils.TTMLParser = function () {
    "use strict";

    /*
    * This TTML parser follows "TTML Simple Delivery Profile for Closed Captions (US)" spec - http://www.w3.org/TR/ttml10-sdp-us/
    *
    * ORANGE: Some strict limitations of US profile removed to allow for non-US TTML2 implmentations used in Europe:
    *         - no requirement for US profile
    *         - offset-style format allowed for <timeExpression>
    * */

    var SECONDS_IN_HOUR = 60 * 60,
        SECONDS_IN_MIN = 60,

        // R0028 - A document must not contain a <timeExpression> value that does not conform to the subset of clock-time that
        // matches either of the following patterns: hh:mm:ss.mss or hh:mm:ss:ff, where hh denotes hours (00-23),
        // mm denotes minutes (00-59), ss denotes seconds (00-59), mss denotes milliseconds (000-999), and ff denotes frames (00-frameRate - 1).
        // R0030 - For time expressions that use the hh:mm:ss.mss format, the following constraints apply:
        // - Exactly 2 digits must be used in each of the hours, minutes, and second components (include leading zeros).
        // - Exactly 3 decimal places must be used for the milliseconds component (include leading zeros).
        // R0031 -For time expressions that use the hh:mm:ss:ff format, the following constraints apply:
        // - Exactly 2 digits must be used in each of the hours, minutes, second, and frame components (include leading zeros).

        // Orange: the restrictions above are for US profile only.
        //         in general, TTML allows other syntax representations, see https://dvcs.w3.org/hg/ttml/raw-file/tip/ttml2/spec/ttml2.html#timing-value-timeExpression
        //         we have added support for offset-time, a pretty popular one.
        
        timingRegexClockTime = /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])((\.[0-9][0-9][0-9])|(:[0-9][0-9]))$/,
        timingRegexOffsetTime = /^\d+(\.\d+|)(h|m|s|ms|f)$/,
        ttml,

        parseTimings = function(timingStr) {

            var timeParts,
                parsedTime,
                frameRate,
                metric;

            if (timingRegexClockTime.test(timingStr)) {

                timeParts = timingStr.split(":");

                parsedTime = (parseFloat(timeParts[0]) * SECONDS_IN_HOUR +
                    parseFloat(timeParts[1]) * SECONDS_IN_MIN +
                    parseFloat(timeParts[2]));

                // R0031 -For time expressions that use the hh:mm:ss:ff format, the following constraints apply:
                //  - A ttp:frameRate attribute must be present on the tt element.
                //  - A ttp:frameRateMultiplier attribute may be present on the tt element.

                // ORANGE: removed the restrictions above. 
                //         now if no frameRate is defined in tt, the :ff information is ignored.

                if (timeParts[3]) {
                    frameRate = ttml.tt.frameRate;

                    if (frameRate && !isNaN(frameRate)) {
                        parsedTime += parseFloat(timeParts[3]) / frameRate;
                    }
                }
                return parsedTime;
            }

            if (timingRegexOffsetTime.test(timingStr)) {
                
                if (timingStr.substr(timingStr.length-2)=='ms') {
                    parsedTime = parseFloat(timingStr.substr(0,timingStr.length-3));
                    metric = timingStr.substr(timingStr.length-2);
                } else {
                    parsedTime = parseFloat(timingStr.substr(0,timingStr.length-2));
                    metric = timingStr.substr(timingStr.length-1);
                }

                switch (metric) {
                    case 'h':
                        parsedTime = parsedTime*60*60;
                        break;
                    case 'm':
                        parsedTime = parsedTime*60;
                        break;
                    case 's':
                        break;
                    case 'ms':
                        parsedTime = parsedTime*0.01;
                        break;
                    case 'f':
                        frameRate = ttml.tt.frameRate;

                        if (frameRate && !isNaN(frameRate)) {
                            parsedTime = parsedTime / frameRate;
                        } else {
                            return NaN;
                        }
                        break;
                }

            return parsedTime;
            }

            return NaN;
        },

        passStructuralConstraints = function () {
            var passed = false,
                hasTt = ttml.hasOwnProperty("tt"),
                hasHead = hasTt ? ttml.tt.hasOwnProperty("head") : false,
                hasLayout = hasHead ? ttml.tt.head.hasOwnProperty("layout") : false,
                hasStyling = hasHead ? ttml.tt.head.hasOwnProperty("styling") : false,
                hasBody = hasTt ? ttml.tt.hasOwnProperty("body") : false;

            // R001 - A document must contain a tt element.
            // R002 - A document must contain both a head and body element.
            // R003 - A document must contain both a styling and a layout element.
            if (hasTt && hasHead && hasLayout && hasStyling && hasBody) {
                passed = true;
            }

            // R0008 - A document must contain a ttp:profile element where the use attribute of that element is specified as http://www.w3.org/ns/ttml/profile/sdp-us.
            // ORANGE: The R0008 requirement is removed in the parser implementation to make it work with non-US profiles

            return passed;
        },

        // ORANGE: now prefix is returned ending with ':' (if not empty), or empty string if not found.
        //         So it can be directly added to attribute name with no need to check if the 
        //         namespace exists or not

        getNamespacePrefix = function(json, ns) {
            var r = Object.keys(json)
                .filter(function(k){
                    return k.split(":")[0] === "xmlns" && json[k] === ns;
                }).map(function(k){
                    return k.split(":")[1];
                });
            if (r.length === 0) {
               r[0] = "";
            }

            return r;
        },

        getRegionInfo = function (json, regionId) {
            var j = 0;
            if (json.head.layout) {
                for (j = 0; j < json.head.layout.region_asArray.length; j++) {
                    var region = json.head.layout.region_asArray[j];
                    if (region['xml:id'] === regionId) {
                        return region;
                    }
                }
            }
            return null;
        },

        getStyleInfo = function (json, styleId) {
            var j = 0;
            if (json.head.layout) {
                for (j = 0; j < json.head.styling.style_asArray.length; j++) {
                    var style = json.head.styling.style_asArray[j];
                    if (style['xml:id'] === styleId) {
                        return style;
                    }
                }
            }
            return null;
        },

        internalParse = function(data) {
            var captionArray = [],
                converter = new X2JS([], "", false),
                errorMsg,
                cues,
                cue,
                startTime,
                endTime,
                nsttp,
                nscue,
                cssStyle,
                ttsPref,
                caption,
                i, j;

            try {
                ttml = converter.xml_str2json(data);

                if (!passStructuralConstraints()) {
                    errorMsg = "TTML document has incorrect structure";
                    return Q.reject(errorMsg);
                }

                nsttp = getNamespacePrefix(ttml.tt, "http://www.w3.org/ns/ttml#parameter");
                ttsPref = getNamespacePrefix(ttml.tt, "http://www.w3.org/ns/ttml#styling");

                if (ttml.tt.hasOwnProperty(nsttp[0] === ""?"frameRate":nsttp[0]+':' + "frameRate")) {
                    ttml.tt.frameRate = parseInt(ttml.tt[nsttp[0]+':' + "frameRate"], 10);
                }

                if(!ttml.tt.body.div_asArray)
                {
                    errorMsg = "TTML document does not contain any div";
                    return Q.reject(errorMsg);
                }
                
                cues = ttml.tt.body.div_asArray[0].p_asArray;

                if (!cues || cues.length === 0) {
                    errorMsg = "TTML document does not contain any cues";
                    return Q.reject(errorMsg);
                }

                for (i = 0; i < cues.length; i += 1) {
                    caption = null;
                    cue = cues[i];

                    nscue = getNamespacePrefix(cue,"http://www.w3.org/2006/10/ttaf1");

                    startTime = parseTimings(cue[nscue[0] === ""?'begin':nscue[0]+':'+'begin']);
                    endTime = parseTimings(cue[nscue[0] === ""?'end':nscue[0]+':'+'end']);

                    if (isNaN(startTime) || isNaN(endTime)) {
                        errorMsg = "TTML document has incorrect timing value";
                        return Q.reject(errorMsg);
                    }

                    if (cue.hasOwnProperty(nscue[0] === ""?"style":nscue[0]+':'+"style")) {
                        var cueStyle = getStyleInfo(ttml.tt, cue[nscue[0] === ""?"style":nscue[0]+':'+"style"]);
                        if (cueStyle) {
                            cssStyle = { backgroundColor: cueStyle[ttsPref[0]+':'+'backgroundColor'],
                                                 color: cueStyle[ttsPref[0]+':'+'color'],
                                                 fontSize: cueStyle[ttsPref[0]+':'+'fontSize'],
                                                 fontFamily: cueStyle[ttsPref[0]+':'+'fontFamily']};
                        }
                    }

                    if (cue.hasOwnProperty(nscue[0] === ""?"region":nscue[0]+':' + "region")){
                        var cueRegion = getRegionInfo(ttml.tt, cue[nscue[0] === ""?"region":nscue[0]+':' + "region"]);
                        var prefix = getNamespacePrefix(cueRegion,"http://www.w3.org/2006/10/ttaf1");
                        //line and position element have no effect on IE
                        //For Chrome line = 11 is a workaround to reorder subtitles
                        if (cueRegion) {
                            if (cueRegion.hasOwnProperty(ttsPref[0]+':'+'origin')) {
                            var origin_X = cueRegion[ttsPref[0]+':'+'origin'].split(' ')[0];
                            caption = {
                                    start: startTime,
                                    end: endTime,
                                    data: cue.__text,
                                    position: parseInt(origin_X.substr(0, origin_X.length-1)),
                                    line:18,
                                    style: cssStyle};
                            }
                        }
                    }
                    //style informations have not been found : add subtitles without it
                    if (!caption) {
                        caption = {
                                    start: startTime,
                                    end: endTime,
                                    data: cue.__text};
                    }
                    captionArray.push(caption);
                }

                return Q.when(captionArray);

            } catch (err) {
                errorMsg = err.message;
                return Q.reject(errorMsg);
            }
    };

    return {
        parse: internalParse

    };
};
