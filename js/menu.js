/**
 * Copyright 2013, Konstantin Tretyakov. http://rrracer.com/
 */

function MenuConfigItem(x, y, h, title, value, sound, action) {
	this.title = title;
	this.value = value;
	this.selected = false;
	this.flasher = 0;
	this.render = function(ctx) {
		ctx.fillStyle = this.selected && this.flasher ? "red" : "black";
		this.flasher = 1-this.flasher;
		ctx.font = "bold 24px Arial";
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText(this.title, x, y);
		ctx.fillText(this.value, x + 180, y);
	}
	this.actionSound = function() {
		if (sound) {
			sound.pause();
			sound.currentTime = 0;
			sound.play();
		}		
	}
	this.hitTest = function(coords) {
		return ((y < coords.y) &&  (coords.y <= y + h));
	}
	this.action = action;
}

function MenuItem(x, y, h, title, sound, action, font) {
	this.title = title;
	this.selected = false;
	this.flasher = 0;
	this.render = function(ctx) {
		ctx.fillStyle = this.selected && this.flasher ? "red" : "black";
		this.flasher = 1-this.flasher;
		ctx.font = font || "bold 24px Arial";
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText(this.title, x, y);
	}
	this.actionSound = function() {
		if (sound) {
			sound.pause();
			sound.currentTime = 0;
			sound.play();
		}
	}
	this.action = action;
	this.hitTest = function(coords) {
		return (y < coords.y &&  coords.y <= y + h);
	}	
}

function MenuScreen(width, height, dingId, clickId, starterId) {
	// Sounds
	var dingId = dingId || "ding";
	var clickId = clickId || "click";
	var starterId = starterId || "starter";
	var ding = Dom.get(dingId);
	var click = Dom.get(clickId);
	var starter = Dom.get(starterId);
	var haveKeyDown = false;
	
	var background;
	var trackId = 0;
	var trackNames = ['Short', 'Medium', 'Long'];
	
	var voiceId = 0;
	var voiceNames = ['Low', 'Medium', 'High'];

	var micSensitivity = 1;
	var micSensitivities = ['Low', 'Normal', 'High'];
	var micSensitivityLevels = [-40, -60, -100];
	setCutoffLevel(micSensitivityLevels[micSensitivity]);
	
	// Create menu items
	var menuItems = [];
	var mtop = 200;
	var mleft = 180;
	var mheight = 36;
	menuItems.push(new MenuItem(mleft + 70, mtop, mheight + 10, 'PLAY!', starter, function() {
		// Create new jracer scene
		var jracerScene = new JRacerScene(trackId, voiceId);
		jracerScene.setImages(window.IMAGES[0], window.IMAGES[1]);
		window.DIRECTOR.pushScene(jracerScene);
		},
		"bold 30px Arial"));
	mtop += mheight + 10;
	menuItems.push(new MenuConfigItem(mleft, mtop, mheight, 'Track:', 'Short', click, function() {
			trackId = (trackId + 1) % trackNames.length;
			this.value = trackNames[trackId];
		}));
	mtop += mheight;
	menuItems.push(new MenuConfigItem(mleft, mtop, mheight, 'Voice:', 'Low', click, function() {
			voiceId = (voiceId + 1) % voiceNames.length;
			this.value = voiceNames[voiceId];
		}));
	menuItems[menuItems.length-1].actionSound = function() {
		var s;
		var v = "v" + ((voiceId + 1) % voiceNames.length);
		for (var i = 0; i < 3; i++) {
			s = Dom.get("v" + i);
			if (s.pause) s.pause();
		}
		
		s = Dom.get(v);
		if (s) {
			s.pause();
			s.currentTime = 0;
			s.play();
		}
	}
	
	mtop += mheight;
	menuItems.push(new MenuConfigItem(mleft, mtop, mheight, 'Full screen:', 'Off', click, function() {
			$(document).toggleFullScreen();
			var self = this;
			setTimeout(function() {
				self.value = $(document).fullScreen() ? "On" : "Off";
			}, 200);
		}));
	mtop += mheight;
	menuItems.push(new MenuConfigItem(mleft, mtop, mheight, 'Mic sensitivity:', 'Normal', click, function() {
			micSensitivity = (micSensitivity + 1) % micSensitivities.length;
			this.value = micSensitivities[micSensitivity];
			setCutoffLevel(micSensitivityLevels[micSensitivity]);
		}));
	mtop += mheight;
	menuItems.push(new MenuItem(mleft, mtop, mheight, 'High scores', click, function() {
			window.DIRECTOR.pushScene(new HiscoreScreen());
		}));
	mtop += mheight;
	menuItems.push(new MenuItem(mleft, mtop, mheight, 'Help', click, function() {
			window.DIRECTOR.pushScene(new HelpScreen());
		}));
	
	var selectedItem = 0;
	menuItems[selectedItem].selected = true;
	
	this.setImages = function(bg) {
		background = bg;
	}
	
	this.update = function(dt) {
	}
	
	this.render = function(ctx) {
		// Background
		ctx.clearRect(0, 0, width, height);
		ctx.drawImage(background, 0, 0, background.width, background.height, 0, 0, width, height);
		for (var i = 0; i < menuItems.length; i++) menuItems[i].render(ctx);
	}
	
	this.enter = function(director) {
		director.canvas.width  = width;
		director.canvas.height = height;
	}
	this.exit = function(director) {
	}
	this.keyDown = function(key) {
		haveKeyDown = true;
	}
	this.keyUp = function(key) {
		if (!haveKeyDown) return;
		haveKeyDown = false;
		var d = 0;
		switch(key) {
			case KEY.DOWN:
				d = 1;
				break;
			case KEY.UP:
				d = -1;
				break;
			case KEY.LEFT:
			case KEY.RIGHT:
				if (menuItems[selectedItem] instanceof MenuConfigItem) {
					menuItems[selectedItem].actionSound();
					menuItems[selectedItem].action();
				}
				break;
			case KEY.ENTER:
				menuItems[selectedItem].actionSound();
				menuItems[selectedItem].action();
				break;
		}
		if (d != 0) selectNewItem((selectedItem + d + menuItems.length) % menuItems.length);
	}
	
	function selectNewItem(newItemId) {
		menuItems[selectedItem].selected = false		
		menuItems[newItemId].selected = true;
		selectedItem = newItemId;
		click.pause();
		click.currentTime = 0;
		click.play();
	}
	
	this.mouseMove = function(coords) {
		if (menuItems[selectedItem].hitTest(coords)) return;
		else {
			for (var i = 0; i < menuItems.length; i++)
				if (menuItems[i].hitTest(coords)) selectNewItem(i);
		}
	}
	this.click = function(coords) {
		if (!menuItems[selectedItem].hitTest(coords)) {
			return;
		}
		else {
			menuItems[selectedItem].actionSound();
			menuItems[selectedItem].action();
		}
	}
	
}

