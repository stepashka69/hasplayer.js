// Mp4 box-level manipulation library
// (C) 2013 Orange

var mp4lib = (function() {
    var mp4lib = {
        boxes:{},
        fieldProcessors:{},
        fields:{},

        // In debug mode, source data buffer is kept for each of deserialized box so any 
        // structural deserialization problems can be traced by serializing each box
        // and comparing the resulting buffer with the source buffer.
        // This greatly increases memory consumption, so it is turned off by default.
        debug:false,

        // A handler function may be hooked up to display warnings.
        // A warning is typically non-critical issue, like unknown box in data buffer.
        warningHandler:function(message){}
    };

    var boxPrototypes = {};
    var uuidToBoxTypes = {};
    var boxTypesToUUID = {};

    /**
    register new box types to be used by library
    */
    mp4lib.registerBoxType = function( boxPrototype ) {
        boxPrototypes[ boxPrototype.prototype.boxtype ] = boxPrototype;
        if (boxPrototype.prototype.uuid) {
            var uuidString = JSON.stringify(boxPrototype.prototype.uuid);
            uuidToBoxTypes[uuidString] = boxPrototype.prototype.boxtype;
            boxTypesToUUID[boxPrototype.prototype.boxtype] = uuidString;
        }
    };
        
    /**
    create empty box object
    TO DO : improve factory, not final version!
    */
    mp4lib.createBox = function( boxtype, uuid ) {
        switch (boxtype) {
            case "moov" :
                return new mp4lib.boxes.MovieBox();
            case "moof" :
                return new mp4lib.boxes.MovieFragmentBox();
            case "ftyp" :
                return new mp4lib.boxes.FileTypeBox();
            case "mfhd" :
                return new mp4lib.boxes.MovieFragmentHeaderBox();
            case "mfra" :
                return new mp4lib.boxes.MovieFragmentRandomAccessBox();
            case "udta" :
                return new mp4lib.boxes.UserDataBox();
            case "trak" :
                return new mp4lib.boxes.TrackBox();
            case "edts" :
                return new mp4lib.boxes.EditBox();
            case "mdia" :
                return new mp4lib.boxes.MediaBox();
            case "minf" :
                return new mp4lib.boxes.MediaInformationBox();
            case "dinf" :
                return new mp4lib.boxes.DataInformationBox();
            case "stbl" :
                return new mp4lib.boxes.SampleTableBox();
            case "mvex" :
                return new mp4lib.boxes.MovieExtendsBox();
            case "traf" :
                return new mp4lib.boxes.TrackFragmentBox();
            case "meta" :
                return new mp4lib.boxes.MetaBox();
            case "mvhd" :
                return new mp4lib.boxes.MovieHeaderBox();
            case "mdat" :
                return new mp4lib.boxes.MediaDataBox();
            case "free" :
                return new mp4lib.boxes.FreeSpaceBox();
            case "sidx" :
                return new mp4lib.boxes.SegmentIndexBox();
            case "tkhd" :
                return new mp4lib.boxes.TrackHeaderBox();
            case "mdhd" :
                return new mp4lib.boxes.MediaHeaderBox();
            case "mehd" :
                return new mp4lib.boxes.MovieExtendsHeaderBox();
            case "hdlr" :
                return new mp4lib.boxes.HandlerBox();
            case "stts" :
                return new mp4lib.boxes.TimeToSampleBox();
            case "sidx" :
                return new mp4lib.boxes.SegmentIndexBox();
            case "stsc" :
                return new mp4lib.boxes.SampleToChunkBox();
            case "stco" :
                return new mp4lib.boxes.ChunkOffsetBox();
            case "trex" :
                return new mp4lib.boxes.TrackExtendsBox();
            case "vmhd" :
                return new mp4lib.boxes.VideoMediaHeaderBox();
            case "smhd" :
                return new mp4lib.boxes.SoundMediaHeaderBox();
            case "dref" :
                return new mp4lib.boxes.DataReferenceBox();
            case "url " :
                return new mp4lib.boxes.DataEntryUrlBox();
            case "urn " :
                return new mp4lib.boxes.DataEntryUrnBox();
            case "tfhd" :
                return new mp4lib.boxes.TrackFragmentHeaderBox();
            case "tfdt" :
                return new mp4lib.boxes.TrackFragmentBaseMediaDecodeTimeBox();
            case "trun" :
                return new mp4lib.boxes.TrackFragmentRunBox();
            case "stts" :
                return new mp4lib.boxes.TimeToSampleBox();
            case "stsd" :
                return new mp4lib.boxes.SampleDescriptionBox();
            case "sdtp" :
                return new mp4lib.boxes.SampleDependencyTableBox();
            case "avc1" :
                return new mp4lib.boxes.AVC1VisualSampleEntryBox();
            case "encv" :
                return new mp4lib.boxes.EncryptedVideoBox();
            case "avcC" :
                return new mp4lib.boxes.AVCConfigurationBox();
            case "pasp" :
                return new mp4lib.boxes.PixelAspectRatioBox();
            case "mp4a" :
                return new mp4lib.boxes.MP4AudioSampleEntryBox();
            case "enca" :
                return new mp4lib.boxes.EncryptedAudioBox();
            case "esds" :
                return new mp4lib.boxes.ESDBox();
            case "stsz" :
                return new mp4lib.boxes.SampleSizeBox();
            case "pssh" :
                return new mp4lib.boxes.ProtectionSystemSpecificHeaderBox();
            case "saiz" :
                return new mp4lib.boxes.SampleAuxiliaryInformationSizesBox();
            case "saio" :
                return new mp4lib.boxes.SampleAuxiliaryInformationOffsetsBox();
            case "sinf" :
                return new mp4lib.boxes.ProtectionSchemeInformationBox();
            case "schi" :
                return new mp4lib.boxes.SchemeInformationBox();
            case "tenc" :
                return new mp4lib.boxes.TrackEncryptionBox();
            case "schm" :
                return new mp4lib.boxes.SchemeTypeBox();
            case "elst" :
                return new mp4lib.boxes.EditListBox();
            case "hmhd" :
                return new mp4lib.boxes.HintMediaHeaderBox();
            case "nmhd" :
                return new mp4lib.boxes.NullMediaHeaderBox();
            case "ctts" :
                return new mp4lib.boxes.CompositionOffsetBox();
            case "cslg" :
                return new mp4lib.boxes.CompositionToDecodeBox();
            case "stss" :
                return new mp4lib.boxes.SyncSampleBox();
            case "tref" :
                return new mp4lib.boxes.TrackReferenceBox();
            case "frma" :
                return new mp4lib.boxes.OriginalFormatBox();
            case "uuid" :
                switch (uuid) {
                    case JSON.stringify(mp4lib.boxes.TfxdBox.prototype.uuid) :
                        return new mp4lib.boxes.TfxdBox();
                    case JSON.stringify(mp4lib.boxes.TfrfBox.prototype.uuid) :
                        return new mp4lib.boxes.TfrfBox();
                    case JSON.stringify(mp4lib.boxes.PiffProtectionSystemSpecificHeaderBox.prototype.uuid) :
                        return new mp4lib.boxes.PiffProtectionSystemSpecificHeaderBox();
                    case JSON.stringify(mp4lib.boxes.PiffTrackEncryptionBox.prototype.uuid) :
                        return new mp4lib.boxes.PiffTrackEncryptionBox();
                    case JSON.stringify(mp4lib.boxes.PiffSampleEncryptionBox.prototype.uuid) :
                        return new mp4lib.boxes.PiffSampleEncryptionBox();
                }
                break;
            default :
                debugger;
                mp4lib.warningHandler('Unknown boxtype:'+boxtype+', parsing as UnknownBox');
                return new mp4lib.boxes.UnknownBox();
        }


        /*var box;
        if (boxtype in boxPrototypes) {
            box = new boxPrototypes[boxtype]();
        } else  {
            mp4lib.warningHandler('Unknown boxtype:'+boxtype+', parsing as UnknownBox');
            box = new mp4lib.boxes.UnknownBox();
        }
        return box;*/
    };


    /*mp4lib.findBoxtypeByUUID = function( uuid ) {
        return uuidToBoxTypes[uuid];
    };

    mp4lib.findUUIDByBoxtype = function( boxtype ) {
        return boxTypesToUUID[boxtype];
    };*/

    
    /**
    deserialize binary data (uint8array) into mp4lib.File object
    */
    mp4lib.deserialize = function(uint8array) {
        var f = new mp4lib.boxes.File();
        var p = new mp4lib.fieldProcessors.DeserializationBoxFieldsProcessor(f, uint8array, 0, uint8array.length);
        f._processFields(p);
        return f;
    };


    /**
    serialize box (or mp4lib.File) into binary data (uint8array)
    */
    mp4lib.serialize = function(f) {
        var lp = new mp4lib.fieldProcessors.LengthCounterBoxFieldsProcessor(f);
        f._processFields(lp);
        var uint8array = new Uint8Array(lp.res);
        var sp = new mp4lib.fieldProcessors.SerializationBoxFieldsProcessor(f, uint8array, 0);
        f._processFields(sp);
        return uint8array;
    };

    /**
    exception thrown when binary data is malformed
    it is thrown typically during deserialization
    */
    mp4lib.ParseException = function(message) {
        this.message = message;
        this.name = "ParseException";
    };

    /**
    exception thrown when box objects contains invalid data, 
    ex. flag field is are not coherent with fields etc.
    it is thrown typically during object manipulation or serialization
    */
    mp4lib.DataIntegrityException = function(message) {
        this.message = message;
        this.name = "DataIntegrityException";
    };

    return mp4lib;
})();

// This module is intended to work both on node.js and inside browser.
// Since these environments differ in a way modules are stored/accessed,
// we need to export the module in the environment-dependant way

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = mp4lib; // node.js
else
    window.mp4lib = mp4lib;  // browser

