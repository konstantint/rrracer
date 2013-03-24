// Code necessary for interfacing with SoundSensor.swf

function thisMovie(movieName) {
	if (navigator.appName.indexOf("Microsoft") != -1) {
		return window[movieName];
	} else {
		return document[movieName];
	}
}

function getSoundSensor() {
	return thisMovie("SoundSensor");
}

function getPitch() {
	if (getSoundSensor().getPitch) {
		return getSoundSensor().getPitch();
	}
	else return -1;
}

function setCutoffLevel(newLevel) {
	if (getSoundSensor().setCutoffLevel) {
		getSoundSensor().setCutoffLevel(newLevel);
	}
	else console.log("setCutoffLevel interface not found!");
}

function hideFlashOverlay() {
	document.getElementById("flashOverlay").style.display = 'none';
	document.getElementById("SoundSensor").style.left = -300;
	setTimeout(function() { document.body.tabIndex = 0; document.body.focus();}, 300);
}