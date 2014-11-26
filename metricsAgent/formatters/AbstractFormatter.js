AbstractFormatter=function(database) {
	this.database = database;
};

AbstractFormatter.prototype.init = function() {
	this.firstAccess = true;
	this.msgnbr = 0;
};

AbstractFormatter.prototype.generateSessionId = function(paramSeparator) {
	return new Date().getTime()+paramSeparator+String(Math.random()).substring(2);
};

AbstractFormatter.prototype.formatPlayingObject = function() {
	var Playing = this.database.getCountState('playing');
	return Playing;
};

AbstractFormatter.prototype.formatBufferingObject = function() {
	var Buffering = this.database.getCountState('buffering');
	return Buffering;
};

AbstractFormatter.prototype.formatPausedObject = function() {
	var Paused = this.database.getCountState('paused');
	return Paused;
};

AbstractFormatter.prototype.formatStoppedObject = function() {
	var Paused = this.database.getCountState('stopped');
	return Paused;
};

AbstractFormatter.prototype.formatSeekingObject = function() {
	var Seeking = this.database.getCountState('seeking');
	return Seeking;
};

AbstractFormatter.prototype.isVideo = function(metric) {
	return (metric.contentType === 'video');
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