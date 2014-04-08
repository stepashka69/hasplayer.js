if (typeof require !== 'undefined') {
    // node.js adaptation
    var mp4lib = require('./mp4lib.js');
}

// ---------- File (treated similarly to box in terms of processing) ----------

mp4lib.boxes.File = function(){
    this.boxes = [];
};

mp4lib.boxes.File.prototype.getBoxByType = function(boxType) {
    for(var i = 0; i < this.boxes.length; i++) {
        if(this.boxes[i].boxtype === boxType) {
            return this.boxes[i];
        }
    }
    return null;
};

mp4lib.boxes.File.prototype.getLength = function() {
    var length=0, i=0, lengthTemp=0;
    for (i = 0; i < this.boxes.length;i++) {
        lengthTemp = this.boxes[i].getLength();
        //set size in the box container => remove it!!!!
        this.boxes[i].size = lengthTemp;
        length += lengthTemp;
    }
    return length;
};

mp4lib.boxes.File.prototype.write = function(data){
    var pos = 0;
    for (var i=0;i<this.boxes.length;i++) {
       var box = this.boxes[i];
       box.write(data,pos);
       pos += box.size;
    }
};

mp4lib.boxes.File.prototype.read = function(data) {
    var size = 0, boxtype = null, uuidFieldPos = 0, uuid = null, pos = 0, end = data.length;

    while (pos<end) {
        // Read box size        
        size = mp4lib.fields.FIELD_UINT32.read(data, pos);

        // Read boxtype
        boxtype = mp4lib.fields.readString(data, pos+4, 4);

        // Extented type?
        if (boxtype == "uuid") {
            uuidFieldPos = (size == 1)?16:8;
            uuid = new mp4lib.fields.ArrayField(mp4lib.fields.FIELD_INT8, 16).read(data, pos + uuidFieldPos, pos + uuidFieldPos + 16);
            uuid = JSON.stringify(uuid);
        }

        var box = mp4lib.createBox( boxtype,size, uuid);
         if (boxtype === "uuid") {
            box.read(data,pos+mp4lib.fields.FIELD_INT8.getLength()*16+8,pos+size);
        }else {
            box.read(data,pos+8,pos+size);
        }
        
        // in debug mode, sourcebuffer is copied to each box,
        // so any invalid deserializations may be found by comparing
        // source buffer with serialized box
        if (mp4lib.debug)
            box.__sourceBuffer = data.subarray(pos,pos+box.size);

        this.boxes.push(box);
        pos+=box.size;

        if (box.size===0) {
            throw new mp4lib.ParseException('Zero size of box '+box.boxtype+
                                            ', parsing stopped to avoid infinite loop');
        }
    }
};

/**
find child position
*/
mp4lib.boxes.File.prototype.getBoxPositionByType = function(boxType) {
    var position = 0, i=0;
    
    for(i = 0; i < this.boxes.length; i++) {
        if(this.boxes[i].boxtype === boxType) {
            return position;
        } else {
            position += this.boxes[i].size;
        }
    }
    return null;
};

// ---------- Generic Box -------------------------------
mp4lib.boxes.Box = function(boxType,size,uuid,largesize){
    this.size = size || null;
    this.boxtype = boxType;
    //large size management to do...
    if (this.size === 1 && largesize) {
        this.largesize = largesize;
    }

    if (uuid) {
        this.extended_type = uuid;
    }

    this.localPos = 0;
    this.localEnd = 0;
};

mp4lib.boxes.Box.prototype.write = function(data,pos){
    this.localPos = pos;
  
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.size);
    //if extended_type is not defined, boxtype must have this.boxtype value
    if (!this.extended_type) {
        this._writeData(data,mp4lib.fields.FIELD_ID,this.boxtype);
    }else{//if extended_type is defined, boxtype must have 'uuid' value
        this._writeData(data,mp4lib.fields.FIELD_ID,'uuid');
    }
    
    if (this.size === 1 ){
        this._writeData(data,mp4lib.fields.FIELD_INT64,this.largesize);
    }

    if (this.extended_type) {
        for(var i=0;i<16;i++) {
            this._writeData(data,mp4lib.fields.FIELD_INT8,this.extended_type[i]);
        }
    }
};

mp4lib.boxes.Box.prototype.getBoxByType = function(boxType) {
    var i = 0;
    if (this.hasOwnProperty('boxes')){
        for(i = 0; i < this.boxes.length; i++) {
            if(this.boxes[i].boxtype === boxType) {
                return this.boxes[i];
            }
        }
    }
    return null;
};


mp4lib.boxes.Box.prototype.getBoxesByType = function(boxType) {
    var resu = [], i = 0;
    if (this.hasOwnProperty('boxes')){
        for(i = 0; i < this.boxes.length; i++) {
            if(this.boxes[i].boxtype === boxType) {
                resu.push(this.boxes[i]);
            }
        }
    }
    return resu;
};

/**
remove child from a box
*/
mp4lib.boxes.Box.prototype.removeBoxByType = function(boxType) {
    if (this.hasOwnProperty('boxes')){
        for(var i = 0; i < this.boxes.length; i++) {
            if(this.boxes[i].boxtype === boxType) {
                this.boxes.splice(i, 1);
            }
        }
    }
    else{
         mp4lib.warningHandler(''+this.boxtype+'does not have '+boxType+' box, impossible to remove it');
    }
};

/**
find child position
*/
mp4lib.boxes.Box.prototype.getBoxPositionByType = function(boxType) {
    var position = 0, i=0;
    if (this.hasOwnProperty('boxes')){
        for(i = 0; i < this.boxes.length; i++) {
            if(this.boxes[i].boxtype === boxType) {
                return position;
            } else {
                position += this.boxes[i].size;
            }
        }
    }
    return null;
};

mp4lib.boxes.Box.prototype.getLength = function () {
    var size_origin = mp4lib.fields.FIELD_UINT32.getLength() + mp4lib.fields.FIELD_ID.getLength(); //size and boxtype length
    
    if (this.size ===1) {
        size_origin += mp4lib.fields.FIELD_INT64.getLength(); //add large_size length
    }

    if (this.extended_type) {
        size_origin += mp4lib.fields.FIELD_INT8.getLength() * 16; //add extended_type length.
    }

    return size_origin;
};

mp4lib.boxes.Box.prototype._readData = function (data,dataType) {
    var resu = dataType.read(data, this.localPos,this.localEnd);
    this.localPos += dataType.getLength(resu);
    return resu;
};

mp4lib.boxes.Box.prototype._writeData = function (data,dataType,dataField) {
    if (dataField === undefined || dataField === null) {
        throw new mp4lib.ParseException('a field to write is null or undefined for box : '+this.boxtype);
    }
    else {
        dataType.write(data,this.localPos,dataField);
        this.localPos += dataType.getLength(dataField);
    }
};

mp4lib.boxes.Box.prototype._writeArrayData = function (data, dataArrayType,array) {
    if (array === undefined || array === null) {
        throw new mp4lib.ParseException('an array to write is null or undefined for box : '+this.boxtype);
    }

    for (var i = 0; i < array.length; i++) {
        this._writeData(data,dataArrayType,array[i]);
    }
};

mp4lib.boxes.Box.prototype._readArrayData = function (data, dataArrayType) {
    var array = [];
    var dataArrayTypeLength = dataArrayType.getLength();
    var size = (this.localEnd-this.localPos)/dataArrayTypeLength;

    for(var i=0;i<size;i++) {
        array.push(dataArrayType.read(data,this.localPos));
        this.localPos += dataArrayTypeLength;
    }
    return array;
};

mp4lib.boxes.Box.prototype._readArrayFieldData = function(data,dataArrayType,arraySize) {
    var innerFieldLength=-1;
    var array = [];

    for (var i=0;i<arraySize;i++) {
        
        array.push(dataArrayType.read(data,this.localPos));

        if (innerFieldLength === -1)
            innerFieldLength = dataArrayType.getLength(array[i]);
            // it may happen that the size of field depends on the box flags, 
            // we need to count is having box and first structure constructed

        this.localPos+=innerFieldLength;
    }
    return array;
};

// ---------- Abstract Container Box -------------------------------
mp4lib.boxes.ContainerBox = function(boxType, size){
    mp4lib.boxes.Box.call(this,boxType,size);
    this.boxes = [];
 };

mp4lib.boxes.ContainerBox.prototype = Object.create(mp4lib.boxes.Box.prototype);
mp4lib.boxes.ContainerBox.prototype.constructor = mp4lib.boxes.ContainerBox;

mp4lib.boxes.ContainerBox.prototype.getLength = function () {
    var i=0, lengthTemp=0, size_origin = mp4lib.boxes.Box.prototype.getLength.call(this);
    for (i = 0; i < this.boxes.length;i++) {
        lengthTemp = this.boxes[i].getLength();
        //set size in the box container => remove it!!!!
        this.boxes[i].size = lengthTemp;
        size_origin += lengthTemp;
    }
    return size_origin;
};

mp4lib.boxes.ContainerBox.prototype.write = function(data,pos){
    mp4lib.boxes.Box.prototype.write.call(this,data,pos);

    for (var i=0;i<this.boxes.length;i++) {
       var box = this.boxes[i];
       box.write(data,this.localPos);
       this.localPos += box.size;
    }
};

mp4lib.boxes.ContainerBox.prototype.read = function (data,pos,end) {
    var size = 0, uuidFieldPos = 0, uuid = null, boxtype;

    while (pos<end) {
        // Read box size        
        size = mp4lib.fields.FIELD_UINT32.read(data, pos);

        // Read boxtype
        boxtype = mp4lib.fields.readString(data, pos+4, 4);

        // Extented type?
        if (boxtype === "uuid") {
            uuidFieldPos = (size == 1)?16:8;
            uuid = new mp4lib.fields.ArrayField(mp4lib.fields.FIELD_INT8, 16).read(data, pos + uuidFieldPos, pos + uuidFieldPos + 16);
            uuid = JSON.stringify(uuid);
        }

        var box = mp4lib.createBox( boxtype, size, uuid);
        if (boxtype === "uuid") {
            box.read(data,pos+mp4lib.fields.FIELD_INT8.getLength()*16+8,pos+size);
        }else {
            box.read(data,pos+8,pos+size);
        }
        
        // in debug mode, sourcebuffer is copied to each box,
        // so any invalid deserializations may be found by comparing
        // source buffer with serialized box
        if (mp4lib.debug)
            box.__sourceBuffer = data.subarray(pos,pos+box.size);

        this.boxes.push(box);
        pos+=box.size;

        if (box.size === 0){
            throw new mp4lib.ParseException('Zero size of box '+box.boxtype+
                                            ', parsing stopped to avoid infinite loop');
        }
    }
};

// ---------- Full Box -------------------------------
mp4lib.boxes.FullBox = function(boxType,size,uuid){
    mp4lib.boxes.Box.call(this,boxType,size,uuid);
    this.version = null;
    this.flags = null;
 };

mp4lib.boxes.FullBox.prototype = Object.create(mp4lib.boxes.Box.prototype);
mp4lib.boxes.FullBox.prototype.constructor = mp4lib.boxes.FullBox;

mp4lib.boxes.FullBox.prototype.read = function (data,pos,end) {
    this.localPos = pos;
    this.localEnd = end;
    this.version = this._readData(data,mp4lib.fields.FIELD_INT8);
    this.flags = this._readData(data,mp4lib.fields.FIELD_BIT24);
};

mp4lib.boxes.FullBox.prototype.write = function (data,pos) {
    mp4lib.boxes.Box.prototype.write.call(this,data,pos);

    this._writeData(data,mp4lib.fields.FIELD_INT8,this.version);
    this._writeData(data,mp4lib.fields.FIELD_BIT24,this.flags);
};

mp4lib.boxes.FullBox.prototype.getFullBoxAttributesLength = function () {
    return mp4lib.fields.FIELD_INT8.getLength() + mp4lib.fields.FIELD_BIT24.getLength(); //version and flags size
};

mp4lib.boxes.FullBox.prototype.getLength = function () {
    return mp4lib.boxes.Box.prototype.getLength.call(this) + mp4lib.boxes.FullBox.prototype.getFullBoxAttributesLength.call(this);
};

// ---------- Abstract Container FullBox -------------------------------
mp4lib.boxes.ContainerFullBox = function(boxType,size){
    mp4lib.boxes.FullBox.call(this,boxType,size);
    this.boxes = [];
 };

mp4lib.boxes.ContainerFullBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.ContainerFullBox.prototype.constructor = mp4lib.boxes.ContainerFullBox;

mp4lib.boxes.ContainerFullBox.prototype.getLength = function (isEntryCount) {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this), i=0, lengthTemp=0;
        
    if (isEntryCount) {
        size_origin += mp4lib.fields.FIELD_UINT32.getLength();
    }

    for (i = 0; i < this.boxes.length;i++) {
        lengthTemp = this.boxes[i].getLength();
        //set size in the box container => remove it!!!!
        this.boxes[i].size = lengthTemp;
        size_origin += lengthTemp;
    }
    return size_origin;
};

mp4lib.boxes.ContainerFullBox.prototype.read = function (data,pos,end,isEntryCount) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    var size = 0, uuidFieldPos = 0, uuid = null, boxtype;

    if (isEntryCount) {
        this.entry_count = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }

    while (this.localPos<this.localEnd) {
        // Read box size        
        size = mp4lib.fields.FIELD_UINT32.read(data, this.localPos);

        // Read boxtype
        boxtype = mp4lib.fields.readString(data, this.localPos+4, 4);

        // Extented type?
        if (boxtype == "uuid") {
            uuidFieldPos = (size == 1)?16:8;
            uuid = new mp4lib.fields.ArrayField(mp4lib.fields.FIELD_INT8, 16).read(data, this.localPos + uuidFieldPos, this.localPos + uuidFieldPos + 16);
            uuid = JSON.stringify(uuid);
        }

        var box = mp4lib.createBox( boxtype, size, uuid);
        if (boxtype === "uuid") {
            box.read(data,this.localPos+mp4lib.fields.FIELD_INT8.getLength()*16+8,this.localPos+size);
        }else {
            box.read(data,this.localPos+8,this.localPos+size);
        }
        
        // in debug mode, sourcebuffer is copied to each box,
        // so any invalid deserializations may be found by comparing
        // source buffer with serialized box
        if (mp4lib.debug)
            box.__sourceBuffer = data.subarray(this.localPos,this.localPos+box.size);

        this.boxes.push(box);
        this.localPos+=box.size;

        if (box.size === 0){
            throw new mp4lib.ParseException('Zero size of box '+box.boxtype+
                                            ', parsing stopped to avoid infinite loop');
        }
    }
};

mp4lib.boxes.ContainerFullBox.prototype.write = function (data,pos,isEntryCount) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    if (isEntryCount === true) {
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry_count);
    }

    for (var i=0;i<this.boxes.length;i++) {
       var box = this.boxes[i];
       box.write(data,this.localPos);
       this.localPos += box.size;
    }
};

// ----------- Unknown Box -----------------------------

mp4lib.boxes.UnknownBox =  function(boxType,size) {
    mp4lib.boxes.Box.call(this,boxType,size);
};

mp4lib.boxes.UnknownBox.prototype = Object.create(mp4lib.boxes.Box.prototype);
mp4lib.boxes.UnknownBox.prototype.constructor = mp4lib.boxes.UnknownBox;

mp4lib.boxes.UnknownBox.prototype.read = function (data,pos,end) {
    this.localPos = pos;
    this.localEnd = end;
    this.unrecognized_data =  this._readData(data,mp4lib.fields.FIELD_BOX_FILLING_DATA);
};

mp4lib.boxes.UnknownBox.prototype.write = function (data,pos) {
    mp4lib.boxes.Box.prototype.write.call(this,data,pos);

    this._writeData(data,mp4lib.fields.FIELD_BOX_FILLING_DATA,this.unrecognized_data);
};

// --------------------------- ftyp ----------------------------------

mp4lib.boxes.FileTypeBox = function(size) {
    mp4lib.boxes.Box.call(this,'ftyp',size);
};

mp4lib.boxes.FileTypeBox.prototype = Object.create(mp4lib.boxes.Box.prototype);
mp4lib.boxes.FileTypeBox.prototype.constructor = mp4lib.boxes.FileTypeBox;

mp4lib.boxes.FileTypeBox.prototype.getLength = function(){
    var size_origin = mp4lib.boxes.Box.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_INT32.getLength() * 2 + mp4lib.fields.FIELD_INT32.getLength() * this.compatible_brands.length;
    return size_origin;
};

mp4lib.boxes.FileTypeBox.prototype.read = function (data,pos,end) {
    this.localPos = pos;
    this.localEnd = end;

    this.major_brand = this._readData(data,mp4lib.fields.FIELD_INT32);
    this.minor_brand = this._readData(data,mp4lib.fields.FIELD_INT32);
    
    this.compatible_brands = this._readArrayData(data,mp4lib.fields.FIELD_INT32);
};

mp4lib.boxes.FileTypeBox.prototype.write = function (data,pos) {
    mp4lib.boxes.Box.prototype.write.call(this,data,pos);

    this._writeData(data,mp4lib.fields.FIELD_INT32,this.major_brand);
    this._writeData(data,mp4lib.fields.FIELD_INT32,this.minor_brand);

    this._writeArrayData(data, mp4lib.fields.FIELD_INT32, this.compatible_brands);
};
// --------------------------- moov ----------------------------------

mp4lib.boxes.MovieBox = function(size) {
    mp4lib.boxes.ContainerBox.call(this,'moov',size);
};

mp4lib.boxes.MovieBox.prototype = Object.create(mp4lib.boxes.ContainerBox.prototype);
mp4lib.boxes.MovieBox.prototype.constructor = mp4lib.boxes.MovieBox;

// --------------------------- moof ----------------------------------
mp4lib.boxes.MovieFragmentBox = function(size) {
    mp4lib.boxes.ContainerBox.call(this,'moof',size);
};

mp4lib.boxes.MovieFragmentBox.prototype = Object.create(mp4lib.boxes.ContainerBox.prototype);
mp4lib.boxes.MovieFragmentBox.prototype.constructor = mp4lib.boxes.MovieFragmentBox;

// --------------------------- mfra ----------------------------------
mp4lib.boxes.MovieFragmentRandomAccessBox = function(size) {
    mp4lib.boxes.ContainerBox.call(this,'mfra',size);
};

mp4lib.boxes.MovieFragmentRandomAccessBox.prototype = Object.create(mp4lib.boxes.ContainerBox.prototype);
mp4lib.boxes.MovieFragmentRandomAccessBox.prototype.constructor = mp4lib.boxes.MovieFragmentRandomAccessBox;

// --------------------------- udta ----------------------------------
mp4lib.boxes.UserDataBox = function(size) {
    mp4lib.boxes.ContainerBox.call(this,'udta',size);
};

mp4lib.boxes.UserDataBox.prototype = Object.create(mp4lib.boxes.ContainerBox.prototype);
mp4lib.boxes.UserDataBox.prototype.constructor = mp4lib.boxes.UserDataBox;

// --------------------------- trak ----------------------------------
mp4lib.boxes.TrackBox = function(size) {
    mp4lib.boxes.ContainerBox.call(this,'trak',size);
};

mp4lib.boxes.TrackBox.prototype = Object.create(mp4lib.boxes.ContainerBox.prototype);
mp4lib.boxes.TrackBox.prototype.constructor = mp4lib.boxes.TrackBox;

// --------------------------- edts ----------------------------------
mp4lib.boxes.EditBox = function(size) {
    mp4lib.boxes.ContainerBox.call(this,'edts',size);
};

mp4lib.boxes.EditBox.prototype = Object.create(mp4lib.boxes.ContainerBox.prototype);
mp4lib.boxes.EditBox.prototype.constructor = mp4lib.boxes.EditBox;

// --------------------------- mdia ----------------------------------
mp4lib.boxes.MediaBox = function(size) {
    mp4lib.boxes.ContainerBox.call(this,'mdia',size);
};

mp4lib.boxes.MediaBox.prototype = Object.create(mp4lib.boxes.ContainerBox.prototype);
mp4lib.boxes.MediaBox.prototype.constructor = mp4lib.boxes.MediaBox;

// --------------------------- minf ----------------------------------
mp4lib.boxes.MediaInformationBox = function(size) {
    mp4lib.boxes.ContainerBox.call(this,'minf',size);
};

mp4lib.boxes.MediaInformationBox.prototype = Object.create(mp4lib.boxes.ContainerBox.prototype);
mp4lib.boxes.MediaInformationBox.prototype.constructor = mp4lib.boxes.MediaInformationBox;

// --------------------------- dinf ----------------------------------
mp4lib.boxes.DataInformationBox=function(size) {
    mp4lib.boxes.ContainerBox.call(this,'dinf',size);
};

mp4lib.boxes.DataInformationBox.prototype = Object.create(mp4lib.boxes.ContainerBox.prototype);
mp4lib.boxes.DataInformationBox.prototype.constructor = mp4lib.boxes.DataInformationBox;

// --------------------------- stbl ----------------------------------
mp4lib.boxes.SampleTableBox = function(size) {
    mp4lib.boxes.ContainerBox.call(this,'stbl',size);
};

mp4lib.boxes.SampleTableBox.prototype = Object.create(mp4lib.boxes.ContainerBox.prototype);
mp4lib.boxes.SampleTableBox.prototype.constructor = mp4lib.boxes.SampleTableBox;

// --------------------------- mvex ----------------------------------
mp4lib.boxes.MovieExtendsBox=function(size) {
    mp4lib.boxes.ContainerBox.call(this,'mvex',size);
};

mp4lib.boxes.MovieExtendsBox.prototype = Object.create(mp4lib.boxes.ContainerBox.prototype);
mp4lib.boxes.MovieExtendsBox.prototype.constructor = mp4lib.boxes.MovieExtendsBox;

// --------------------------- traf ----------------------------------
mp4lib.boxes.TrackFragmentBox=function(size) {
    mp4lib.boxes.ContainerBox.call(this,'traf',size);
};

mp4lib.boxes.TrackFragmentBox.prototype = Object.create(mp4lib.boxes.ContainerBox.prototype);
mp4lib.boxes.TrackFragmentBox.prototype.constructor = mp4lib.boxes.TrackFragmentBox;

// --------------------------- meta -----------------------------
mp4lib.boxes.MetaBox=function(size) {
    mp4lib.boxes.ContainerFullBox.call(this,'meta',size);
};

mp4lib.boxes.MetaBox.prototype = Object.create(mp4lib.boxes.ContainerFullBox.prototype);
mp4lib.boxes.MetaBox.prototype.constructor = mp4lib.boxes.MetaBox;

mp4lib.boxes.MetaBox.prototype.getLength = function () {
    return mp4lib.boxes.ContainerFullBox.prototype.getLength.call(this,false);
};

mp4lib.boxes.MetaBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.ContainerFullBox.prototype.read.call(this,data,pos,end,false);
};

mp4lib.boxes.MetaBox.prototype.write = function (data,pos) {
    mp4lib.boxes.ContainerFullBox.prototype.write.call(this,data,pos,false);
};

// --------------------------- mvhd ----------------------------------
mp4lib.boxes.MovieHeaderBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'mvhd',size);
};

mp4lib.boxes.MovieHeaderBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.MovieHeaderBox.prototype.constructor = mp4lib.boxes.MovieHeaderBox;

mp4lib.boxes.MovieHeaderBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_INT32.getLength() /*rate size*/+ mp4lib.fields.FIELD_INT16.getLength() * 2 /*volume size and reserved size*/;
    size_origin += mp4lib.fields.FIELD_INT32.getLength() * 2 /*reserved_2 size*/+ mp4lib.fields.FIELD_INT32.getLength() * 9 /*matrix size*/;
    size_origin += mp4lib.fields.FIELD_BIT32.getLength() * 6 /*pre_defined size*/ + mp4lib.fields.FIELD_UINT32.getLength()/*next_track_ID size*/;
    if (this.version === 1) {
        size_origin += mp4lib.fields.FIELD_UINT64.getLength() * 3 + mp4lib.fields.FIELD_UINT32.getLength();
    }
    else {
        size_origin += mp4lib.fields.FIELD_UINT32.getLength() * 4;
    }
    return size_origin;
};

mp4lib.boxes.MovieHeaderBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    if (this.version === 1) {
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.creation_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.modification_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.timescale);
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.duration);
    } else {
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.creation_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.modification_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.timescale);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.duration);
    }

    this._writeData(data,mp4lib.fields.FIELD_INT32,this.rate);
    this._writeData(data,mp4lib.fields.FIELD_INT16,this.volume);
    this._writeData(data,mp4lib.fields.FIELD_INT16,this.reserved);

    this._writeArrayData(data, mp4lib.fields.FIELD_INT32, this.reserved_2);
    this._writeArrayData(data, mp4lib.fields.FIELD_INT32, this.matrix);
    this._writeArrayData(data, mp4lib.fields.FIELD_BIT32, this.pre_defined);
        
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.next_track_ID);
};

mp4lib.boxes.MovieHeaderBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);

    if (this.version==1) {
        this.creation_time = this._readData(data,mp4lib.fields.FIELD_UINT64);
        this.modification_time = this._readData(data,mp4lib.fields.FIELD_UINT64);
        this.timescale = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.duration = this._readData(data,mp4lib.fields.FIELD_UINT64);
    } else {
        this.creation_time = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.modification_time = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.timescale = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.duration = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }

    this.rate = this._readData(data,mp4lib.fields.FIELD_INT32);
    this.volume = this._readData(data,mp4lib.fields.FIELD_INT16);
    this.reserved = this._readData(data,mp4lib.fields.FIELD_INT16);
    
    this.reserved_2 = this._readArrayFieldData(data,mp4lib.fields.FIELD_INT32,2);
    this.matrix = this._readArrayFieldData(data,mp4lib.fields.FIELD_INT32,9);
    this.pre_defined = this._readArrayFieldData(data,mp4lib.fields.FIELD_BIT32,6);

    this.next_track_ID = this._readData(data,mp4lib.fields.FIELD_UINT32);
};

// --------------------------- mdat ----------------------------------
mp4lib.boxes.MediaDataBox=function(size) {
    mp4lib.boxes.Box.call(this,'mdat',size);
};

mp4lib.boxes.MediaDataBox.prototype = Object.create(mp4lib.boxes.Box.prototype);
mp4lib.boxes.MediaDataBox.prototype.constructor = mp4lib.boxes.MediaDataBox;

mp4lib.boxes.MediaDataBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.Box.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_BOX_FILLING_DATA.getLength(this.data);
    return size_origin;
};

mp4lib.boxes.MediaDataBox.prototype.read = function (data,pos,end) {
    this.data = mp4lib.fields.FIELD_BOX_FILLING_DATA.read(data,pos,end);
};

mp4lib.boxes.MediaDataBox.prototype.write = function (data,pos) {
    mp4lib.boxes.Box.prototype.write.call(this,data,pos);

    this._writeData(data,mp4lib.fields.FIELD_BOX_FILLING_DATA,this.data);
};

// --------------------------- free ----------------------------------
mp4lib.boxes.FreeSpaceBox=function(size) {
    mp4lib.boxes.Box.call(this,'free',size);
};

mp4lib.boxes.FreeSpaceBox.prototype = Object.create(mp4lib.boxes.Box.prototype);
mp4lib.boxes.FreeSpaceBox.prototype.constructor = mp4lib.boxes.FreeSpaceBox;

mp4lib.boxes.FreeSpaceBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.Box.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_BOX_FILLING_DATA.getLength(this.data);
    return size_origin;
};

mp4lib.boxes.FreeSpaceBox.prototype.read = function (data,pos,end) {
    this.localPos = pos;
    this.localEnd = end;
    this.data =  this._readData(data,mp4lib.fields.FIELD_BOX_FILLING_DATA);
};

mp4lib.boxes.FreeSpaceBox.prototype.write = function (data,pos) {
    mp4lib.boxes.Box.prototype.write.call(this,data,pos);

    this._writeData(data,mp4lib.fields.FIELD_BOX_FILLING_DATA,this.data);
};

// --------------------------- sidx ----------------------------------
mp4lib.boxes.SegmentIndexBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'sidx',size);
};

mp4lib.boxes.SegmentIndexBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.SegmentIndexBox.prototype.constructor = mp4lib.boxes.SegmentIndexBox;

mp4lib.boxes.SegmentIndexBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT32.getLength() * 2;/* reference_ID and timescale size*/

    if (this.version === 1) {
        size_origin += mp4lib.fields.FIELD_UINT64.getLength() * 2;/* earliest_presentation_time and first_offset size*/
    } else {
        size_origin += mp4lib.fields.FIELD_UINT32.getLength() * 2;/* earliest_presentation_time and first_offset size*/
    }
    
    size_origin += mp4lib.fields.FIELD_UINT16.getLength();/* reserved size*/
    size_origin += mp4lib.fields.FIELD_UINT16.getLength();/* reference_count size*/

    size_origin += (mp4lib.fields.FIELD_UINT64.getLength()/* reference_info size*/ + mp4lib.fields.FIELD_UINT32.getLength()/* SAP size*/) * this.reference_count;

    return size_origin;
};


mp4lib.boxes.SegmentIndexBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);

    this.reference_ID = this._readData(data,mp4lib.fields.FIELD_UINT32);
    this.timescale = this._readData(data,mp4lib.fields.FIELD_UINT32);

    if (this.version === 1) {
        this.earliest_presentation_time = this._readData(data,mp4lib.fields.FIELD_UINT64);
        this.first_offset = this._readData(data,mp4lib.fields.FIELD_UINT64);
    } else {
        this.earliest_presentation_time = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.first_offset = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }
    this.reserved = this._readData(data,mp4lib.fields.FIELD_UINT16);

    this.reference_count = this._readData(data,mp4lib.fields.FIELD_UINT16);
    
    this.references = [];

    for (var i = 0; i < this.reference_count; i++){
        var struct = {};

        struct.reference_info = this._readData(data,mp4lib.fields.FIELD_UINT64);
        struct.SAP = this._readData(data,mp4lib.fields.FIELD_UINT32);

        this.references.push(struct);
    }
};

mp4lib.boxes.SegmentIndexBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.reference_ID);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.timescale);

    if (this.version === 1) {
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.earliest_presentation_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.first_offset);
    } else {
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.earliest_presentation_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.first_offset);
    }
    
    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.reserved);

    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.reference_count);
    
    for (var i = 0; i < this.reference_count; i++){
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.references[i].reference_info);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.references[i].SAP);
    }
};

// --------------------------- tkhd ----------------------------------
mp4lib.boxes.TrackHeaderBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'tkhd',size);
};

mp4lib.boxes.TrackHeaderBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.TrackHeaderBox.prototype.constructor = mp4lib.boxes.TrackHeaderBox;

mp4lib.boxes.TrackHeaderBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_INT16.getLength() * 4 + mp4lib.fields.FIELD_INT32.getLength() * 2 + mp4lib.fields.FIELD_UINT32.getLength()*2+mp4lib.fields.FIELD_INT32.getLength()*9;
    if (this.version == 1) {
        size_origin += mp4lib.fields.FIELD_UINT64.getLength() * 3+mp4lib.fields.FIELD_UINT32.getLength() * 2;
    }
    else {
        size_origin += mp4lib.fields.FIELD_UINT32.getLength() * 5;
    }
    return size_origin;
};

mp4lib.boxes.TrackHeaderBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);

    if (this.version === 1){
        this.creation_time = this._readData(data,mp4lib.fields.FIELD_UINT64);
        this.modification_time = this._readData(data,mp4lib.fields.FIELD_UINT64);
        this.track_id = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.reserved = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.duration = this._readData(data,mp4lib.fields.FIELD_UINT64);
    } else {
        this.creation_time = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.modification_time = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.track_id = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.reserved = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.duration = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }

    this.reserved_2 = this._readArrayFieldData(data,mp4lib.fields.FIELD_UINT32,2);
    
    this.layer = this._readData(data,mp4lib.fields.FIELD_INT16);
    this.alternate_group = this._readData(data,mp4lib.fields.FIELD_INT16);
    this.volume = this._readData(data,mp4lib.fields.FIELD_INT16);
    this.reserved_3 = this._readData(data,mp4lib.fields.FIELD_INT16);

    this.matrix = this._readArrayFieldData(data,mp4lib.fields.FIELD_INT32,9);
    
    this.width = this._readData(data,mp4lib.fields.FIELD_INT32);
    this.height = this._readData(data,mp4lib.fields.FIELD_INT32);
};

mp4lib.boxes.TrackHeaderBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    if (this.version === 1){
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.creation_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.modification_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.track_id);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.reserved);
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.duration);
    } else {
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.creation_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.modification_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.track_id);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.reserved);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.duration);
    }
    
    this._writeArrayData(data, mp4lib.fields.FIELD_UINT32, this.reserved_2);

    this._writeData(data,mp4lib.fields.FIELD_INT16,this.layer);
    this._writeData(data,mp4lib.fields.FIELD_INT16,this.alternate_group);
    this._writeData(data,mp4lib.fields.FIELD_INT16,this.volume);
    this._writeData(data,mp4lib.fields.FIELD_INT16,this.reserved_3);
    
    this._writeArrayData(data, mp4lib.fields.FIELD_INT32, this.matrix);
    
    this._writeData(data,mp4lib.fields.FIELD_INT32,this.width);
    this._writeData(data,mp4lib.fields.FIELD_INT32,this.height);
};

// --------------------------- mdhd ----------------------------------
mp4lib.boxes.MediaHeaderBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'mdhd',size);
};

mp4lib.boxes.MediaHeaderBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.MediaHeaderBox.prototype.constructor = mp4lib.boxes.MediaHeaderBox;

mp4lib.boxes.MediaHeaderBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
     size_origin += mp4lib.fields.FIELD_UINT16.getLength() * 2;
    if (this.version==1) {
        size_origin += mp4lib.fields.FIELD_UINT64.getLength() * 3 + mp4lib.fields.FIELD_UINT32.getLength();
    }
    else {
        size_origin += mp4lib.fields.FIELD_UINT32.getLength() * 4;
    }
    return size_origin;
};

mp4lib.boxes.MediaHeaderBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);

    if (this.version === 1) {
        this.creation_time = this._readData(data,mp4lib.fields.FIELD_UINT64);
        this.modification_time = this._readData(data,mp4lib.fields.FIELD_UINT64);
        this.timescale = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.duration = this._readData(data,mp4lib.fields.FIELD_UINT64);
    } else {
        this.creation_time = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.modification_time = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.timescale = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.duration = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }

    this.language = this._readData(data,mp4lib.fields.FIELD_UINT16);
    this.pre_defined = this._readData(data,mp4lib.fields.FIELD_UINT16);
};

mp4lib.boxes.MediaHeaderBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);

    if (this.version === 1) {
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.creation_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.modification_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.timescale);
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.duration);
    } else {
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.creation_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.modification_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.timescale);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.duration);
    }

    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.language);
    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.pre_defined);
};

// --------------------------- mehd ----------------------------------
mp4lib.boxes.MovieExtendsHeaderBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'mehd',size);
};

mp4lib.boxes.MovieExtendsHeaderBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.MovieExtendsHeaderBox.prototype.constructor = mp4lib.boxes.MovieExtendsHeaderBox;

mp4lib.boxes.MovieExtendsHeaderBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    if (this.version == 1) {
        size_origin += mp4lib.fields.FIELD_UINT64.getLength();
    }
    else {
        size_origin += mp4lib.fields.FIELD_UINT32.getLength();
    }
    return size_origin;
};

mp4lib.boxes.MovieExtendsHeaderBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);

    if (this.version === 1) {
        this.fragment_duration = this._readData(data,mp4lib.fields.FIELD_UINT64);
    } else {
        this.fragment_duration = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }
};

mp4lib.boxes.MovieExtendsHeaderBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    if (this.version === 1){
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.fragment_duration);
    } else {
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.fragment_duration);
    }
};

// --------------------------- hdlr --------------------------------
mp4lib.boxes.HandlerBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'hdlr',size);
};

mp4lib.boxes.HandlerBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.HandlerBox.prototype.constructor = mp4lib.boxes.HandlerBox;

//add NAN
mp4lib.boxes.HandlerBox.prototype.HANDLERTYPEVIDEO = "vide";
mp4lib.boxes.HandlerBox.prototype.HANDLERTYPEAUDIO = "soun";
mp4lib.boxes.HandlerBox.prototype.HANDLERTYPETEXT = "meta";
mp4lib.boxes.HandlerBox.prototype.HANDLERVIDEONAME = "Video Track";
mp4lib.boxes.HandlerBox.prototype.HANDLERAUDIONAME = "Audio Track";
mp4lib.boxes.HandlerBox.prototype.HANDLERTEXTNAME = "Text Track";

mp4lib.boxes.HandlerBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT32.getLength() * 2 + mp4lib.fields.FIELD_UINT32.getLength() * 3 + mp4lib.fields.FIELD_STRING.getLength(this.name);
    return size_origin;
};

mp4lib.boxes.HandlerBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.pre_defined = this._readData(data,mp4lib.fields.FIELD_UINT32);
    this.handler_type = this._readData(data,mp4lib.fields.FIELD_UINT32);
    
    this.reserved = this._readArrayFieldData(data,mp4lib.fields.FIELD_UINT32,3);
    
    this.name = this._readData(data,mp4lib.fields.FIELD_STRING);
};

mp4lib.boxes.HandlerBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.pre_defined);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.handler_type);

    this._writeArrayData(data, mp4lib.fields.FIELD_UINT32, this.reserved);
    
    this._writeData(data,mp4lib.fields.FIELD_STRING,this.name);
};

// --------------------------- stts ----------------------------------
mp4lib.boxes.TimeToSampleBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'stts',size);
};

mp4lib.boxes.TimeToSampleBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.TimeToSampleBox.prototype.constructor = mp4lib.boxes.TimeToSampleBox;

mp4lib.boxes.TimeToSampleBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT32.getLength();
    size_origin += this.entry_count * (mp4lib.fields.FIELD_UINT32.getLength()*2);
    return size_origin;
};

mp4lib.boxes.TimeToSampleBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.entry_count = this._readData(data,mp4lib.fields.FIELD_UINT32);

    this.entry = [];

    for (var i = 0; i < this.entry_count; i++){
        var struct = {};
        
        struct.sample_count = this._readData(data,mp4lib.fields.FIELD_UINT32);
        struct.sample_delta = this._readData(data,mp4lib.fields.FIELD_UINT32);
    
        this.entry.push(struct);
    }
};

mp4lib.boxes.TimeToSampleBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);

    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry_count);

    for (var i = 0; i < this.entry_count; i++){
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry[i].sample_count);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry[i].sample_delta);
    }
};

// --------------------------- stsc ----------------------------------
mp4lib.boxes.SampleToChunkBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'stsc',size);
};

mp4lib.boxes.SampleToChunkBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.SampleToChunkBox.prototype.constructor = mp4lib.boxes.SampleToChunkBox;

mp4lib.boxes.SampleToChunkBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT32.getLength();
    size_origin += this.entry_count * (mp4lib.fields.FIELD_UINT32.getLength()*3);
    return size_origin;
};

mp4lib.boxes.SampleToChunkBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.entry_count = this._readData(data,mp4lib.fields.FIELD_UINT32);

    this.entry = [];

    for (var i = 0; i < this.entry_count; i++){
        var struct = {};
        
        struct.first_chunk = this._readData(data,mp4lib.fields.FIELD_UINT32);
        struct.samples_per_chunk = this._readData(data,mp4lib.fields.FIELD_UINT32);
        struct.samples_description_index = this._readData(data,mp4lib.fields.FIELD_UINT32);
    
        this.entry.push(struct);
    }
};

mp4lib.boxes.SampleToChunkBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);

    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry_count);
 
    for (var i = 0; i < this.entry_count; i++){
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry[i].first_chunk);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry[i].samples_per_chunk);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry[i].samples_description_index);
    }
};

// --------------------------- stco ----------------------------------
mp4lib.boxes.ChunkOffsetBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'stco',size);
};

mp4lib.boxes.ChunkOffsetBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.ChunkOffsetBox.prototype.constructor = mp4lib.boxes.ChunkOffsetBox;

mp4lib.boxes.ChunkOffsetBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT32.getLength()+ this.entry_count * mp4lib.fields.FIELD_UINT32.getLength();
    return size_origin;
};

mp4lib.boxes.ChunkOffsetBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.entry_count = this._readData(data,mp4lib.fields.FIELD_UINT32);

    this.chunk_offset = this._readArrayFieldData(data,mp4lib.fields.FIELD_UINT32,this.entry_count);
};

mp4lib.boxes.ChunkOffsetBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry_count);
 
    for (var i = 0; i < this.entry_count; i++){
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.chunk_offset[i]);
    }
};

// --------------------------- trex ----------------------------------
mp4lib.boxes.TrackExtendsBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'trex',size);
};

mp4lib.boxes.TrackExtendsBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.TrackExtendsBox.prototype.constructor = mp4lib.boxes.TrackExtendsBox;

mp4lib.boxes.TrackExtendsBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT32.getLength() * 5;
    return size_origin;
};

mp4lib.boxes.TrackExtendsBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);

    this.track_ID = this._readData(data,mp4lib.fields.FIELD_UINT32);
    this.default_sample_description_index = this._readData(data,mp4lib.fields.FIELD_UINT32);
    this.default_sample_duration = this._readData(data,mp4lib.fields.FIELD_UINT32);
    this.default_sample_size = this._readData(data,mp4lib.fields.FIELD_UINT32);
    this.default_sample_flags = this._readData(data,mp4lib.fields.FIELD_UINT32);
};

mp4lib.boxes.TrackExtendsBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.track_ID);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.default_sample_description_index);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.default_sample_duration);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.default_sample_size);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.default_sample_flags);
};

// --------------------------- vmhd ----------------------------------
mp4lib.boxes.VideoMediaHeaderBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'vmhd',size);
};

mp4lib.boxes.VideoMediaHeaderBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.VideoMediaHeaderBox.prototype.constructor = mp4lib.boxes.VideoMediaHeaderBox;

mp4lib.boxes.VideoMediaHeaderBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_INT16.getLength() + mp4lib.fields.FIELD_UINT16.getLength() * 3;
    return size_origin;
};

mp4lib.boxes.VideoMediaHeaderBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.graphicsmode = this._readData(data,mp4lib.fields.FIELD_INT16);

    this.opcolor = this._readArrayFieldData(data,mp4lib.fields.FIELD_UINT16,3);
};

mp4lib.boxes.VideoMediaHeaderBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);

    this._writeData(data,mp4lib.fields.FIELD_INT16,this.graphicsmode);

    this._writeArrayData(data, mp4lib.fields.FIELD_UINT16, this.opcolor);
};

// --------------------------- smhd ----------------------------------
mp4lib.boxes.SoundMediaHeaderBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'smhd',size);
};

mp4lib.boxes.SoundMediaHeaderBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.SoundMediaHeaderBox.prototype.constructor = mp4lib.boxes.SoundMediaHeaderBox;

mp4lib.boxes.SoundMediaHeaderBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_INT16.getLength() + mp4lib.fields.FIELD_UINT16.getLength();
    return size_origin;
};

mp4lib.boxes.SoundMediaHeaderBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.balance = this._readData(data,mp4lib.fields.FIELD_INT16);
    this.reserved = this._readData(data,mp4lib.fields.FIELD_UINT16);
};

mp4lib.boxes.SoundMediaHeaderBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);

    this._writeData(data,mp4lib.fields.FIELD_INT16,this.balance);
    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.reserved);
};

// --------------------------- dref ----------------------------------
mp4lib.boxes.DataReferenceBox=function(size) {
    mp4lib.boxes.ContainerFullBox.call(this,'dref',size);
};

mp4lib.boxes.DataReferenceBox.prototype = Object.create(mp4lib.boxes.ContainerFullBox.prototype);
mp4lib.boxes.DataReferenceBox.prototype.constructor = mp4lib.boxes.DataReferenceBox;

mp4lib.boxes.DataReferenceBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.ContainerFullBox.prototype.getLength.call(this,true);
    return size_origin;
};

mp4lib.boxes.DataReferenceBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.ContainerFullBox.prototype.read.call(this,data,pos,end,true);
};

mp4lib.boxes.DataReferenceBox.prototype.write = function (data,pos) {
    if (!this.entry_count) {
        //if entry_count has not been set, set it to boxes array length
        this.entry_count = this.boxes.length;
    }    
    mp4lib.boxes.ContainerFullBox.prototype.write.call(this,data,pos,true);
};

// --------------------------- url  ----------------------------------
mp4lib.boxes.DataEntryUrlBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'url ',size);
};

mp4lib.boxes.DataEntryUrlBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.DataEntryUrlBox.prototype.constructor = mp4lib.boxes.DataEntryUrlBox;

mp4lib.boxes.DataEntryUrlBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    //NAN : test on location value, not definition, probleme in IE
    if (this.location !== undefined /*&& this.location !==""*/){
        //this.flags = this.flags | 1;
        size_origin += mp4lib.fields.FIELD_STRING.getLength(this.location);
    }
    return size_origin;
};

mp4lib.boxes.DataEntryUrlBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);

    if (this.flags & '0x000001' === 0) {
        this.location = this._readData(data,mp4lib.fields.FIELD_STRING);
    }
};

mp4lib.boxes.DataEntryUrlBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);

    if (this.location !== undefined/* && this.location !== ""*/) {
        this._writeData(data,mp4lib.fields.FIELD_STRING,this.location);
    }
};

// --------------------------- urn  ----------------------------------
mp4lib.boxes.DataEntryUrnBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'urn ',size);
};

mp4lib.boxes.DataEntryUrnBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.DataEntryUrnBox.prototype.constructor = mp4lib.boxes.DataEntryUrnBox;

mp4lib.boxes.DataEntryUrnBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    if (this.flags & '0x000001' === 0){
        size_origin += mp4lib.fields.FIELD_STRING.getLength(this.name) + mp4lib.fields.FIELD_STRING.getLength(this.location);
    }
    return size_origin;
};

mp4lib.boxes.DataEntryUrnBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    if (this.flags & '0x000001' === 0) {
        this.name = this._readData(data,mp4lib.fields.FIELD_STRING);
        this.location = this._readData(data,mp4lib.fields.FIELD_STRING);
    }
};

mp4lib.boxes.DataEntryUrnBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    if (this.flags & '0x000001' === 0) {
        this._writeData(data,mp4lib.fields.FIELD_STRING,this.name);
        this._writeData(data,mp4lib.fields.FIELD_STRING,this.location);
    }
};

// --------------------------- mfhd ----------------------------------
mp4lib.boxes.MovieFragmentHeaderBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'mfhd',size);
};

mp4lib.boxes.MovieFragmentHeaderBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.MovieFragmentHeaderBox.prototype.constructor = mp4lib.boxes.MovieFragmentHeaderBox;

mp4lib.boxes.MovieFragmentHeaderBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT32.getLength();
    return size_origin;
};

mp4lib.boxes.MovieFragmentHeaderBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    this.sequence_number = this._readData(data,mp4lib.fields.FIELD_UINT32);
};

mp4lib.boxes.MovieFragmentHeaderBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.sequence_number);
};

// --------------------------- tfhd ----------------------------------
mp4lib.boxes.TrackFragmentHeaderBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'tfhd',size);
};

mp4lib.boxes.TrackFragmentHeaderBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.TrackFragmentHeaderBox.prototype.constructor = mp4lib.boxes.TrackFragmentHeaderBox;

mp4lib.boxes.TrackFragmentHeaderBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT32.getLength();
    if(this.base_data_offset !== undefined){
       size_origin += mp4lib.fields.FIELD_UINT64.getLength();
    }
    if(this.sample_description_index !== undefined){
       size_origin += mp4lib.fields.FIELD_UINT32.getLength();
    }
    if(this.default_sample_duration !== undefined){
       size_origin += mp4lib.fields.FIELD_UINT32.getLength();
    }
    if(this.default_sample_size !== undefined){
       size_origin += mp4lib.fields.FIELD_UINT32.getLength();
    }
    if(this.default_sample_flags !== undefined){
       size_origin += mp4lib.fields.FIELD_UINT32.getLength();
    }
    return size_origin;
};

mp4lib.boxes.TrackFragmentHeaderBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.track_ID =  this._readData(data,mp4lib.fields.FIELD_UINT32);
    if ((this.flags & 0x000001) !== 0){
        this.base_data_offset = this._readData(data,mp4lib.fields.FIELD_UINT64);
    }
    if ((this.flags & 0x000002) !== 0){
        this.sample_description_index = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }
    if ((this.flags & 0x000008) !== 0){
        this.default_sample_duration = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }
    if ((this.flags & 0x000010) !== 0){
        this.default_sample_size = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }
    if ((this.flags & 0x000020) !== 0){
        this.default_sample_flags = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }
};

mp4lib.boxes.TrackFragmentHeaderBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);

    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.track_ID);

    if ((this.flags & 0x000001) !== 0){
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.base_data_offset);
    }
    if ((this.flags & 0x000002) !== 0){
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.sample_description_index);
    }
    if ((this.flags & 0x000008) !== 0){
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.default_sample_duration);
    }
    if ((this.flags & 0x000010) !== 0){
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.default_sample_size);
    }
    if ((this.flags & 0x000020) !== 0){
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.default_sample_flags);
    }
};

// --------------------------- tfdt ----------------------------------
mp4lib.boxes.TrackFragmentBaseMediaDecodeTimeBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'tfdt',size);
};

mp4lib.boxes.TrackFragmentBaseMediaDecodeTimeBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.TrackFragmentBaseMediaDecodeTimeBox.prototype.constructor = mp4lib.boxes.TrackFragmentBaseMediaDecodeTimeBox;

mp4lib.boxes.TrackFragmentBaseMediaDecodeTimeBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
     if (this.version === 1){
        size_origin += mp4lib.fields.FIELD_UINT64.getLength();
    }
    else{
        size_origin += mp4lib.fields.FIELD_UINT32.getLength();
    }
    return size_origin;
};

mp4lib.boxes.TrackFragmentBaseMediaDecodeTimeBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    if (this.version === 1){
        this.baseMediaDecodeTime = this._readData(data,mp4lib.fields.FIELD_UINT64);
    } else {
        this.baseMediaDecodeTime = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }
};

mp4lib.boxes.TrackFragmentBaseMediaDecodeTimeBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    if (this.version === 1){
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.baseMediaDecodeTime);
    } else {
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.baseMediaDecodeTime);
    }
};

// --------------------------- trun ----------------------------------
mp4lib.boxes.TrackFragmentRunBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'trun',size);
};

mp4lib.boxes.TrackFragmentRunBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.TrackFragmentRunBox.prototype.constructor = mp4lib.boxes.TrackFragmentRunBox;

mp4lib.boxes.TrackFragmentRunBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this), i = 0;
    size_origin += mp4lib.fields.FIELD_UINT32.getLength(); //sample_count size
    if (this.data_offset !== undefined){
        size_origin += mp4lib.fields.FIELD_INT32.getLength();
    }
    if (this.first_sample_flags !== undefined){
        size_origin += mp4lib.fields.FIELD_UINT32.getLength();
    }

    for (i = 0; i < this.sample_count; i++){
        if (this.samples_table[i].sample_duration !== undefined){
            size_origin += mp4lib.fields.FIELD_UINT32.getLength();
        }
        if (this.samples_table[i].sample_size !== undefined){
            size_origin += mp4lib.fields.FIELD_UINT32.getLength();
        }
        if (this.samples_table[i].sample_flags !== undefined){
            size_origin += mp4lib.fields.FIELD_UINT32.getLength();
        }

        if (this.version === 1){
            if (this.samples_table[i].sample_composition_time_offset !== undefined){
                size_origin += mp4lib.fields.FIELD_INT32.getLength();
            }
        }
        else {
            if (this.samples_table[i].sample_composition_time_offset !== undefined){
                size_origin += mp4lib.fields.FIELD_UINT32.getLength();
            }
        }
    }

    return size_origin;
};

mp4lib.boxes.TrackFragmentRunBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.sample_count = this._readData(data,mp4lib.fields.FIELD_UINT32);

    if ((this.flags & 0x000001) !== 0){
        this.data_offset = this._readData(data,mp4lib.fields.FIELD_INT32);
    }
    if ((this.flags & 0x000004) !== 0){
        this.first_sample_flags = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }

    this.samples_table = [];

    for (var i = 0; i < this.sample_count; i++){
        var struct = {};
        if ((this.flags & 0x000100) !== 0){
            struct.sample_duration = this._readData(data,mp4lib.fields.FIELD_UINT32);
        }
        if ((this.flags & 0x000200) !== 0){
            struct.sample_size = this._readData(data,mp4lib.fields.FIELD_UINT32);
        }
        if ((this.flags & 0x000400) !== 0){
            struct.sample_flags = this._readData(data,mp4lib.fields.FIELD_UINT32);
        }

        if (this.version === 1) {
            if ((this.flags & 0x000800) !== 0){
                struct.sample_composition_time_offset = this._readData(data,mp4lib.fields.FIELD_INT32);
            }
        } else {
            if ((this.flags & 0x000800) !== 0){
                struct.sample_composition_time_offset = this._readData(data,mp4lib.fields.FIELD_UINT32);
            }
        }
        this.samples_table.push(struct);
    }
};

mp4lib.boxes.TrackFragmentRunBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.sample_count);

    if ((this.flags & 0x000001) !== 0){
        this._writeData(data,mp4lib.fields.FIELD_INT32,this.data_offset);
    }
    if ((this.flags & 0x000004) !== 0){
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.first_sample_flags);
    }

    for (var i = 0; i < this.sample_count; i++){

        if ((this.flags & 0x000100) !== 0){
            this._writeData(data,mp4lib.fields.FIELD_UINT32,this.samples_table[i].sample_duration);
        }
        if ((this.flags & 0x000200) !== 0){
            this._writeData(data,mp4lib.fields.FIELD_UINT32,this.samples_table[i].sample_size);
        }
        if ((this.flags & 0x000400) !== 0){
            this._writeData(data,mp4lib.fields.FIELD_UINT32,this.samples_table[i].sample_flags);
        }

        if (this.version === 1) {
            if ((this.flags & 0x000800) !== 0){
                this._writeData(data,mp4lib.fields.FIELD_INT32,this.samples_table[i].sample_composition_time_offset);
            }
        } else {
            if ((this.flags & 0x000800) !== 0){
                this._writeData(data,mp4lib.fields.FIELD_UINT32,this.samples_table[i].sample_composition_time_offset);
            }
        }
    }
};

// --------------------------- stsd ----------------------------------
mp4lib.boxes.SampleDescriptionBox=function(size) {
    mp4lib.boxes.ContainerFullBox.call(this,'stsd',size);
};

mp4lib.boxes.SampleDescriptionBox.prototype = Object.create(mp4lib.boxes.ContainerFullBox.prototype);
mp4lib.boxes.SampleDescriptionBox.prototype.constructor = mp4lib.boxes.SampleDescriptionBox;

mp4lib.boxes.SampleDescriptionBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.ContainerFullBox.prototype.getLength.call(this,true);
    return size_origin;
};

mp4lib.boxes.SampleDescriptionBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.ContainerFullBox.prototype.read.call(this,data,pos,end,true);
};

mp4lib.boxes.SampleDescriptionBox.prototype.write = function (data,pos) {
    this.entry_count = this.boxes.length;
    mp4lib.boxes.ContainerFullBox.prototype.write.call(this,data,pos,true);
};

// --------------------------- sdtp ----------------------------------
mp4lib.boxes.SampleDependencyTableBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'sdtp',size);
};

mp4lib.boxes.SampleDependencyTableBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.SampleDependencyTableBox.prototype.constructor = mp4lib.boxes.SampleDependencyTableBox;

mp4lib.boxes.SampleDependencyTableBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT8.getLength() * this.sample_dependency_array.length;
    return size_origin;
};

mp4lib.boxes.SampleDependencyTableBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    this.sample_dependency_array = this._readArrayData(data,mp4lib.fields.FIELD_UINT8);
};

mp4lib.boxes.SampleDependencyTableBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);

    this._writeArrayData(data, mp4lib.fields.FIELD_UINT8, this.sample_dependency_array);
};

// --------------------------- abstract SampleEntry ----------------------------------
mp4lib.boxes.SampleEntryBox=function(boxType,size) {
    mp4lib.boxes.Box.call(this,boxType,size);
};

mp4lib.boxes.SampleEntryBox.prototype = Object.create(mp4lib.boxes.Box.prototype);
mp4lib.boxes.SampleEntryBox.prototype.constructor = mp4lib.boxes.SampleEntryBox;

mp4lib.boxes.SampleEntryBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.Box.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT16.getLength()+ mp4lib.fields.FIELD_UINT8.getLength()*6;
    return size_origin;
};

mp4lib.boxes.SampleEntryBox.prototype.read = function (data,pos,end) {
    this.localPos = pos;
    this.localEnd = end;
    
    this.reserved = this._readArrayFieldData(data,mp4lib.fields.FIELD_UINT8,6);
    
    this.data_reference_index = this._readData(data,mp4lib.fields.FIELD_UINT16);
};

mp4lib.boxes.SampleEntryBox.prototype.write = function (data,pos) {
    mp4lib.boxes.Box.prototype.write.call(this,data,pos);
    
    this._writeArrayData(data, mp4lib.fields.FIELD_UINT8, this.reserved);

    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.data_reference_index);
};

// --------------------------- abstract VisualSampleEntry ----------------------------------
mp4lib.boxes.VisualSampleEntryBox=function(boxType,size) {
    mp4lib.boxes.SampleEntryBox.call(this,boxType,size);
};

mp4lib.boxes.VisualSampleEntryBox.prototype = Object.create(mp4lib.boxes.SampleEntryBox.prototype);
mp4lib.boxes.VisualSampleEntryBox.prototype.constructor = mp4lib.boxes.VisualSampleEntryBox;

mp4lib.boxes.VisualSampleEntryBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.SampleEntryBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT16.getLength() * 7+ mp4lib.fields.FIELD_UINT32.getLength() * 3;
    size_origin += mp4lib.fields.FIELD_UINT32.getLength() * 3;
    size_origin += 32; //compressorname size
    return size_origin;
};

mp4lib.boxes.VisualSampleEntryBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.SampleEntryBox.prototype.read.call(this,data,pos,end);
    this.pre_defined = this._readData(data,mp4lib.fields.FIELD_UINT16);
    this.reserved_2 = this._readData(data,mp4lib.fields.FIELD_UINT16);
    // there is already field called reserved from SampleEntry, so we need to call it reserved_2
    this.pre_defined_2 = this._readArrayFieldData(data,mp4lib.fields.FIELD_UINT32,3);
    
    this.width = this._readData(data,mp4lib.fields.FIELD_UINT16);
    this.height = this._readData(data,mp4lib.fields.FIELD_UINT16);
    this.horizresolution = this._readData(data,mp4lib.fields.FIELD_UINT32);
    this.vertresolution = this._readData(data,mp4lib.fields.FIELD_UINT32);
    this.reserved_3 = this._readData(data,mp4lib.fields.FIELD_UINT32);
    this.frame_count = this._readData(data,mp4lib.fields.FIELD_UINT16);
    
    this.compressorname = new mp4lib.fields.FixedLenStringField(32);
    this.compressorname = this.compressorname.read(data,this.localPos);
    this.localPos += 32;

    this.depth = this._readData(data,mp4lib.fields.FIELD_UINT16);
    this.pre_defined_3 = this._readData(data,mp4lib.fields.FIELD_INT16);
};

mp4lib.boxes.VisualSampleEntryBox.prototype.write = function (data,pos) {
    mp4lib.boxes.SampleEntryBox.prototype.write.call(this,data,pos);
    
    var i = 0;

    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.pre_defined);
    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.reserved_2);
    
    // there is already field called reserved from SampleEntry, so we need to call it reserved_2
    this._writeArrayData(data, mp4lib.fields.FIELD_UINT32, this.pre_defined_2);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.width);
    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.height);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.horizresolution);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.vertresolution);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.reserved_3);
    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.frame_count);

    for (i=0;i<32;i++) {
        data[this.localPos+i] = this.compressorname.charCodeAt(i);
    }

    this.localPos += 32;
    
    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.depth);
    this._writeData(data,mp4lib.fields.FIELD_INT16,this.pre_defined_3);
};

// --------------------------- abstract VisualSampleEntryContainer ----------------------------------
mp4lib.boxes.VisualSampleEntryContainerBox=function(boxType,size) {
    mp4lib.boxes.VisualSampleEntryBox.call(this,boxType,size);
    this.boxes = [];
};

mp4lib.boxes.VisualSampleEntryContainerBox.prototype = Object.create(mp4lib.boxes.VisualSampleEntryBox.prototype);
mp4lib.boxes.VisualSampleEntryContainerBox.prototype.constructor = mp4lib.boxes.VisualSampleEntryContainerBox;

mp4lib.boxes.VisualSampleEntryContainerBox.prototype.getLength = function () {
    var size_origin = mp4lib.boxes.VisualSampleEntryBox.prototype.getLength.call(this);
    var i=0, lengthTemp=0;
    for (i = 0; i < this.boxes.length;i++){
        lengthTemp = this.boxes[i].getLength();
        //set size in the box container => remove it!!!!
        this.boxes[i].size = lengthTemp;
        size_origin += lengthTemp;
    }
    return size_origin;
};

mp4lib.boxes.VisualSampleEntryContainerBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.VisualSampleEntryBox.prototype.read.call(this,data,pos,end);

    var size = 0, uuidFieldPos = 0, uuid = null, boxtype;

    while (this.localPos<this.localEnd) {
        // Read box size        
        size = mp4lib.fields.FIELD_UINT32.read(data, this.localPos);

        // Read boxtype
        boxtype = mp4lib.fields.readString(data, this.localPos+4, 4);

        // Extented type?
        if (boxtype == "uuid") {
            uuidFieldPos = (size == 1)?16:8;
            uuid = new mp4lib.fields.ArrayField(mp4lib.fields.FIELD_INT8, 16).read(data, this.localPos + uuidFieldPos, this.localPos + uuidFieldPos + 16);
            uuid = JSON.stringify(uuid);
        }

        var box = mp4lib.createBox( boxtype, size, uuid);
        if (boxtype === "uuid") {
            box.read(data,this.localPos+mp4lib.fields.FIELD_INT8.getLength()*16+8,this.localPos+size);
        }else {
            box.read(data,this.localPos+8,this.localPos+size);
        }
        
        // in debug mode, sourcebuffer is copied to each box,
        // so any invalid deserializations may be found by comparing
        // source buffer with serialized box
        if (mp4lib.debug)
            box.__sourceBuffer = data.subarray(this.localPos,this.localPos+box.size);

        this.boxes.push(box);
        this.localPos+=box.size;

        if (box.size === 0){
            throw new mp4lib.ParseException('Zero size of box '+box.boxtype+
                                            ', parsing stopped to avoid infinite loop');
        }
    }
};

mp4lib.boxes.VisualSampleEntryContainerBox.prototype.write = function (data,pos) {
    mp4lib.boxes.VisualSampleEntryBox.prototype.write.call(this,data,pos);
    
    for (var i=0;i<this.boxes.length;i++) {
       var box = this.boxes[i];
       box.write(data,this.localPos);
       this.localPos += box.size;
    }
};

// --------------------------- avc1 ----------------------------------
mp4lib.boxes.AVC1VisualSampleEntryBox=function(size) {
    mp4lib.boxes.VisualSampleEntryContainerBox.call(this,'avc1',size);
};

mp4lib.boxes.AVC1VisualSampleEntryBox.prototype = Object.create(mp4lib.boxes.VisualSampleEntryContainerBox.prototype);
mp4lib.boxes.AVC1VisualSampleEntryBox.prototype.constructor = mp4lib.boxes.AVC1VisualSampleEntryBox;

//-------------------------- encv ------------------------------------
mp4lib.boxes.EncryptedVideoBox=function(size) {
    mp4lib.boxes.VisualSampleEntryContainerBox.call(this,'encv',size);
};

mp4lib.boxes.EncryptedVideoBox.prototype = Object.create(mp4lib.boxes.VisualSampleEntryContainerBox.prototype);
mp4lib.boxes.EncryptedVideoBox.prototype.constructor = mp4lib.boxes.EncryptedVideoBox;

// --------------------------- avcc ----------------------------------
mp4lib.boxes.AVCConfigurationBox=function(size) {
    mp4lib.boxes.Box.call(this,'avcC',size);
};

mp4lib.boxes.AVCConfigurationBox.prototype = Object.create(mp4lib.boxes.Box.prototype);
mp4lib.boxes.AVCConfigurationBox.prototype.constructor = mp4lib.boxes.AVCConfigurationBox;

mp4lib.boxes.AVCConfigurationBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.Box.prototype.getLength.call(this)/*, i = 0*/;

    size_origin += mp4lib.fields.FIELD_UINT8.getLength() * 4+mp4lib.fields.FIELD_UINT8.getLength()*3;
    size_origin += this._getNALLength(this.numOfSequenceParameterSets,this.SPS_NAL);
    size_origin += this._getNALLength(this.numOfPictureParameterSets,this.PPS_NAL);
    
    return size_origin;
};

mp4lib.boxes.AVCConfigurationBox.prototype._getNALLength = function (nbElements,nalArray) {
    var size_NAL = 0;
    
    for (var i = 0; i < nbElements; i++){
        size_NAL += mp4lib.fields.FIELD_UINT16.getLength() + nalArray[i].NAL_length;
    }

    return size_NAL;
};

mp4lib.boxes.AVCConfigurationBox.prototype.read = function (data,pos,end) {
    this.localPos = pos;
    this.localEnd = end;
    this.configurationVersion = this._readData(data,mp4lib.fields.FIELD_UINT8);
    this.AVCProfileIndication = this._readData(data,mp4lib.fields.FIELD_UINT8);
    this.profile_compatibility = this._readData(data,mp4lib.fields.FIELD_UINT8);
    this.AVCLevelIndication = this._readData(data,mp4lib.fields.FIELD_UINT8);
    
    this.temp = this._readData(data,mp4lib.fields.FIELD_UINT8);
    // 6 bits for reserved =63 and two bits for NAL length = 2-bit length byte size type
    this.lengthSizeMinusOne = this.temp & 3;
    this.numOfSequenceParameterSets_tmp = this._readData(data,mp4lib.fields.FIELD_UINT8);
    this.numOfSequenceParameterSets = this.numOfSequenceParameterSets_tmp & 31;

    this.SPS_NAL = this._readNAL(data, this.numOfSequenceParameterSets);
    
    this.numOfPictureParameterSets = this._readData(data,mp4lib.fields.FIELD_UINT8);
    
    this.PPS_NAL = this._readNAL(data, this.numOfPictureParameterSets);
};

mp4lib.boxes.AVCConfigurationBox.prototype._readNAL = function (data, nbElements) {
    var nalArray = [];
    for (var i = 0; i < nbElements; i++){
        var struct = {};
        
        struct.NAL_length = this._readData(data,mp4lib.fields.FIELD_UINT16);
        struct.NAL = data.subarray(this.localPos,this.localPos+struct.NAL_length);
        this.localPos += struct.NAL_length;
        nalArray.push(struct);
    }
    return nalArray;
};

mp4lib.boxes.AVCConfigurationBox.prototype.write = function (data,pos) {
    mp4lib.boxes.Box.prototype.write.call(this,data,pos);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT8,this.configurationVersion);
    this._writeData(data,mp4lib.fields.FIELD_UINT8,this.AVCProfileIndication);
    this._writeData(data,mp4lib.fields.FIELD_UINT8,this.profile_compatibility);
    this._writeData(data,mp4lib.fields.FIELD_UINT8,this.AVCLevelIndication);

    this.temp = this.lengthSizeMinusOne | 252;
    this._writeData(data,mp4lib.fields.FIELD_UINT8,this.temp);
    this.numOfSequenceParameterSets = this.SPS_NAL.length;
    this.numOfSequenceParameterSets_tmp = this.numOfSequenceParameterSets | 224;
    this._writeData(data,mp4lib.fields.FIELD_UINT8,this.numOfSequenceParameterSets_tmp);
  
    this._writeNAL(data, this.numOfSequenceParameterSets,this.SPS_NAL);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT8,this.numOfPictureParameterSets);

    this._writeNAL(data, this.numOfPictureParameterSets,this.PPS_NAL);
};

mp4lib.boxes.AVCConfigurationBox.prototype._writeNAL = function (data, nbElements, nalArray) {
    for (var i = 0; i < nbElements; i++){
        this._writeData(data,mp4lib.fields.FIELD_UINT16, nalArray[i].NAL_length);
        data.set(nalArray[i].NAL,this.localPos);
        this.localPos += nalArray[i].NAL_length;
    }
};

// --------------------------- pasp ----------------------------------
mp4lib.boxes.PixelAspectRatioBox=function(size) {
      mp4lib.boxes.Box.call(this,'pasp',size);
};

mp4lib.boxes.PixelAspectRatioBox.prototype = Object.create(mp4lib.boxes.Box.prototype);
mp4lib.boxes.PixelAspectRatioBox.prototype.constructor = mp4lib.boxes.PixelAspectRatioBox;

mp4lib.boxes.PixelAspectRatioBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.Box.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_INT32.getLength() * 2;
    return size_origin;
};

mp4lib.boxes.PixelAspectRatioBox.prototype.read = function (data,pos,end) {
    this.localPos = pos;
    this.localEnd = end;
    
    this.hSpacing = this._readData(data,mp4lib.fields.FIELD_INT32);
    this.vSpacing = this._readData(data,mp4lib.fields.FIELD_INT32);
};

mp4lib.boxes.PixelAspectRatioBox.prototype.write = function (data,pos) {
    mp4lib.boxes.Box.prototype.write.call(this,data,pos);

    this._writeData(data,mp4lib.fields.FIELD_INT32,this.hSpacing);
    this._writeData(data,mp4lib.fields.FIELD_INT32,this.vSpacing);
};

// --------------------------- abstract VisualSampleEntry ----------------------------------
mp4lib.boxes.AudioSampleEntryBox=function(boxType,size) {
    mp4lib.boxes.SampleEntryBox.call(this,boxType,size);
};

mp4lib.boxes.AudioSampleEntryBox.prototype = Object.create(mp4lib.boxes.SampleEntryBox.prototype);
mp4lib.boxes.AudioSampleEntryBox.prototype.constructor = mp4lib.boxes.AudioSampleEntryBox;

mp4lib.boxes.AudioSampleEntryBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.SampleEntryBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT16.getLength() * 4 + mp4lib.fields.FIELD_UINT32.getLength() * 3 ;
    return size_origin;
};

mp4lib.boxes.AudioSampleEntryBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.SampleEntryBox.prototype.read.call(this,data,pos,end);

    this.reserved_2 = this._readArrayFieldData(data,mp4lib.fields.FIELD_UINT32,2);
    
    this.channelcount = this._readData(data,mp4lib.fields.FIELD_UINT16);
    this.samplesize = this._readData(data,mp4lib.fields.FIELD_UINT16);
    this.pre_defined = this._readData(data,mp4lib.fields.FIELD_UINT16);
    this.reserved_3 = this._readData(data,mp4lib.fields.FIELD_UINT16);
    this.samplerate = this._readData(data,mp4lib.fields.FIELD_UINT32);
};

mp4lib.boxes.AudioSampleEntryBox.prototype.write = function (data,pos) {
    mp4lib.boxes.SampleEntryBox.prototype.write.call(this,data,pos);
    
    this._writeArrayData(data,mp4lib.fields.FIELD_UINT32,this.reserved_2);

    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.channelcount);
    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.samplesize);
    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.pre_defined);
    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.reserved_3);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.samplerate);
};

// --------------------------- abstract AudioSampleEntryContainer ----------------------------------
mp4lib.boxes.AudioSampleEntryContainerBox=function(boxType,size) {
    mp4lib.boxes.AudioSampleEntryBox.call(this,boxType,size);
    this.boxes = [];
};

mp4lib.boxes.AudioSampleEntryContainerBox.prototype = Object.create(mp4lib.boxes.AudioSampleEntryBox.prototype);
mp4lib.boxes.AudioSampleEntryContainerBox.prototype.constructor = mp4lib.boxes.AudioSampleEntryContainerBox;

mp4lib.boxes.AudioSampleEntryContainerBox.prototype.getLength = function () {
    var size_origin = mp4lib.boxes.AudioSampleEntryBox.prototype.getLength.call(this);
    var i=0, lengthTemp=0;
    for (i = 0; i < this.boxes.length;i++){
        lengthTemp = this.boxes[i].getLength();
        //set size in the box container => remove it!!!!
        this.boxes[i].size = lengthTemp;
        size_origin += lengthTemp;
    }
    return size_origin;
};

mp4lib.boxes.AudioSampleEntryContainerBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.AudioSampleEntryBox.prototype.read.call(this,data,pos,end);

    var size = 0, uuidFieldPos = 0, uuid = null, boxtype;

    while (this.localPos<this.localEnd) {
        // Read box size
        size = mp4lib.fields.FIELD_UINT32.read(data, this.localPos);

        // Read boxtype
        boxtype = mp4lib.fields.readString(data, this.localPos+4, 4);

        // Extented type?
        if (boxtype == "uuid") {
            uuidFieldPos = (size == 1)?16:8;
            uuid = new mp4lib.fields.ArrayField(mp4lib.fields.FIELD_INT8, 16).read(data, this.localPos + uuidFieldPos, this.localPos + uuidFieldPos + 16);
            uuid = JSON.stringify(uuid);
        }

        var box = mp4lib.createBox( boxtype, size, uuid);
        if (boxtype === "uuid") {
            box.read(data,this.localPos+mp4lib.fields.FIELD_INT8.getLength()*16+8,this.localPos+size);
        }else {
            box.read(data,this.localPos+8,this.localPos+size);
        }
        
        // in debug mode, sourcebuffer is copied to each box,
        // so any invalid deserializations may be found by comparing
        // source buffer with serialized box
        if (mp4lib.debug)
            box.__sourceBuffer = data.subarray(this.localPos,this.localPos+box.size);

        this.boxes.push(box);
        this.localPos+=box.size;

        if (box.size === 0){
            throw new mp4lib.ParseException('Zero size of box '+box.boxtype+
                                            ', parsing stopped to avoid infinite loop');
        }
    }
};

mp4lib.boxes.AudioSampleEntryContainerBox.prototype.write = function (data,pos) {
    mp4lib.boxes.AudioSampleEntryBox.prototype.write.call(this,data,pos);
    
    for (var i=0;i<this.boxes.length;i++) {
       var box = this.boxes[i];
       box.write(data,this.localPos);
       this.localPos += box.size;
    }
};

// --------------------------- mp4a ----------------------------------
mp4lib.boxes.MP4AudioSampleEntryBox=function(size) {
    mp4lib.boxes.AudioSampleEntryContainerBox.call(this,'mp4a',size);
};

mp4lib.boxes.MP4AudioSampleEntryBox.prototype = Object.create(mp4lib.boxes.AudioSampleEntryContainerBox.prototype);
mp4lib.boxes.MP4AudioSampleEntryBox.prototype.constructor = mp4lib.boxes.MP4AudioSampleEntryBox;

//-------------------------- enca ------------------------------------
mp4lib.boxes.EncryptedAudioBox=function(size) {
    mp4lib.boxes.AudioSampleEntryContainerBox.call(this,'enca',size);
};

mp4lib.boxes.EncryptedAudioBox.prototype = Object.create(mp4lib.boxes.AudioSampleEntryContainerBox.prototype);
mp4lib.boxes.EncryptedAudioBox.prototype.constructor = mp4lib.boxes.EncryptedAudioBox;

// --------------------------- esds ----------------------------
mp4lib.boxes.ESDBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'esds',size);
};

mp4lib.boxes.ESDBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.ESDBox.prototype.constructor = mp4lib.boxes.ESDBox;

mp4lib.boxes.ESDBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT8.getLength() * 2 + this.ES_length;
    return size_origin;
};

mp4lib.boxes.ESDBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);

    this.ES_tag = this._readData(data,mp4lib.fields.FIELD_UINT8);
    this.ES_length = this._readData(data,mp4lib.fields.FIELD_UINT8);

    this.ES_data = data.subarray(this.localPos,this.localPos+this.ES_length);
    this.localPos += this.ES_length;
};

mp4lib.boxes.ESDBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT8,this.ES_tag);
    this._writeData(data,mp4lib.fields.FIELD_UINT8,this.ES_length);

    data.set(this.ES_data,this.localPos);
    this.localPos += this.ES_length;
};

// --------------------------- stsz ----------------------------------
mp4lib.boxes.SampleSizeBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'stsz',size);
};

mp4lib.boxes.SampleSizeBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.SampleSizeBox.prototype.constructor = mp4lib.boxes.SampleSizeBox;

mp4lib.boxes.SampleSizeBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT32.getLength() * 2 + mp4lib.fields.FIELD_UINT32.getLength() * this.sample_count;
    return size_origin;
};

mp4lib.boxes.SampleSizeBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.sample_size = this._readData(data,mp4lib.fields.FIELD_UINT32);
    this.sample_count = this._readData(data,mp4lib.fields.FIELD_UINT32);

    this.entries = this._readArrayFieldData(data,mp4lib.fields.FIELD_UINT32,this.sample_count);
};

mp4lib.boxes.SampleSizeBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);

    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.sample_size);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.sample_count);
    
    for (var i = 0; i < this.sample_count; i++){
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entries[i]);
    }
};

// ------------------------- pssh ------------------------------------
mp4lib.boxes.ProtectionSystemSpecificHeaderBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'pssh',size);
};

mp4lib.boxes.ProtectionSystemSpecificHeaderBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.ProtectionSystemSpecificHeaderBox.prototype.constructor = mp4lib.boxes.ProtectionSystemSpecificHeaderBox;

mp4lib.boxes.ProtectionSystemSpecificHeaderBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT8.getLength() * 16;
    size_origin += mp4lib.fields.FIELD_UINT32.getLength();
    size_origin += mp4lib.fields.FIELD_UINT8.getLength() * this.DataSize;
    return size_origin;
};

mp4lib.boxes.ProtectionSystemSpecificHeaderBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.SystemID = this._readArrayFieldData(data,mp4lib.fields.FIELD_UINT8,16);

    this.DataSize = this._readData(data,mp4lib.fields.FIELD_UINT32);

    this.Data = this._readArrayFieldData(data,mp4lib.fields.FIELD_UINT8,this.DataSize);
};

mp4lib.boxes.ProtectionSystemSpecificHeaderBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    var i = 0;

    for (i = 0; i < 16; i++) {
        this._writeData(data,mp4lib.fields.FIELD_UINT8,this.SystemID[i]);
    }

    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.DataSize);

    for (i = 0; i < this.DataSize; i++) {
        this._writeData(data,mp4lib.fields.FIELD_UINT8,this.Data[i]);
    }
};

// ------------------------- saiz ------------------------------------
mp4lib.boxes.SampleAuxiliaryInformationSizesBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'saiz',size);
};

mp4lib.boxes.SampleAuxiliaryInformationSizesBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.SampleAuxiliaryInformationSizesBox.prototype.constructor = mp4lib.boxes.SampleAuxiliaryInformationSizesBox;

mp4lib.boxes.SampleAuxiliaryInformationSizesBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    
    if (this.flags & 1){
        size_origin += mp4lib.fields.FIELD_UINT32.getLength() * 2;
    }
    
    size_origin += mp4lib.fields.FIELD_UINT8.getLength() + mp4lib.fields.FIELD_UINT32.getLength();

    if (this.default_sample_info_size === 0){
        size_origin += mp4lib.fields.FIELD_UINT8.getLength() * this.sample_count;
    }

    return size_origin;
};

mp4lib.boxes.SampleAuxiliaryInformationSizesBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    if (this.flags & 1)
    {
        this.aux_info_type = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.aux_info_type_parameter = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }
    this.default_sample_info_size = this._readData(data,mp4lib.fields.FIELD_UINT8);
    this.sample_count =  this._readData(data,mp4lib.fields.FIELD_UINT32);

    if (this.default_sample_info_size === 0) {
        this.sample_info_size = this._readArrayFieldData(data,mp4lib.fields.FIELD_UINT8,this.sample_count);
    }
};

mp4lib.boxes.SampleAuxiliaryInformationSizesBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    if (this.flags & 1)
    {
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.aux_info_type);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.aux_info_type_parameter);
    }
    this._writeData(data,mp4lib.fields.FIELD_UINT8,this.default_sample_info_size);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.sample_count);

    if (this.default_sample_info_size === 0) {
        for (var i = 0; i < this.sample_count; i++) {
            this._writeData(data,mp4lib.fields.FIELD_UINT8,this.sample_info_size[i]);
        }
    }
};

//------------------------- saio ------------------------------------
mp4lib.boxes.SampleAuxiliaryInformationOffsetsBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'saio',size);
};

mp4lib.boxes.SampleAuxiliaryInformationOffsetsBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.SampleAuxiliaryInformationOffsetsBox.prototype.constructor = mp4lib.boxes.SampleAuxiliaryInformationOffsetsBox;

mp4lib.boxes.SampleAuxiliaryInformationOffsetsBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    if (this.flags & 1){
        size_origin += mp4lib.fields.FIELD_UINT32.getLength() * 2;
    }
    size_origin += mp4lib.fields.FIELD_UINT32.getLength(); /*entry_count size */
    if (this.version === 0){
        size_origin += mp4lib.fields.FIELD_UINT32.getLength() * this.entry_count;
    }
    else{
        size_origin += mp4lib.fields.FIELD_UINT64.getLength() * this.entry_count;
    }
    return size_origin;
};

mp4lib.boxes.SampleAuxiliaryInformationOffsetsBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);

    if (this.flags & 1){
        this.aux_info_type = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.aux_info_type_parameter = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }
    
    this.entry_count = this._readData(data,mp4lib.fields.FIELD_UINT32);

    if (this.version === 0) {
        this.offset = this._readArrayFieldData(data,mp4lib.fields.FIELD_UINT32,this.entry_count);
    }
    else {
        this.offset = this._readArrayFieldData(data,mp4lib.fields.FIELD_UINT64,this.entry_count);
    }
};

mp4lib.boxes.SampleAuxiliaryInformationOffsetsBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);

    var i = 0;
    
    if (this.flags & 1){
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.aux_info_type);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.aux_info_type_parameter);
    }
    
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry_count);

    if (this.version === 0) {
        for (i = 0; i < this.entry_count; i++) {
            this._writeData(data,mp4lib.fields.FIELD_UINT32,this.offset[i]);
        }
    }
    else {
        for (i = 0; i < this.entry_count; i++) {
            this._writeData(data,mp4lib.fields.FIELD_UINT64,this.offset[i]);
        }
    }
};

//------------------------- sinf ------------------------------------
mp4lib.boxes.ProtectionSchemeInformationBox=function(size) {
    mp4lib.boxes.ContainerBox.call(this,'sinf',size);
};

mp4lib.boxes.ProtectionSchemeInformationBox.prototype = Object.create(mp4lib.boxes.ContainerBox.prototype);
mp4lib.boxes.ProtectionSchemeInformationBox.prototype.constructor = mp4lib.boxes.ProtectionSchemeInformationBox;

//------------------------ schi --------------------------------------
mp4lib.boxes.SchemeInformationBox=function(size) {
    mp4lib.boxes.ContainerBox.call(this,'schi',size);
};

mp4lib.boxes.SchemeInformationBox.prototype = Object.create(mp4lib.boxes.ContainerBox.prototype);
mp4lib.boxes.SchemeInformationBox.prototype.constructor = mp4lib.boxes.SchemeInformationBox;

//------------------------ tenc --------------------------------------
mp4lib.boxes.TrackEncryptionBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'tenc',size);
};

mp4lib.boxes.TrackEncryptionBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.TrackEncryptionBox.prototype.constructor = mp4lib.boxes.TrackEncryptionBox;

mp4lib.boxes.TrackEncryptionBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    
    size_origin += mp4lib.fields.FIELD_BIT24.getLength();
    size_origin += mp4lib.fields.FIELD_UINT8.getLength();
    size_origin += mp4lib.fields.FIELD_UINT8.getLength() * 16;

    return size_origin;
};

mp4lib.boxes.TrackEncryptionBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.default_IsEncrypted = this._readData(data,mp4lib.fields.FIELD_BIT24);
    this.default_IV_size = this._readData(data,mp4lib.fields.FIELD_UINT8);

    this.default_KID = this._readArrayFieldData(data,mp4lib.fields.FIELD_UINT8,16);
};

mp4lib.boxes.TrackEncryptionBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    this._writeData(data,mp4lib.fields.FIELD_BIT24,this.default_IsEncrypted);
    this._writeData(data,mp4lib.fields.FIELD_UINT8,this.default_IV_size);

    for (var i = 0; i < this.default_KID.length; i++) {
        this._writeData(data,mp4lib.fields.FIELD_UINT8,this.default_KID[i]);
    }
};

//------------------------- schm -------------------------------------
mp4lib.boxes.SchemeTypeBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'schm',size);
};

mp4lib.boxes.SchemeTypeBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.SchemeTypeBox.prototype.constructor = mp4lib.boxes.SchemeTypeBox;

mp4lib.boxes.SchemeTypeBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
   
    size_origin += mp4lib.fields.FIELD_UINT32.getLength() * 2;
    if (this.flags & 0x000001) {
        size_origin += mp4lib.fields.FIELD_STRING.getLength(this.scheme_uri);
    }
    return size_origin;
};

mp4lib.boxes.SchemeTypeBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.scheme_type = this._readData(data,mp4lib.fields.FIELD_UINT32);
    this.scheme_version = this._readData(data,mp4lib.fields.FIELD_UINT32);

    if (this.flags & 0x000001){
        this.scheme_uri = this._readData(data,mp4lib.fields.FIELD_STRING);
    }
};

mp4lib.boxes.SchemeTypeBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);

    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.scheme_type);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.scheme_version);

    if (this.flags & 0x000001){
        this._writeData(data,mp4lib.fields.FIELD_STRING,this.scheme_uri);
    }
};

// --------------------------- elst ---------------------------------- 
mp4lib.boxes.EditListBox = function(size) {
    mp4lib.boxes.FullBox.call(this,'elst',size);
};

mp4lib.boxes.EditListBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.EditListBox.prototype.constructor = mp4lib.boxes.EditListBox;

mp4lib.boxes.EditListBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    
    size_origin += mp4lib.fields.FIELD_UINT32.getLength(); //entry_count size

    if (this.version === 1) {
        size_origin += (mp4lib.fields.FIELD_UINT64.getLength() * 2 /*segment_duration and media_time size*/+
                       mp4lib.fields.FIELD_UINT16.getLength() * 2 /*media_rate_integer and media_rate_fraction size)*/) * this.entry_count;
    } else { // version==0
        size_origin += (mp4lib.fields.FIELD_UINT32.getLength() * 2 /*segment_duration and media_time size*/+
                       mp4lib.fields.FIELD_UINT16.getLength() * 2 /*media_rate_integer and media_rate_fraction size)*/) * this.entry_count;
    }

    return size_origin;
};

mp4lib.boxes.EditListBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);

    this.entry_count = this._readData(data,mp4lib.fields.FIELD_UINT32);

    this.entries = [];

    for (var i = 0; i < this.entry_count; i++) {
        var struct = {};
        if (this.version === 1){
            struct.segment_duration = this._readData(data,mp4lib.fields.FIELD_UINT64);
            struct.media_time = this._readData(data,mp4lib.fields.FIELD_UINT64);
        } else { // version==0
            struct.segment_duration = this._readData(data,mp4lib.fields.FIELD_UINT32);
            struct.media_time = this._readData(data,mp4lib.fields.FIELD_UINT32);
        }
        struct.media_rate_integer = this._readData(data,mp4lib.fields.FIELD_UINT16);
        struct.media_rate_fraction = this._readData(data,mp4lib.fields.FIELD_UINT16);

        this.entries.push(struct);
    }
};

mp4lib.boxes.EditListBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry_count);
    
    for (var i = 0; i < this.entry_count; i++) {

        if (this.version === 1){
            this._writeData(data,mp4lib.fields.FIELD_UINT64, this.entries[i].segment_duration);
            this._writeData(data,mp4lib.fields.FIELD_UINT64, this.entries[i].media_time);
        } else { // version==0
            this._writeData(data,mp4lib.fields.FIELD_UINT32, this.entries[i].segment_duration);
            this._writeData(data,mp4lib.fields.FIELD_UINT32, this.entries[i].media_time);
        }

        this._writeData(data,mp4lib.fields.FIELD_UINT16,this.entries[i].media_rate_integer);
        this._writeData(data,mp4lib.fields.FIELD_UINT16,this.entries[i].media_rate_fraction);
    }
};

// --------------------------- hmhd ----------------------------------
mp4lib.boxes.HintMediaHeaderBox = function(size) {
    mp4lib.boxes.FullBox.call(this,'hmhd',size);
};

mp4lib.boxes.HintMediaHeaderBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.HintMediaHeaderBox.prototype.constructor = mp4lib.boxes.HintMediaHeaderBox;

mp4lib.boxes.HintMediaHeaderBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT16.getLength() * 2; //maxPDUsize and avgPDUsize size
    size_origin += mp4lib.fields.FIELD_UINT32.getLength() * 3; //maxbitrate, avgbitrate and reserved size
    return size_origin;
};

mp4lib.boxes.HintMediaHeaderBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.maxPDUsize = this._readData(data,mp4lib.fields.FIELD_UINT16);
    this.avgPDUsize = this._readData(data,mp4lib.fields.FIELD_UINT16);
    this.maxbitrate = this._readData(data,mp4lib.fields.FIELD_UINT32);
    this.avgbitrate = this._readData(data,mp4lib.fields.FIELD_UINT32);
    this.reserved = this._readData(data,mp4lib.fields.FIELD_UINT32);
};

mp4lib.boxes.HintMediaHeaderBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
  
    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.maxPDUsize);
    this._writeData(data,mp4lib.fields.FIELD_UINT16,this.avgPDUsize);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.maxbitrate);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.avgbitrate);
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.reserved);
};

// --------------------------- nmhd ---------------------------------- 
mp4lib.boxes.NullMediaHeaderBox = function(size) {
    mp4lib.boxes.FullBox.call(this,'nmhd',size);
};

mp4lib.boxes.NullMediaHeaderBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.NullMediaHeaderBox.prototype.constructor = mp4lib.boxes.NullMediaHeaderBox;

// --------------------------- ctts ---------------------------------- 
mp4lib.boxes.CompositionOffsetBox = function(size) {
    mp4lib.boxes.FullBox.call(this,'ctts',size);
};

mp4lib.boxes.CompositionOffsetBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.CompositionOffsetBox.prototype.constructor = mp4lib.boxes.CompositionOffsetBox;

mp4lib.boxes.CompositionOffsetBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT32.getLength(); //entry_count size

    if (this.version === 0) {
        size_origin += (mp4lib.fields.FIELD_UINT32.getLength() * 2 /*sample_count and sample_offset size*/) * this.entry_count;
    } else { // version===1
        size_origin += (mp4lib.fields.FIELD_UINT32.getLength() /*sample_count size*/ + mp4lib.fields.FIELD_INT32.getLength()
                        /*sample_offset size*/) * this.entry_count;
    }

    return size_origin;
};

mp4lib.boxes.CompositionOffsetBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.entry_count = this._readData(data,mp4lib.fields.FIELD_UINT32);

    this.entries = [];

    for (var i = 0; i < this.entry_count; i++) {
        var struct = {};

        if (this.version === 0){
            struct.sample_count = this._readData(data,mp4lib.fields.FIELD_UINT32);
            struct.sample_offset = this._readData(data,mp4lib.fields.FIELD_UINT32);
        } else { // version==1
            struct.sample_count = this._readData(data,mp4lib.fields.FIELD_UINT32);
            struct.sample_offset = this._readData(data,mp4lib.fields.FIELD_INT32);
        }
        this.entries.push(struct);
    }
};

mp4lib.boxes.CompositionOffsetBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry_count);

    for (var i = 0; i < this.entry_count; i++) {
        if (this.version === 0){
            this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entries[i].sample_count);
            this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entries[i].sample_offset);
        } else { // version==1
            this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entries[i].sample_count);
            this._writeData(data,mp4lib.fields.FIELD_INT32,this.entries[i].sample_offset);
        }
    }
};

// --------------------------- cslg ----------------------------------
mp4lib.boxes.CompositionToDecodeBox = function(size) {
    mp4lib.boxes.FullBox.call(this,'cslg',size);
};

mp4lib.boxes.CompositionToDecodeBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.CompositionToDecodeBox.prototype.constructor = mp4lib.boxes.CompositionToDecodeBox;

mp4lib.boxes.CompositionToDecodeBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_INT32.getLength() * 5;
    return size_origin;
};

mp4lib.boxes.CompositionToDecodeBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.compositionToDTSShift = this._readData(data,mp4lib.fields.FIELD_INT32);
    this.leastDecodeToDisplayDelta = this._readData(data,mp4lib.fields.FIELD_INT32);
    this.greatestDecodeToDisplayDelta = this._readData(data,mp4lib.fields.FIELD_INT32);
    this.compositionStartTime = this._readData(data,mp4lib.fields.FIELD_INT32);
    this.compositionEndTime = this._readData(data,mp4lib.fields.FIELD_INT32);
};

mp4lib.boxes.CompositionToDecodeBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);

    this._writeData(data,mp4lib.fields.FIELD_INT32,this.compositionToDTSShift);
    this._writeData(data,mp4lib.fields.FIELD_INT32,this.leastDecodeToDisplayDelta);
    this._writeData(data,mp4lib.fields.FIELD_INT32,this.greatestDecodeToDisplayDelta);
    this._writeData(data,mp4lib.fields.FIELD_INT32,this.compositionStartTime);
    this._writeData(data,mp4lib.fields.FIELD_INT32,this.compositionEndTime);
};

// --------------------------- stss ----------------------------------
mp4lib.boxes.SyncSampleBox = function(size) {
    mp4lib.boxes.FullBox.call(this,'stss',size);
};

mp4lib.boxes.SyncSampleBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.SyncSampleBox.prototype.constructor = mp4lib.boxes.SyncSampleBox;

mp4lib.boxes.SyncSampleBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT32.getLength(); //entry_count size
    size_origin += mp4lib.fields.FIELD_UINT32.getLength() * this.entry_count; //entries size
    return size_origin;
};

mp4lib.boxes.SyncSampleBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    this.entry_count = this._readData(data,mp4lib.fields.FIELD_UINT32);

    this.entries = [];

    for (var i = 0; i < this.entry_count; i++) {
        var struct = {};
        struct.sample_number = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.entries.push(struct);
    }
};

mp4lib.boxes.SyncSampleBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry_count);

    for (var i = 0; i < this.entry_count; i++) {
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entries[i].sample_number);
    }
};

// --------------------------- tref ----------------------------------
mp4lib.boxes.TrackReferenceBox = function(size) {
    mp4lib.boxes.FullBox.call(this,'tref',size);
};

mp4lib.boxes.TrackReferenceBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.TrackReferenceBox.prototype.constructor = mp4lib.boxes.TrackReferenceBox;

mp4lib.boxes.TrackReferenceBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT32.getLength() * this.track_IDs.length;
    return size_origin;
};

mp4lib.boxes.TrackReferenceBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    this.track_IDs = this._readArrayData(data,mp4lib.fields.FIELD_UINT32);
};

mp4lib.boxes.TrackReferenceBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    for(var i=0;i<this.track_IDs.length;i++) {
       this._writeData(data,mp4lib.fields.FIELD_UINT32, this.track_IDs[i]);
    }
};

//---------------------------- frma ----------------------------------
mp4lib.boxes.OriginalFormatBox=function(size) {
    mp4lib.boxes.Box.call(this,'frma',size);
};

mp4lib.boxes.OriginalFormatBox.prototype = Object.create(mp4lib.boxes.Box.prototype);
mp4lib.boxes.OriginalFormatBox.prototype.constructor = mp4lib.boxes.OriginalFormatBox;

mp4lib.boxes.OriginalFormatBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.Box.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT32.getLength();
    return size_origin;
};

mp4lib.boxes.OriginalFormatBox.prototype.read = function (data,pos,end) {
    this.localPos = pos;
    this.localEnd = end;
    this.data_format = this._readData(data,mp4lib.fields.FIELD_UINT32);
};

mp4lib.boxes.OriginalFormatBox.prototype.write = function (data,pos) {
    mp4lib.boxes.Box.prototype.write.call(this,data,pos);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.data_format);
};

// -------------------------------------------------------------------
// Microsoft Smooth Streaming specific boxes
// -------------------------------------------------------------------

// --------------------------- piff ----------------------------------
//PIFF Sample Encryption box
mp4lib.boxes.PiffSampleEncryptionBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'sepiff',size,[0xA2, 0x39, 0x4F, 0x52, 0x5A, 0x9B, 0x4F, 0x14, 0xA2, 0x44, 0x6C, 0x42, 0x7C, 0x64, 0x8D, 0xF4]);
};

mp4lib.boxes.PiffSampleEncryptionBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.PiffSampleEncryptionBox.prototype.constructor = mp4lib.boxes.PiffSampleEncryptionBox;

mp4lib.boxes.PiffSampleEncryptionBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this), i = 0, j = 0;

    size_origin += mp4lib.fields.FIELD_UINT32.getLength(); //sample_count size
    
    if (this.flags & 1){
        size_origin += mp4lib.fields.FIELD_UINT8.getLength(); //IV_size size
    }

    for (i = 0; i <  this.sample_count; i++) {
        size_origin += 8; // InitializationVector size
        if (this.flags & 2){
            size_origin += mp4lib.fields.FIELD_UINT16.getLength(); // NumberOfEntries size
            for (j = 0; j <  this.entry[i].NumberOfEntries; j++) {
                size_origin += mp4lib.fields.FIELD_UINT16.getLength(); //BytesOfClearData size
                size_origin += mp4lib.fields.FIELD_UINT32.getLength(); //BytesOfEncryptedData size
            }
        }
    }

    return size_origin;
};

mp4lib.boxes.PiffSampleEncryptionBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT32,this.sample_count);

    if (this.flags & 1){
        this._writeData(data,mp4lib.fields.FIELD_UINT8,this.IV_size);
    }
    
    for (var i = 0; i < this.sample_count; i++){
        data.set(this.entry[i].InitializationVector,this.localPos);
        this.localPos += 8;//InitializationVector size

        if (this.flags & 2){
            this._writeData(data,mp4lib.fields.FIELD_UINT16,this.entry[i].NumberOfEntries);// NumberOfEntries

            for (var j = 0; j <  this.entry[i].NumberOfEntries; j++) {
                this._writeData(data,mp4lib.fields.FIELD_UINT16,this.entry[i].clearAndCryptedData[j].BytesOfClearData); //BytesOfClearData 
                this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry[i].clearAndCryptedData[j].BytesOfEncryptedData); //BytesOfEncryptedData size
            }
        }
    }
};

mp4lib.boxes.PiffSampleEncryptionBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);

    this.sample_count = this._readData(data,mp4lib.fields.FIELD_UINT32);

    if (this.flags & 1){
        this.IV_size = this._readData(data,mp4lib.fields.FIELD_UINT8);
    }

    this.entry = [];

    for (var i = 0; i < this.sample_count; i++){
        var struct = {};
        struct.InitializationVector = data.subarray(this.localPos,this.localPos+8);
        this.localPos += 8;//InitializationVector size

        if (this.flags & 2){
            struct.NumberOfEntries = this._readData(data,mp4lib.fields.FIELD_UINT16);// NumberOfEntries
            struct.clearAndCryptedData = [];
            for (var j = 0; j <  struct.NumberOfEntries; j++) {
                var clearAndCryptedStruct = {};
                clearAndCryptedStruct.BytesOfClearData  = this._readData(data,mp4lib.fields.FIELD_UINT16); //BytesOfClearData 
                clearAndCryptedStruct.BytesOfEncryptedData = this._readData(data,mp4lib.fields.FIELD_UINT32); //BytesOfEncryptedData size
                struct.clearAndCryptedData.push(clearAndCryptedStruct);
            }
        }
        this.entry.push(struct);
    }
};

//PIFF Track Encryption Box
mp4lib.boxes.PiffTrackEncryptionBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'tepiff',size,[0x89, 0x74, 0xDB, 0xCE, 0x7B, 0xE7, 0x4C, 0x51, 0x84, 0xF9, 0x71, 0x48, 0xF9, 0x88, 0x25, 0x54]);
};

mp4lib.boxes.PiffTrackEncryptionBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.PiffTrackEncryptionBox.prototype.constructor = mp4lib.boxes.PiffTrackEncryptionBox;

//PIFF Protection System Specific Header Box
mp4lib.boxes.PiffProtectionSystemSpecificHeaderBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'psshpiff',size,[0xD0, 0x8A, 0x4F, 0x18, 0x10, 0xF3, 0x4A, 0x82, 0xB6, 0xC8, 0x32, 0xD8, 0xAB, 0xA1, 0x83, 0xD3]);
};

mp4lib.boxes.PiffProtectionSystemSpecificHeaderBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.PiffProtectionSystemSpecificHeaderBox.prototype.constructor = mp4lib.boxes.PiffProtectionSystemSpecificHeaderBox;

// --------------------------- tfdx -----------------------------
mp4lib.boxes.TfxdBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'tfxd',size,[0x6D, 0x1D, 0x9B, 0x05, 0x42, 0xD5, 0x44, 0xE6, 0x80, 0xE2, 0x14, 0x1D, 0xAF, 0xF7, 0x57, 0xB2]);
};

mp4lib.boxes.TfxdBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.TfxdBox.prototype.constructor = mp4lib.boxes.TfxdBox;

mp4lib.boxes.TfxdBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
   
    if (this.version === 1){
        size_origin += mp4lib.fields.FIELD_UINT64.getLength() * 2;
    }
    else {
        size_origin += mp4lib.fields.FIELD_UINT32.getLength() * 2;
    }

    return size_origin;
};

mp4lib.boxes.TfxdBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    if (this.version === 1){
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.fragment_absolute_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT64,this.fragment_duration);
    }
    else {
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.fragment_absolute_time);
        this._writeData(data,mp4lib.fields.FIELD_UINT32,this.fragment_duration);
    }
};

mp4lib.boxes.TfxdBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
    
    if (this.version === 1){
        this.fragment_absolute_time = this._readData(data,mp4lib.fields.FIELD_UINT64);
        this.fragment_duration = this._readData(data,mp4lib.fields.FIELD_UINT64);
    }
    else {
        this.fragment_absolute_time = this._readData(data,mp4lib.fields.FIELD_UINT32);
        this.fragment_duration = this._readData(data,mp4lib.fields.FIELD_UINT32);
    }
};

// --------------------------- tfrf -----------------------------
mp4lib.boxes.TfrfBox=function(size) {
    mp4lib.boxes.FullBox.call(this,'tfrf',size,[0xD4, 0x80, 0x7E, 0xF2, 0xCA, 0x39, 0x46, 0x95, 0x8E, 0x54, 0x26, 0xCB, 0x9E, 0x46, 0xA7, 0x9F]);
};

mp4lib.boxes.TfrfBox.prototype = Object.create(mp4lib.boxes.FullBox.prototype);
mp4lib.boxes.TfrfBox.prototype.constructor = mp4lib.boxes.TfrfBox;

mp4lib.boxes.TfrfBox.prototype.getLength = function() {
    var size_origin = mp4lib.boxes.FullBox.prototype.getLength.call(this);
    size_origin += mp4lib.fields.FIELD_UINT8.getLength(); //fragment_count size

    if (this.version === 1) {
        size_origin += (mp4lib.fields.FIELD_UINT64.getLength() * 2 /*fragment_absolute_time and fragment_duration size*/) * this.fragment_count;
    }
    else {
        size_origin += (mp4lib.fields.FIELD_UINT32.getLength() * 2 /*fragment_absolute_time and fragment_duration size*/) * this.fragment_count;
    }

    return size_origin;
};

mp4lib.boxes.TfrfBox.prototype.write = function (data,pos) {
    mp4lib.boxes.FullBox.prototype.write.call(this,data,pos);
    
    this._writeData(data,mp4lib.fields.FIELD_UINT8,this.fragment_count);
    
    for (var i = 0; i < this.fragment_count; i++){
        if (this.version === 1) {
            this._writeData(data,mp4lib.fields.FIELD_UINT64,this.entry[i].fragment_absolute_time);
            this._writeData(data,mp4lib.fields.FIELD_UINT64,this.entry[i].fragment_duration);
        }
        else {
            this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry[i].fragment_absolute_time);
            this._writeData(data,mp4lib.fields.FIELD_UINT32,this.entry[i].fragment_duration);
        }
    }
};

mp4lib.boxes.TfrfBox.prototype.read = function (data,pos,end) {
    mp4lib.boxes.FullBox.prototype.read.call(this,data,pos,end);
      
    this.fragment_count = this._readData(data,mp4lib.fields.FIELD_UINT8);

    this.entry = [];

    for (var i = 0; i < this.fragment_count; i++){
        var struct = {};

        if (this.version === 1) {
            struct.fragment_absolute_time = this._readData(data,mp4lib.fields.FIELD_UINT64);
            struct.fragment_duration = this._readData(data,mp4lib.fields.FIELD_UINT64);
        }
        else {
            struct.fragment_absolute_time = this._readData(data,mp4lib.fields.FIELD_UINT32);
            struct.fragment_duration = this._readData(data,mp4lib.fields.FIELD_UINT32);
        }

        this.entry.push(struct);
    }
};

mp4lib.registerTypeBoxes();
mp4lib.registerExtendedTypeBoxes();