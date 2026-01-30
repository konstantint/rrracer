/**
 * Copyright 2013, Konstantin Tretyakov. http://rrracer.com/
 */

function getHiscores() {
	if (!Dom.storage.hiscore) return [[], [], []];
	else {
		try {
			return JSON.parse(Dom.storage.hiscore) || [[], [], []];
		}
		catch(err) {
			return [[], [], []];
		}
	}
}
function setHiscores(scores) {
	Dom.storage.hiscore = JSON.stringify(scores);
}

function HiscoreScreen() {
	this.update = function(dt) {	
	}
	this.render = function(ctx) {
	}
	this.enter = function(director) {
		var scores = getHiscores();
		
		for (var i = 0; i < 3; i++) {
			var tbl = $("#hiscore_" + i);
			tbl.html("");
			for (var j = 0; j < scores[i].length; j++) {
				var el = $("<tr/>");
				var el2 = $("<td/>");
				el2.html(scores[i][j][0].toFixed(2));
				var el3 = $("<td/>");
				el3.html(scores[i][j][1]);
				el.append(el2);
				el.append(el3);
				tbl.append(el);
			}
		}
		Dom.get("hiscore_screen").style.display = "block";
		Dom.get("ok_hiscore").focus();
	}
	this.exit = function(director) {
		Dom.get("hiscore_screen").style.display = "none";
		Dom.get("canvas").focus();
	}
	this.resetHiscore = function() {
		if (confirm("Reset all high scores?")) {
			setHiscores([[], [], []]);
			this.enter();
		}
	}
}
