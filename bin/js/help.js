function HelpScreen(width, height) {
	this.update = function(dt) {	
	}
	this.render = function(ctx) {
		ctx.clearRect(0, 0, width, height);
	}
	this.enter = function(director) {
		Dom.get("help_screen").style.display = "block";
		Dom.get("ok_help").focus();
	}
	this.exit = function(director) {
		Dom.get("help_screen").style.display = "none";
		Dom.get("canvas").focus();
	}
}
