/**
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

(function(exports){                                                     
    "use strict";
    var OrangeHasPlayer;


        OrangeHasPlayer = function(videoElement){
            var context,
                mediaPlayer,
                video,
                state= 'UNINITIALIZED';

            if(!videoElement){
                throw new Error('OrangeHasPlayer.init(): Invalid Argument');
            }

            context = new MediaPlayer.di.Context();
            mediaPlayer = new MediaPlayer(context);
            video = videoElement;
            mediaPlayer.startup();
            mediaPlayer.attachView(video);
            state = 'PLAYER_CREATED';


        

            var _isPlayerInitialized = function(){
                if (state === 'UNINITIALIZED') {
                    throw new Error('OrangeHasPlayer.hasMediaSourceExtension(): Must not be in UNINITIALIZED state');
                }
            };

            
            
            /**
             * load a video stream with stream url and protection datas.
             * @access public
             * @memberof OrangeHasPlayer#
             * @param url - manifest video url(Dash, Smooth or Hls manifest).
             * @param protData - informations about protection (back url and custom data are stored in a json object).
             */
            this.load = function(url, protData){
                mediaPlayer.attachSource(url, protData);
                if (mediaPlayer.getAutoPlay()) {
                    state = 'PLAYER_RUNNING';
                }
            };

            /**
             * play the current content. If auto play value equals to true, this call isn't necessary after the load command.
             * @access public
             * @memberof OrangeHasPlayer#
             */
            this.play = function(){
                if (state === "PLAYER_STOPPED") {
                    video.play();
                }else{
                    mediaPlayer.play();
                }

                state = 'PLAYER_RUNNING';            
            };

            /**
             * Seek the content to the specify value. In VOD, this function have to test
             * if the value is between 0 and content duration.
             * In LIVE, this function will be used to move in the DVR window.
             * @access public
             * @memberof OrangeHasPlayer#
             * @param time - time value in seconds.
             */
            this.seek = function(time){

            };

            /**
             * Call the pause command on video element.
             * @access public
             * @memberof OrangeHasPlayer#
             */
            this.pause = function(){
                state = "PLAYER_PAUSED";
                video.pause();
            };

            /**
             * set the HasPlayer auto play to value.
             * @access public
             * @memberof OrangeHasPlayer#
             * @param value - auto play value.
             */
            this.setAutoPlay = function(value){
                _isPlayerInitialized();
                mediaPlayer.setAutoPlay(value);
            };

            /**
             * get if the HasPlayer has enabled the auto play. Default value is true
             * @access public
             * @memberof OrangeHasPlayer#
             * @return auto play value
             */
            this.getAutoPlay = function () {
                _isPlayerInitialized();
                return mediaPlayer.getAutoPlay();
            };
            
            /**
             * used to stop streaming and seek to 0. After this call, a play command, without changing url, restarts
             * streaming from the beginning.
             * @access public
             * @memberof OrangeHasPlayer#
             */
            this.stop = function(){
                state = "PLAYER_STOPPED";
                video.pause();
                video.currentTime = 0;
            };

            /**
             * Reset HasPlayer data : stop downloading chunks elements, current url and protection data values set to null.
             * @access public
             * @memberof OrangeHasPlayer#
             */
            this.reset = function(){
                _isPlayerInitialized();
                mediaPlayer.reset();
            };

            /**
             * register events on either video or MediaPlayer element
             * @access public
             * @memberof OrangeHasPlayer#
             * @param type - event type.
             * @param listener - callback name.
             */
            this.addEventListener = function(type, listener){
                switch (type){
                    case "error" :
                    case "metricChanged" :
                    case "subtitlesStyleChanged" :
                        mediaPlayer.addEventListener(type, listener);
                        break;
                    case "loadeddata" :
                    case "fullscreenchange" : 
                    case "mozfullscreenchange" :
                    case "webkitfullscreenchange" :
                        video.addEventListener(type, listener);
                        break;
                }
            };

            /**
             * unregister events on either video or MediaPlayer element
             * @access public
             * @memberof OrangeHasPlayer#
             * @param type - event type.
             * @param listener - callback name.
             */
            this.removeEventListener = function(type, listener){
                switch (type){
                    case "error" :
                    case "metricChanged" :
                    case "subtitlesStyleChanged" :
                        mediaPlayer.removeEventListener(type, listener);
                        break;
                    case "loadeddata" :
                    case "fullscreenchange" : 
                    case "mozfullscreenchange" :
                    case "webkitfullscreenchange" :
                        video.removeEventListener(type, listener);
                        break;
                }
            };

            /**
             * get audio tracks array from adaptive manifest
             * @access public
             * @memberof OrangeHasPlayer#
             * @return audio tracks array
             */
            this.getAudioTracks = function(){
                _isPlayerInitialized();
                return mediaPlayer.getAudioTracks();
            };

            /**
             * set current audio track
             * @access public
             * @memberof OrangeHasPlayer#
             * @param audioTrack - current audio track.
             */
            this.setAudioTrack = function(audioTrack){
                _isPlayerInitialized();
                mediaPlayer.setAudioTrack(audioTrack);
            };
            
            /**
             * set current subtitle track
             * @access public
             * @memberof OrangeHasPlayer#
             * @param subtitleTrack - current subtitle track.
             */
            this.setSubtitleTrack = function(subtitleTrack){
                _isPlayerInitialized();
                mediaPlayer.setSubtitleTrack(subtitleTrack);
            };

            /**
             * get subtitle tracks array from adaptive manifest
             * @access public
             * @memberof OrangeHasPlayer#
             * @return subtitle tracks array
             */
            this.getSubtitleTracks = function(){
                _isPlayerInitialized();
                return mediaPlayer.getSubtitleTracks();
            };

            /**
             * set parameters on HasPlayer
             * @access public
             * @memberof OrangeHasPlayer#
             * @param config - json config to set.
             */
            this.setParams = function(config){
                _isPlayerInitialized();
                mediaPlayer.setConfig(config);
            };     

            /**
             * get video bitrates array from adaptive manifest
             * @access public
             * @memberof OrangeHasPlayer#
             * @return video bitrates array
             */
            this.getVideoBitrates = function(){
                var videoBitrates;
                return videoBitrates;
            };

            /**
             * get current media duration
             * @access public
             * @memberof OrangeHasPlayer#
             * @return media duration in seconds, infinity for live content
             */
            this.getDuration = function(){

            };

            /**
             * used by webapp to notify HasPlayer that size of the main div has changed.
             * @access public
             * @memberof OrangeHasPlayer#
             * @param value - the new fullscreen value 
             */
            this.fullscreenChanged = function(value){

            };

             /**
             * @access public
             * @memberof OrangeHasPlayer#
             * @return player version
             */
            this.getVersion = function () {
                _isPlayerInitialized();
                return mediaPlayer.getVersion();
            };

            /**
             * get the HAS version
             * @access public
             * @memberof OrangeHasPlayer#
             * @return hasplayer version
             */
            this.getVersionHAS = function () {
                _isPlayerInitialized();
                return mediaPlayer.getVersionHAS();
            };

            /**
             * get the full version (with git tag, only at build)
             * @access public
             * @memberof OrangeHasPlayer#
             * @return full hasplayer version
             */
            this.getVersionFull = function () {
                _isPlayerInitialized();
                return mediaPlayer.getVersionFull();
            };

            /**
             * @access public
             * @memberof OrangeHasPlayer#
             * @return date when the hasplayer has been built.
             */
            this.getBuildDate = function() {
                _isPlayerInitialized();
                return mediaPlayer.getBuildDate();
            };

            /**
             * get metrics for stream type
             * @access public
             * @memberof OrangeHasPlayer#
             * @param  type - stream type, video or audio.
             * @return metrics array for the selected type
             */
            this.getMetricsFor = function(type){
                _isPlayerInitialized();
                return mediaPlayer.getMetricsFor(type);
            };

            /**
             * get metrics extension reference
             * @access public
             * @memberof OrangeHasPlayer#
             * @return metrics extension reference
             */
            this.getMetricsExt = function(){
                _isPlayerInitialized();
                return mediaPlayer.getMetricsExt();
            };

            /**
             * get current quality for a stream
             * @access public
             * @memberof OrangeHasPlayer#
             * @param  type - stream type, video or audio.
             * @return current quality for the selected type.
             */
            this.getQualityFor = function (type) {
                _isPlayerInitialized();
                return mediaPlayer.getQualityFor(type);
            };

            /**
             * [hasMediaSourceExtension description]
             * @return {Boolean} [description]
             */
            this.hasMediaSourceExtension = function() {
                _isPlayerInitialized();
                return mediaPlayer.hasMediaSourceExtension();
            };

            /**
             * [hasMediaKeysExtension description]
             * @return {Boolean} [description]
             */
            this.hasMediaKeysExtension = function() {
                _isPlayerInitialized();
                return mediaPlayer.hasMediaKeysExtension();
            };

            /**
             * [getMute description]
             * @return {[type]} [description]
             */
            this.getMute = function () {
                _isPlayerInitialized();
                return video.muted;
            };

            /**
             * [setMute description]
             * @param {[type]} state [description]
             */
            this.setMute = function (state) {
                _isPlayerInitialized();
                if (typeof state !== 'boolean') {
                    throw new Error('OrangeHasPlayer.setMute(): Invalid Arguments');
                }
                video.muted = state;
            };

            /**
             * [setVolume description]
             * @param {[type]} volume [description]
             */
            this.setVolume = function (volume) {
                _isPlayerInitialized();
                if ((typeof volume !== 'number')|| (volume < 0 && volume > 1)) {
                    throw new Error('OrangeHasPlayer.setVolume(): Invalid Arguments');
                }   

                video.volume = volume;
            };

            /**
             * [getVolume description]
             * @return {[type]} [description]
             */
            this.getVolume = function(){
                _isPlayerInitialized();
                return video.volume;
            };

            /**
             * [isLive description]
             * @return {Boolean} [description]
             */
            this.isLive = function(){
                _isPlayerInitialized();
                return  video.duration !== Number.POSITIVE_INFINITY? false : true;
            };
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
        } else if (typeof exports !== "undefined" && exports !== null) {
           if (exports.OrangeHasPlayer == null) {
               exports.OrangeHasPlayer = OrangeHasPlayer;
           }
        }

}(this));