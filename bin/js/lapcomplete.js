function LapCompleteScreen(trackId, time) {
	var haveHiscore = false;
	this.update = function(dt) {	
	}
	this.render = function(ctx) {
	}
	
	function formatTime(time) {
		return time.toFixed(2);
	}
	
	this.enter = function(director) {
		// Check for hiscore
		var scores = getHiscores();
		
		// Check whether the time we got is better than something in the list.
		if (scores[trackId].length < 10) haveHiscore = true;
		else {
			for (var i = 0; i < scores[trackId].length; i++) {
				if (scores[trackId][i][0] >= time) {
					haveHiscore = true;
					break;
				}
			}
		}
		
		$("#lap_time").html(formatTime(time));
		Dom.get("hiscore_register").style.display = haveHiscore ? "block" : "none";
		Dom.get("lap_complete_screen").style.display = "block";
		if (haveHiscore) Dom.get("player_name").focus();
		else Dom.get("ok_lap").focus();
	}
	
	this.exit = function(director) {
		Dom.get("lap_complete_screen").style.display = "none";
		Dom.get("canvas").focus();
	}
	this.ok = function(evt) {
		// OK button clicked
		// Did we register for highscores?
		if (haveHiscore) {
			// save high scores
			var scores = getHiscores();
			var trackScores = scores[trackId];
			trackScores.push([time, $("#player_name").val()])
			trackScores.sort(function(a, b) { return a[0] - b[0]; });
			trackScores.slice(0,10);
			scores[trackId] = trackScores;
			setHiscores(scores);
		}
		window.DIRECTOR.switchToScene(new HiscoreScreen());
	}
	this.playerNameKeypress = function(evt) {
		if (evt.keyCode == KEY.ENTER) this.ok();
	}
}
