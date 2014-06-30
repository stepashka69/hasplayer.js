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
 
Hls.dependencies.HlsHandler = function() {
	var type,
		isDynamic;
		
	var getRequestUrl = function (destination, representation) {
        var baseURL = representation.adaptation.period.mpd.manifest.Period_asArray[representation.adaptation.period.index].
                AdaptationSet_asArray[representation.adaptation.index].Representation_asArray[representation.index].BaseURL,
            url;

        if (destination === baseURL) {
            url = destination;
        } else if (destination.indexOf("http://") !== -1) {
            url = destination;
        } else {
            url = baseURL + destination;
        }

        return url;
    };

	var generateInitRequest = function(representation, streamType) {
        // ORANGE unnecessary utilisation of self
        // var self = this,
        var period,
            request = new MediaPlayer.vo.SegmentRequest(),
            presentationStartTime;

        period = representation.adaptation.period;

        request.streamType = streamType;
        request.type = "Initialization Segment";
        request.url = getRequestUrl(representation.initialization, representation);
        request.range = representation.range;
        presentationStartTime = period.start;

// ORANGE FIXME isDynamic
		var isDynamic = false;

        request.availabilityStartTime = this.timelineConverter.calcAvailabilityStartTimeFromPresentationTime(presentationStartTime, representation.adaptation.period.mpd, isDynamic);
        request.availabilityEndTime = this.timelineConverter.calcAvailabilityEndTimeFromPresentationTime(presentationStartTime + period.duration, period.mpd, isDynamic);
        request.quality = representation.index;

        return request;
    };


	var getInit = function (representation) {
        var deferred = Q.defer(),
            request = null,
            url = null,
            self = this;

        // if (!representation) {
        //     return Q.reject("no represenation");
        // }

        // self.debug.log("Getting the initialization request.");

        // if (representation.initialization) {
        //     self.debug.log("Got an initialization.");
        //     request = generateInitRequest.call(self, representation, type);
        //     deferred.resolve(request);
        // } else {
            // Go out and find the initialization.
            // url = representation.adaptation.period.mpd.manifest.Period_asArray[representation.adaptation.period.index].
            //     AdaptationSet_asArray[representation.adaptation.index].Representation_asArray[representation.index].BaseURL;

                //FIXME
			url = representation.adaptation.period.mpd.manifest.Period_asArray[representation.adaptation.period.index].
				AdaptationSet_asArray[representation.adaptation.index].Representation_asArray[representation.index].
				SegmentList.SegmentURL_asArray[0].media;


            self.baseURLExt.loadInitialization(url).then(
                function (theRange) {
                    self.debug.log("Got an initialization.");
                    representation.range = theRange;
                    representation.initialization = url;
                    request = generateInitRequest.call(self, representation, type);
                    deferred.resolve(request);
                },
                function (httprequest) {
                    deferred.reject(httprequest);
                }
            );
        // }

        return deferred.promise;
    };
	
	var rslt = Custom.utils.copyMethods(Dash.dependencies.DashHandler);
	rslt.mp4Processor = undefined;
    rslt.getType = function () {
        return type;
    };

    rslt.setType = function (value) {
        type = value;
    };

    rslt.getIsDynamic = function () {
        return isDynamic;
    };
    rslt.setIsDynamic = function (value) {
        isDynamic = value;
    };

	rslt.getInitRequest = getInit;

	return rslt;
};

Hls.dependencies.HlsHandler.prototype =  {
	constructor : Hls.dependencies.HlsHandler
};
