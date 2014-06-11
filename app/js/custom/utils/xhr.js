Custom.utils.getXMLHttpRequest = function() {
	var xhr = null;
	
	if (window.XMLHttpRequest || window.ActiveXObject) {
		try {
			xhr = new XMLHttpRequest();
		} catch (e) {
			try {
				xhr = new ActiveXObject("Msxml2.XMLHTTP");
			} catch(e) {
				xhr = new ActiveXObject("Microsoft.XMLHTTP");
			}
		}
	} else {
		alert("Votre navigateur ne supporte pas l'objet XMLHTTPRequest...");
		return null;
	}
	
	return xhr;
};


Custom.utils.doRequestWithPromise = function (url, callback, argumentsToForward) {
	var deferred = Q.defer();
	var xhr = Custom.utils.getXMLHttpRequest();
	
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 0)) {
			callback(deferred,xhr.response,argumentsToForward);
		}
	};
	xhr.open("GET", url, true);
	xhr.send(null);
	return deferred.promise;
};
