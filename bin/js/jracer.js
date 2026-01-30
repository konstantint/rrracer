/**
 * Substantial portions of the code in this file are by Jake Gordon.
 * http://codeincomplete.com/projects/racer/v4.final.html.
 *
 * Modifications by Konstantin Tretyakov.
 */

/**
 * Method for moving cars along track.
 */
function CarAI(maxSpeed, drawDistance) {
	
	// Moves all cars along track
	this.updateCars = function(dt, track, playerSegment, playerX, playerW, playerSpeed) {
	  var n, car, oldSegment, newSegment;
	  for(n = 0 ; n < track.cars.length ; n++) {
		car         = track.cars[n];
		oldSegment  = track.findSegment(car.z);
		car.offset  = car.offset + this.updateCarOffset(car, track, oldSegment, playerSegment, playerX, playerW, playerSpeed);
		car.z       = Util.increase(car.z, dt * car.speed, track.trackLength);
		car.percent = Util.percentRemaining(car.z, track.segmentLength); // useful for interpolation during rendering phase
		newSegment  = track.findSegment(car.z);
		if (oldSegment != newSegment) {
		  index = oldSegment.cars.indexOf(car);
		  oldSegment.cars.splice(index, 1);
		  newSegment.cars.push(car);
		}
	  }
	}

	// "AI" for each car
	this.updateCarOffset = function(car, track, carSegment, playerSegment, playerX, playerW, playerSpeed) {

	  var i, j, dir, segment, otherCar, otherCarW, lookahead = 20, carW = car.sprite.w * SPRITES.SCALE;

	  // optimization, dont bother steering around other cars when 'out of sight' of the player
	  if ((carSegment.index - playerSegment.index) > drawDistance)
		return 0;

	  for(i = 1 ; i < lookahead ; i++) {
		segment = track.segments[(carSegment.index+i)%track.segments.length];

		if ((segment === playerSegment) && (car.speed > playerSpeed) && (Util.overlap(playerX, playerW, car.offset, carW, 1.2))) {
		  if (playerX > 0.5)
			dir = -1;
		  else if (playerX < -0.5)
			dir = 1;
		  else
			dir = (car.offset > playerX) ? 1 : -1;
		  return dir * 1/i * (car.speed-playerSpeed)/maxSpeed; // the closer the cars (smaller i) and the greated the speed ratio, the larger the offset
		}

		for(j = 0 ; j < segment.cars.length ; j++) {
		  otherCar  = segment.cars[j];
		  otherCarW = otherCar.sprite.w * SPRITES.SCALE;
		  if ((car.speed > otherCar.speed) && Util.overlap(car.offset, carW, otherCar.offset, otherCarW, 1.2)) {
			if (otherCar.offset > 0.5)
			  dir = -1;
			else if (otherCar.offset < -0.5)
			  dir = 1;
			else
			  dir = (car.offset > otherCar.offset) ? 1 : -1;
			return dir * 1/i * (car.speed-otherCar.speed)/maxSpeed;
		  }
		}
	  }

	  // if no cars ahead, but I have somehow ended up off road, then steer back on
	  if (car.offset < -0.9)
		return 0.1;
	  else if (car.offset > 0.9)
		return -0.1;
	  else
		return 0;
	}	
}

/**
 * JRacer Track data object.
 * trackId = 0/1/2 (short, medium, long);
 */
function JRacerTrack(trackId, segmentLength, rumbleLength, maxSpeed) {
	var self = this;
	var segments = this.segments = [];	// array of road segments
	var cars = this.cars = [];     // array of cars on the road	
	var trackLength = this.trackLength = null; // z length of entire track (computed)	
	var totalCars = 200; // total number of cars on the road
	this.segmentLength = segmentLength;
	
	this.findSegment = function(z) {
	  return segments[Math.floor(z/segmentLength) % segments.length]; 
	}
	
	//=========================================================================
	// BUILD ROAD GEOMETRY
	//=========================================================================

	function lastY() { return (segments.length == 0) ? 0 : segments[segments.length-1].p2.world.y; }

	function addSegment(curve, y) {
	  var n = segments.length;
	  segments.push({
		  index: n,
			 p1: { world: { y: lastY(), z:  n   *segmentLength }, camera: {}, screen: {} },
			 p2: { world: { y: y,       z: (n+1)*segmentLength }, camera: {}, screen: {} },
		  curve: curve,
		sprites: [],
		   cars: [],
		   color: Math.floor(n/rumbleLength)%2 ? COLORS.DARK : COLORS.LIGHT
		  //color: Math.random() > 0.5 ? COLORS.DARK : COLORS.LIGHT
	  });
	}

	function addSprite(n, sprite, offset) {
		if (n < 0 || n >= segments.length) return;
		segments[n].sprites.push({ source: sprite, offset: offset });
	}

	function addRoad(enter, hold, leave, curve, y) {
	  var startY   = lastY();
	  var endY     = startY + (Util.toInt(y, 0) * segmentLength);
	  var n, total = enter + hold + leave;
	  for(n = 0 ; n < enter ; n++)
		addSegment(Util.easeIn(0, curve, n/enter), Util.easeInOut(startY, endY, n/total));
	  for(n = 0 ; n < hold  ; n++)
		addSegment(curve, Util.easeInOut(startY, endY, (enter+n)/total));
	  for(n = 0 ; n < leave ; n++)
		addSegment(Util.easeInOut(curve, 0, n/leave), Util.easeInOut(startY, endY, (enter+hold+n)/total));
	}

	var ROAD = {
	  LENGTH: { NONE: 0, SHORT:  25, MEDIUM:   50, LONG:  100 },
	  HILL:   { NONE: 0, LOW:    20, MEDIUM:   40, HIGH:   60 },
	  CURVE:  { NONE: 0, EASY:    2, MEDIUM:    4, HARD:    6 }
	};

	function addStraight(num) {
	  num = num || ROAD.LENGTH.MEDIUM;
	  addRoad(num, num, num, 0, 0);
	}

	function addHill(num, height) {
	  num    = num    || ROAD.LENGTH.MEDIUM;
	  height = height || ROAD.HILL.MEDIUM;
	  addRoad(num, num, num, 0, height);
	}

	function addCurve(num, curve, height) {
	  num    = num    || ROAD.LENGTH.MEDIUM;
	  curve  = curve  || ROAD.CURVE.MEDIUM;
	  height = height || ROAD.HILL.NONE;
	  addRoad(num, num, num, curve, height);
	}
		
	function addLowRollingHills(num, height) {
	  num    = num    || ROAD.LENGTH.SHORT;
	  height = height || ROAD.HILL.LOW;
	  addRoad(num, num, num,  0,                height/2);
	  addRoad(num, num, num,  0,               -height);
	  addRoad(num, num, num,  ROAD.CURVE.EASY,  height);
	  addRoad(num, num, num,  0,                0);
	  addRoad(num, num, num, -ROAD.CURVE.EASY,  height/2);
	  addRoad(num, num, num,  0,                0);
	}

	function addSCurves() {
	  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.NONE);
	  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.MEDIUM,  ROAD.HILL.MEDIUM);
	  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.EASY,   -ROAD.HILL.LOW);
	  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.MEDIUM);
	  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.MEDIUM, -ROAD.HILL.MEDIUM);
	}

	function addBumps() {
	  addRoad(10, 10, 10, 0,  5);
	  addRoad(10, 10, 10, 0, -2);
	  addRoad(10, 10, 10, 0, -5);
	  addRoad(10, 10, 10, 0,  8);
	  addRoad(10, 10, 10, 0,  5);
	  addRoad(10, 10, 10, 0, -7);
	  addRoad(10, 10, 10, 0,  5);
	  addRoad(10, 10, 10, 0, -2);
	}

	function addDownhillToEnd(num) {
	  num = num || 200;
	  addRoad(num, num, num, -ROAD.CURVE.EASY, -lastY()/segmentLength);
	}

	function resetRoad(trackId) {
		segments = [];
		if (trackId == 1) makeMediumTrack();
		else if (trackId == 2) makeLongTrack();
		else makeShortTrack();
		
		self.trackLength = segments.length * segmentLength;
		self.segments = segments;

		//segments[findSegment(playerZ).index + 2].color = COLORS.START;  colors 6th and 7th strips white
		//segments[findSegment(playerZ).index + 3].color = COLORS.START;
		for(var n = 0 ; n < rumbleLength ; n++)
		segments[segments.length-1-n].color = COLORS.FINISH;

		resetSprites();
		resetCars();
		self.cars = cars;
	}

	function resetSprites() {
	  var n, i;

	  var billboards = [
		[20,  SPRITES.BILLBOARD07, -1],
		[40,  SPRITES.BILLBOARD06, 1.1],
		[60,  SPRITES.BILLBOARD08, -1],
		[80,  SPRITES.BILLBOARD09, -1],
		[100, SPRITES.BILLBOARD01, -1],
		[120, SPRITES.BILLBOARD02, 1.1],
		[140, SPRITES.BILLBOARD03, 1],
		[160, SPRITES.BILLBOARD04, 1],
		[180, SPRITES.BILLBOARD05, -1],
		[240, SPRITES.BILLBOARD07, -1.2],
		[240, SPRITES.BILLBOARD06,  1.2],
		[segments.length - 25, SPRITES.BILLBOARD07, -1.2],
		[segments.length - 25, SPRITES.BILLBOARD06,  1.2]
		];
	  for (i = 0; i < billboards.length; i++)
		  addSprite(billboards[i][0], billboards[i][1], billboards[i][2]);

	  for(n = 10 ; n < 200 ; n += 4 + Math.floor(n/100)) {
		addSprite(n, SPRITES.PALM_TREE, 0.5 + Math.random()*0.5);
		addSprite(n, SPRITES.PALM_TREE,   1 + Math.random()*2);
	  }

	  /*for(n = 250 ; n < 1000 ; n += 5) {
		addSprite(n,     SPRITES.COLUMN, 1.1);
		addSprite(n + Util.randomInt(0,5), SPRITES.TREE1, -1 - (Math.random() * 2));
		addSprite(n + Util.randomInt(0,5), SPRITES.TREE2, -1 - (Math.random() * 2));
	  }

	  for(n = 200 ; n < segments.length ; n += 3) {
		addSprite(n, Util.randomChoice(SPRITES.PLANTS), Util.randomChoice([1,-1]) * (2 + Math.random() * 5));
	  }*/

	  var side, sprite, offset;
	  for(n = 10 ; n < (segments.length-50) ; n += 30) {
		side      = Util.randomChoice([1, -1]);
		if (Util.randomChoice([0,1]) == 0) 
			addSprite(n + Util.randomInt(0, 50), Util.randomChoice(SPRITES.BILLBOARDS), -side);
		for(i = 0 ; i < 20 ; i++) {
		  sprite = Util.randomChoice(SPRITES.PLANTS);
		  offset = side * (1.5 + Math.random());
		  addSprite(n + Util.randomInt(0, 50), sprite, offset);
		}
		  
	  }

	}

	function resetCars() {
	  cars = [];
	  var n, car, segment, offset, z, sprite, speed;
	  for (var n = 0 ; n < totalCars ; n++) {
		offset = Math.random() * Util.randomChoice([-0.8, 0.8]);
		z      = Math.floor(Math.random() * segments.length) * segmentLength;
		sprite = Util.randomChoice(SPRITES.CARS);
		speed  = maxSpeed/4 + Math.random() * maxSpeed/(sprite == SPRITES.SEMI ? 4 : 2);
		car = { offset: offset, z: z, sprite: sprite, speed: speed };
		segment = self.findSegment(car.z);
		segment.cars.push(car);
		cars.push(car);
	  }
	}
	
	function makeLongTrack() {
		// Original track as defined by Jake Gordon
		addStraight(ROAD.LENGTH.SHORT);
		addLowRollingHills();
		addSCurves();
		addCurve(ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.LOW);
		addBumps();
		addLowRollingHills();
		addCurve(ROAD.LENGTH.LONG*2, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
		//addStraight();
		addHill(ROAD.LENGTH.MEDIUM, ROAD.HILL.HIGH);
		addSCurves();
		//addCurve(ROAD.LENGTH.LONG, -ROAD.CURVE.MEDIUM, ROAD.HILL.NONE);
		//addHill(ROAD.LENGTH.SHORT, ROAD.HILL.HIGH);
		//addCurve(ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM, -ROAD.HILL.LOW);
		addBumps();
		addHill(ROAD.LENGTH.SHORT, -ROAD.HILL.MEDIUM);
		addStraight();
		addSCurves();
		addDownhillToEnd();
		
		totalCars = 150;
	}		

	function makeShortTrack() {
		addStraight(ROAD.LENGTH.SHORT);		
		addCurve(ROAD.LENGTH.SHORT, ROAD.CURVE.MEDIUM, ROAD.HILL.LOW);
		addDownhillToEnd();
		totalCars = 30;
	}
	function makeMediumTrack() {
		addStraight(ROAD.LENGTH.SHORT);		
		addSCurves();
		addBumps();
		addDownhillToEnd();
		totalCars = 60;
	}
	
	function makeMediumTrack2() {
		addStraight(ROAD.LENGTH.SHORT);
		addCurve(ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.LOW);
		addLowRollingHills();
		addBumps();
		addSCurves();
		addCurve(ROAD.LENGTH.MEDIUM, -ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
		addDownhillToEnd();	
		
		totalCars = 100;
	}
		
	resetRoad(trackId);
}

/**
 * Main scene for JRacer
 * @param trackId = 0, 1, 2 [short, medium, long]
 * @param voiceId = 0, 1, 2 [low, medium, high]
 */
function JRacerScene(trackId, voiceId, fps) {
	// Params
	trackId = trackId || 0;
	voiceId = voiceId || 0;
	
	// Images (provided using setImages)
    var background     = null;
    var sprites        = null;
	
	// Dimensions of the canvas (logical)
	var width          = 480;
	var height         = 360;
	var resolution     = height/480;              // scaling factor to provide resolution independence (computed)
	
	// Physics & simulation params
	var centrifugal    = 0.3;                     // centrifugal force multiplier when going around curves
	var offRoadDecel   = 0.99;                    // speed multiplier when off road (e.g. you lose 2% speed each update frame)
	var skySpeed       = 0.001;                   // background sky layer scroll speed when going around curve (or up hill)
	var hillSpeed      = 0.002;                   // background hill layer scroll speed when going around curve (or up hill)
	var treeSpeed      = 0.003;                   // background tree layer scroll speed when going around curve (or up hill)
	var roadWidth      = 2000;                    // actually half the roads width, easier math if the road spans from -roadWidth to +roadWidth
	var rumbleLength   = 3;                       // number of segments per red/white rumble strip
	var segmentLength  = 200;
	var lanes          = 2;                       // number of lanes
	fps = fps || 60;
	var maxSpeed       =  segmentLength*fps;       // top speed (ensure we can't move more than 1 segment in a single frame to make collision detection easier)
	var accel          =  maxSpeed/5;             // acceleration rate - tuned until it 'felt' right
	var breaking       = -maxSpeed;               // deceleration rate when braking
	var decel          = -maxSpeed/5;             // 'natural' deceleration rate when neither accelerating, nor braking
	var offRoadDecel   = -maxSpeed/2;             // off road deceleration is somewhere in between
	var offRoadLimit   =  maxSpeed/4;             // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)
	
	// Render params
	var fieldOfView    = 100;                     // angle (degrees) for field of view
	var cameraHeight   = 1000;                    // z height of camera
	var cameraDepth    = 1 / Math.tan((fieldOfView/2) * Math.PI/180);  // z distance camera is from screen
	var drawDistance   = 300;                     // number of segments to draw
	var fogDensity     = 5;                       // exponential fog density
	
	// State
	var skyOffset      = 0;                       // current sky scroll offset
	var hillOffset     = 0;                       // current hill scroll offset
	var treeOffset     = 0;                       // current tree scroll offset
	var playerX        = 0;                       // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
	var playerZ        = (cameraHeight * cameraDepth);  // player relative z distance from camera
	var position       = 0;                       // current camera Z position (add playerZ to get player's absolute Z position)
	var speed          = 0;                       // current speed
	var currentLapTime = 0;                       // current lap time

	var running = true;
	
	// Track data & state
	var track = new JRacerTrack(trackId, segmentLength, rumbleLength, maxSpeed);
	var ai = new CarAI(maxSpeed, drawDistance);
	
	// Input state
	var humInput = true;
	var keyLeft        = false;
	var keyRight       = false;
	var keyFaster      = false;
	var keySlower      = false;
	var pitch = -1;
	
	var voices = [[100, 200, 30], [200, 400, 50], [300, 600, 70]];
	var minPitch = voices[voiceId][0];
	var maxPitch = voices[voiceId][1];
	var maxPitchError = voices[voiceId][2];
	
	var hud = {
	  speed:            { value: null, dom: Dom.get('speed_value')            },
	  current_lap_time: { value: null, dom: Dom.get('current_lap_time_value') },
	  instructions:     { value: true, dom: Dom.get('instructions')		  }
	}

	//=========================================================================
	// UPDATE THE GAME WORLD
	//=========================================================================

	this.update = function(dt) {
		if (!running) return;
	  var n, car, carW, sprite, spriteW;
	  var playerSegment = track.findSegment(position+playerZ);
	  var playerW       = SPRITES.PLAYER_STRAIGHT.w * SPRITES.SCALE;
	  var speedPercent  = speed/maxSpeed;
	  var dx            = dt * 2 * speedPercent; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second
	  var startPosition = position;

	  ai.updateCars(dt, track, playerSegment, playerX, playerW, speed);

	  position = Util.increase(position, dt * speed, track.trackLength);

	  if (keyLeft)
		playerX = playerX - dx;
	  else if (keyRight)
		playerX = playerX + dx;

	  playerX = playerX - (dx * speedPercent * playerSegment.curve * centrifugal);

	  if (humInput) {
		  pitch = getPitch();
		  if (pitch < minPitch-maxPitchError || pitch > maxPitch+maxPitchError) {
			  speed = Util.accelerate(speed, decel, dt);
		  }
		  else {
			  expectedPitch = speed/maxSpeed*(maxPitch-minPitch) + minPitch;
			  if (Math.abs(pitch - expectedPitch) > maxPitchError) {
				  speed = Util.accelerate(speed, decel, dt);
			  }
			  else if (pitch > expectedPitch){
				  speed = Util.accelerate(speed, accel, dt);
			  }
			  else {
				  speed = Util.accelerate(speed, decel, dt);
			  }
		  }
	  }
	  else {
		  if (keyFaster)
			speed = Util.accelerate(speed, accel, dt);
		  else if (keySlower)
			speed = Util.accelerate(speed, breaking, dt);
		  else
			speed = Util.accelerate(speed, decel, dt);
	  }
	  if (speed > 0) showInstructions(false);

	  if ((playerX < -1) || (playerX > 1)) {

		if (speed > offRoadLimit)
		  speed = Util.accelerate(speed, offRoadDecel, dt);

		for(n = 0 ; n < playerSegment.sprites.length ; n++) {
		  sprite  = playerSegment.sprites[n];
		  spriteW = sprite.source.w * SPRITES.SCALE;
		  if (Util.overlap(playerX, playerW, sprite.offset + spriteW/2 * (sprite.offset > 0 ? 1 : -1), spriteW)) {
			speed = maxSpeed/5;
			position = Util.increase(playerSegment.p1.world.z, -playerZ, track.trackLength); // stop in front of sprite (at front of segment)
			break;
		  }
		}
	  }

	  for(n = 0 ; n < playerSegment.cars.length ; n++) {
		car  = playerSegment.cars[n];
		carW = car.sprite.w * SPRITES.SCALE;
		if (speed > car.speed) {
		  if (Util.overlap(playerX, playerW, car.offset, carW, 0.8)) {
			speed    = car.speed * (car.speed/speed);
			position = Util.increase(car.z, -playerZ, track.trackLength);
			break;
		  }
		}
	  }

	  playerX = Util.limit(playerX, -3, 3);     // dont ever let it go too far out of bounds
	  speed   = Util.limit(speed, 0, maxSpeed); // or exceed maxSpeed

	  skyOffset  = Util.increase(skyOffset,  skySpeed  * playerSegment.curve * (position-startPosition)/segmentLength, 1);
	  hillOffset = Util.increase(hillOffset, hillSpeed * playerSegment.curve * (position-startPosition)/segmentLength, 1);
	  treeOffset = Util.increase(treeOffset, treeSpeed * playerSegment.curve * (position-startPosition)/segmentLength, 1);

	  if (position > playerZ) {
		if (currentLapTime && (startPosition < playerZ)) {
		  lapCompleted(currentLapTime);
		}
		else {
		  currentLapTime += dt;
		}
	  }

	  updateHud('speed',            5 * Math.round(speed/500));
	  updateHud('current_lap_time', formatTime(currentLapTime));
	}

	function lapCompleted(time) {
		window.DIRECTOR.switchToScene(new LapCompleteScreen(trackId, time));
	}
	
	//-------------------------------------------------------------------------

	function updateHud(key, value) { // accessing DOM can be slow, so only do it if value has changed
	  if (hud[key].value !== value) {
		hud[key].value = value;
		Dom.set(hud[key].dom, value);
	  }
	}

	function formatTime(dt) {
	  var minutes = Math.floor(dt/60);
	  var seconds = Math.floor(dt - (minutes * 60));
	  var tenths  = Math.floor(10 * (dt - Math.floor(dt)));
	  if (minutes > 0)
		return minutes + "." + (seconds < 10 ? "0" : "") + seconds + "." + tenths;
	  else
		return seconds + "." + tenths;
	}

	//=========================================================================
	// RENDER THE GAME WORLD
	//=========================================================================

	this.render = function(ctx) {
		if (!running) return;
	  var baseSegment   = track.findSegment(position);
	  var basePercent   = Util.percentRemaining(position, segmentLength);
	  var playerSegment = track.findSegment(position+playerZ);
	  var playerPercent = Util.percentRemaining(position+playerZ, segmentLength);
	  var playerY       = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
	  var maxy          = height;

	  var x  = 0;
	  var dx = - (baseSegment.curve * basePercent);

	  ctx.clearRect(0, 0, width, height);

	  Render.background(ctx, background, width, height, BACKGROUND.SKY,   skyOffset,  0); //resolution * skySpeed  * playerY);
	  Render.background(ctx, background, width, height, BACKGROUND.HILLS, hillOffset, resolution * hillSpeed * playerY);
	  Render.background(ctx, background, width, height, BACKGROUND.TREES, treeOffset, resolution * treeSpeed * playerY);

	  var n, i, segment, car, sprite, spriteScale, spriteX, spriteY;

	  for(n = 0 ; n < drawDistance ; n++) {
		segment        = track.segments[(baseSegment.index + n) % track.segments.length];
		segment.looped = segment.index < baseSegment.index;
		segment.fog    = Util.exponentialFog(n/drawDistance, fogDensity);
		segment.clip   = maxy;

		Util.project(segment.p1, (playerX * roadWidth) - x,      playerY + cameraHeight, position - (segment.looped ? track.trackLength : 0), cameraDepth, width, height, roadWidth);
		Util.project(segment.p2, (playerX * roadWidth) - x - dx, playerY + cameraHeight, position - (segment.looped ? track.trackLength : 0), cameraDepth, width, height, roadWidth);

		x  = x + dx;
		dx = dx + segment.curve;

		if ((segment.p1.camera.z <= cameraDepth)         || // behind us
			(segment.p2.screen.y >= segment.p1.screen.y) || // back face cull
			(segment.p2.screen.y >= maxy))                  // clip by (already rendered) hill
		  continue;

		Render.segment(ctx, width, lanes,
					   segment.p1.screen.x,
					   segment.p1.screen.y,
					   segment.p1.screen.w,
					   segment.p2.screen.x,
					   segment.p2.screen.y,
					   segment.p2.screen.w,
					   segment.fog,
					   segment.color);

		maxy = segment.p1.screen.y;
	  }

	  for(n = (drawDistance-1) ; n > 0 ; n--) {
		segment = track.segments[(baseSegment.index + n) % track.segments.length];
		for(i = 0 ; i < segment.cars.length ; i++) {
		  car         = segment.cars[i];
		  sprite      = car.sprite;
		  spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
		  spriteX     = Util.interpolate(segment.p1.screen.x,     segment.p2.screen.x,     car.percent) + (spriteScale * car.offset * roadWidth * width/2);
		  spriteY     = Util.interpolate(segment.p1.screen.y,     segment.p2.screen.y,     car.percent);
		  Render.sprite(ctx, width, height, resolution, roadWidth, sprites, car.sprite, spriteScale, spriteX, spriteY, -0.5, -1, segment.clip);
		}

		for(i = 0 ; i < segment.sprites.length ; i++) {
		  sprite      = segment.sprites[i];
		  spriteScale = segment.p1.screen.scale;
		  spriteX     = segment.p1.screen.x + (spriteScale * sprite.offset * roadWidth * width/2);
		  spriteY     = segment.p1.screen.y;
		  Render.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite.source, spriteScale, spriteX, spriteY, (sprite.offset < 0 ? -1 : 0), -1, segment.clip);
		}

		if (segment == playerSegment) {
		  Render.player(ctx, width, height, resolution, roadWidth, sprites, speed/maxSpeed,
						cameraDepth/playerZ,
						width/2,
						(height/2) - (cameraDepth/playerZ * Util.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * height/2),
						speed * (keyLeft ? -1 : keyRight ? 1 : 0),
						playerSegment.p2.world.y - playerSegment.p1.world.y);
		}
	  }
	  
	  Render.pitchMeter(ctx, speed/maxSpeed, pitch, minPitch, maxPitch, maxPitchError, width, height);
	}

	function showInstructions(show) {
		if (hud['instructions'].value != show) {
			hud['instructions'].dom.style.display = show ? 'block' : 'none';
			hud['instructions'].value = show;
		}
	}
		
	this.enter = function(director) {
		director.canvas.width  = width;
		director.canvas.height = height;
		Dom.storage.fast_lap_time = Dom.storage.fast_lap_time || 180;
		hud['instructions'].value = false;
		showInstructions(true);
		Dom.get('hud').style.display = 'block';
	}
	
	this.exit = function() {
		showInstructions(false);
		Dom.get('hud').style.display = 'none';
	}
	
	this.setImages = function(background_, sprites_) {
		background = background_;
		sprites = sprites_;
	}
	
	var magicCode = 0;
	
	var keyMap = [
		[KEY.LEFT,  'up', function() { keyLeft = false; }],
		[KEY.RIGHT, 'up', function() {keyRight = false; }],
		[KEY.UP,    'up', function() { keyFaster = false; }],
		[KEY.DOWN,  'up', function() { keySlower = false; }],
		[KEY.LEFT,  'down', function() { keyLeft = true; }],
		[KEY.RIGHT, 'down', function() {keyRight = true; }],
		[KEY.UP,    'down', function() { keyFaster = true; }],
		[KEY.DOWN,  'down', function() { keySlower = true; }],
		[KEY.ESCAPE, 'up', function() { window.DIRECTOR.popScene(JRacerScene); }],
		[KEY.W, 'up', function() { if (magicCode == 0) magicCode = 1; else magicCode = 0; }],
		[KEY.T, 'up', function() { if (magicCode == 1) magicCode = 2; else magicCode = 0; }],
		[KEY.F, 'up', function() { if (magicCode == 2) { humInput = !humInput; } magicCode = 0; }],
	];
	var keyUpActions = {}, keyDownActions = {};
	for (var i = 0; i < keyMap.length; i++)  {
		if (keyMap[i][1] == 'up') keyUpActions[keyMap[i][0]] = keyMap[i][2];
		else keyDownActions[keyMap[i][0]] = keyMap[i][2];
	}	
	this.keyUp = function(key) {
		if (keyUpActions[key]) keyUpActions[key]();
	}
	this.keyDown = function(key) {
		if (keyDownActions[key]) keyDownActions[key]();
	}
}
