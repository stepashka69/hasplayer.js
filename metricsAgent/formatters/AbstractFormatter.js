AbstractFormatter=function(database) {
	this.database = database;
};

AbstractFormatter.prototype.init = function() {
	this.firstAccess = true;
	this.msgnbr = 0;
};

AbstractFormatter.prototype.formatPlayingObject = function() {
	if(!this.database) {
		return {};
	}

	var Playing = this.database.getCountState('playing');
	return Playing;
};

AbstractFormatter.prototype.formatBufferingObject = function() {
	if(!this.database) {
		return {};
	}

	var Buffering = this.database.getCountState('buffering');
	return Buffering;
};

AbstractFormatter.prototype.formatPausedObject = function() {
	if(!this.database) {
		return {};
	}

	var Paused = this.database.getCountState('paused');
	return Paused;
};

AbstractFormatter.prototype.formatStoppedObject = function() {
	if(!this.database) {
		return {};
	}
	var Paused = this.database.getCountState('stopped');
	return Paused;
};

AbstractFormatter.prototype.formatSeekingObject = function() {
	if(!this.database) {
		return {};
	}

	var Seeking = this.database.getCountState('seeking');
	return Seeking;
};

AbstractFormatter.prototype.isExcluded = function(value, array) {
	return array.indexOf(value) > -1;
};

AbstractFormatter.prototype.setFieldValue = function(nameDst, value) {
	if (value !== undefined && value !== null && value !== '' && !this.isExcluded(nameDst, this.excludedList)) {
		// Round numbers to 3 decimals
		if ((typeof value == "number") && isFinite(value) && (value % 1 !== 0)) {
			value = Math.round(value * 1000) / 1000;
		}
		this.data[nameDst] = value;
	}
};