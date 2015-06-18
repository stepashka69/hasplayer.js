/*
 * The copyright in this software module is being made available under the BSD License, included below. This software module may be subject to other third party and/or contributor rights, including patent rights, and no such rights are granted under this license.
 * The whole software resulting from the execution of this software module together with its external dependent software modules from dash.js project may be subject to Orange and/or other third party rights, including patent rights, and no such rights are granted under this license.
 * 
 * Copyright (c) 2014, Orange
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * •  Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * •  Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * •  Neither the name of the Orange nor the names of its contributors may be used to endorse or promote products derived from this software module without specific prior written permission.
 * 
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * @constructs OrangeHasPlayer
 * @param videoElement - an HTML5 video element used to decode and show media data.
 */

(function(){

    var OrangeHasPlayer = function (videoElement) {
        "use strict";
        var context = new Custom.di.CustomContext(),
            mediaPlayer = new MediaPlayer(context),
            video = videoElement;

         return {
            /**
             * Init video player to be ready to play video.
             * @access public
             * @memberof OrangeHasPlayer#
             */
            init: function(){
                mediaPlayer.startup();
                mediaPlayer.attachView(video);
            },
            
            /**
             * load a video stream with stream url and protection datas.
             * @access public
             * @memberof OrangeHasPlayer#
             * @param url - manifest video url(Dash, Smooth or Hls manifest).
             * @param protData - informations about protection (back url and custom data are stored in a json object).
             */
            load: function(url, protData){

            },

            /**
             * play the current content. If auto play value equals to true, this call isn't necessary after the load command.
             * @access public
             * @memberof OrangeHasPlayer#
             */
            play: function(){

            },

            /**
             * Seek the content to the specify value. In VOD, this function have to test
             * if the value is between 0 and content duration.
             * In LIVE, this function will be used to move in the DVR window.
             * @access public
             * @memberof OrangeHasPlayer#
             * @param time - time value in seconds.
             */
            seek: function(time){

            },

            /**
             * Call the pause command on video element.
             * @access public
             * @memberof OrangeHasPlayer#
             */
            pause: function(){

            },

            /**
             * set the HasPlayer auto play to value.
             * @access public
             * @memberof OrangeHasPlayer#
             * @param value - auto play value.
             */
            setAutoPlay: function(value){

            },

            /**
             * get if the HasPlayer has enabled the auto play. Default value is true
             * @access public
             * @memberof OrangeHasPlayer#
             * @return auto play value
             */
            getAutoPlay: function () {

            },
            
            /**
             * used to stop streaming and seek to 0. After this call, a play command, without changing url, restarts
             * streaming from the beginning.
             * @access public
             * @memberof OrangeHasPlayer#
             */
            stop: function(){

            },

            /**
             * Reset HasPlayer data : stop downloading chunks elements, current url and protection data values set to null.
             * @access public
             * @memberof OrangeHasPlayer#
             */
            reset: function(){

            },

            /**
             * register events on either video or MediaPlayer element
             * @access public
             * @memberof OrangeHasPlayer#
             * @param type - event type.
             * @param listener - callback name.
             */
            addEventListener: function(type, listener){

            },

            /**
             * unregister events on either video or MediaPlayer element
             * @access public
             * @memberof OrangeHasPlayer#
             * @param type - event type.
             * @param listener - callback name.
             */
            removeEventListener: function(type, listener){

            },

            /**
             * get audio tracks array from adaptive manifest
             * @access public
             * @memberof OrangeHasPlayer#
             * @return audio tracks array
             */
            getAudioTracks: function(){

            },

            /**
             * set current audio track
             * @access public
             * @memberof OrangeHasPlayer#
             * @param audioTrack - current audio track.
             */
            setAudioTrack: function(audioTrack){

            },
            
            /**
             * set current subtitle track
             * @access public
             * @memberof OrangeHasPlayer#
             * @param subtitleTrack - current subtitle track.
             */
            setSubtitleTrack: function(subtitleTrack){

            },

            /**
             * get subtitle tracks array from adaptive manifest
             * @access public
             * @memberof OrangeHasPlayer#
             * @return subtitle tracks array
             */
            getSubtitleTracks: function(){

            },

            /**
             * set global parameters on HasPlayer
             * @access public
             * @memberof OrangeHasPlayer#
             * @param config - json config to set.
             */
            setParams: function(config){

            },

            /**
             * set a specific parameter on hasplayer,
             * if a global config has been set, this call override global one.
             * @access public
             * @memberof OrangeHasPlayer#
             * @param param - parameter name.
             * @param value - value to set for this parameter (json object).
             */
            setParam: function(param, value){

            },

            /**
             * get video bitrates array from adaptive manifest
             * @access public
             * @memberof OrangeHasPlayer#
             * @return video bitrates array
             */
            getVideoBitrates: function(){
                var videoBitrates;
                return videoBitrates;
            },

            /**
             * get current media duration
             * @access public
             * @memberof OrangeHasPlayer#
             * @return media duration in seconds, infinity for live content
             */
            getDuration: function(){

            },

            /**
             * used by webapp to notify HasPlayer that size of the main div has changed.
             * @access public
             * @memberof OrangeHasPlayer#
             * @param value - the new fullscreen value 
             */
            fullscreenChanged: function(value){

            }
         };
    };

    /**
     * @class
     * @classdesc OrangeHasPlayer is the object used by the webapp to instanciante and control hasplayer.
     */
    OrangeHasPlayer.prototype = {
        constructor: OrangeHasPlayer
    };


    /**
     * Wrap UMD definition for OrangeHasPlayer
     */


    if ((typeof define !== "undefined" && define !== null ? define.amd : void 0) != null) {
       define(function() {
           return OrangeHasPlayer;
       });
    } else if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
       module.exports = OrangeHasPlayer;
    } else if (typeof window !== "undefined" && window !== null) {
       if (window.OrangeHasPlayer === null) {
           window.OrangeHasPlayer = OrangeHasPlayer;
       }
    }

}).call(this);

