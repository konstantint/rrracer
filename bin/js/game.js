//=========================================================================
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
//=========================================================================
if (!window.requestAnimationFrame) { 
  window.requestAnimationFrame = window.webkitRequestAnimationFrame || 
                                 window.mozRequestAnimationFrame    || 
                                 window.oRequestAnimationFrame      || 
                                 window.msRequestAnimationFrame     || 
                                 function(callback, element) {
                                   window.setTimeout(callback, 1000 / 60);
                                 }
}

/**
 * Scene-based game looping class.
 * There should only be one instance per document.
 */
function GameDirector(canvas, fps) {
	var self = this;
	this.canvas = canvas || Dom.get('canvas');
	this.ctx  = this.canvas.getContext('2d');
	this.fps = fps || 60;
	
	this.switchToScene = function(newScene) {
		if (this.scene) this.scene.exit(this);
		this.scene = newScene;
		if (this.scene) this.scene.enter(this);
	}
	
	this.run = function(scene) {
		var now = Util.timestamp();
		var last = Util.timestamp();
		var step = 1/this.fps;
		var dt = 0;
		var gdt = 0;
		
		this.switchToScene(scene);
		
		function animationLoop() {
			now = Util.timestamp();
			dt  = Math.min(1, (now - last) / 1000);
			gdt = gdt + dt;
			while (gdt > step) {
			  gdt = gdt - step;
			  if (self.scene) self.scene.update(step);
			}
			if (self.scene) self.scene.render(self.ctx);
			last = now;
			requestAnimationFrame(animationLoop, self.canvas);
		}
		animationLoop();
	}

    Dom.on(document, 'keydown', function(ev) { if (self.scene) scene.keyDown(ev.keyCode); } );
    Dom.on(document, 'keyup',   function(ev) { if (self.scene) scene.keyUp(ev.keyCode);   } );	
}
