/**
 * Modernized SoundSensor using Web Audio API
 * Replaces the original Flash-based implementation.
 * 
 * Copyright 2013-2026, Konstantin Tretykov.
 * 
 * Pitch detection algorithm adapted from:
 * https://alexanderell.is/posts/tuner/tuner.js
 * (MIT License, Copyright (c) 2014 Chris Wilson)
 */

var audioContext = null;
var analyser = null;
var mediaStreamSource = null;
var bufferLength = 2048;
var dataBuffer = new Float32Array(bufferLength);
var isInitialized = false;
var rmsThreshold = 0.01; 

function initAudio() {
    if (isInitialized) return;

    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
        alert("Your browser does not support the Web Audio API. Please use a modern browser.");
        return;
    }

    audioContext = new AudioContext();

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
            mediaStreamSource = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = bufferLength;
            mediaStreamSource.connect(analyser);
            isInitialized = true;
            
            // Resume context if suspended (common in some browsers)
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }

            // Notify the game that microphone is ready
            if (typeof microphoneReady === "function") {
                microphoneReady();
            }
        })
        .catch(function(err) {
            console.error("Error getting audio stream:", err);
            alert("Microphone access is required to play. Please allow access and reload.");
        });
    } else {
        alert("getUserMedia not supported in this browser.");
    }
}

function getPitch() {
    if (!isInitialized || !analyser) return -1;

    analyser.getFloatTimeDomainData(dataBuffer);
    return autoCorrelate(dataBuffer, audioContext.sampleRate);
}

function setCutoffLevel(level) {
    // Level comes from menu.js as -40, -33.3, -13
    // We assume these are dB values.
    // We convert to linear RMS.
    
    // Safety check to handle potential positive values or 0 sensibly
    if (level > 0) level = -level; 
    if (level === 0) level = -100; 

    rmsThreshold = Math.pow(10, level / 20);
    // console.log("Sensitivity set to: " + rmsThreshold + " (" + level + "dB)");
}

// Autocorrelation algorithm from https://alexanderell.is/posts/tuner/tuner.js
function autoCorrelate(buffer, sampleRate) {
  // Perform a quick root-mean-square to see if we have enough signal
  var SIZE = buffer.length;
  var sumOfSquares = 0;
  for (var i = 0; i < SIZE; i++) {
    var val = buffer[i];
    sumOfSquares += val * val;
  }
  var rootMeanSquare = Math.sqrt(sumOfSquares / SIZE)
  if (rootMeanSquare < rmsThreshold) {
    return -1;
  }

  // Find a range in the buffer where the values are below a given threshold.
  var r1 = 0;
  var r2 = SIZE - 1;
  var threshold = 0.2;

  // Walk up for r1
  for (var i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  // Walk down for r2
  for (var i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) {
      r2 = SIZE - i;
      break;
    }
  }

  // Trim the buffer to these ranges and update SIZE.
  buffer = buffer.slice(r1, r2);
  SIZE = buffer.length

  // Create a new array of the sums of offsets to do the autocorrelation
  var c = new Array(SIZE).fill(0);
  // For each potential offset, calculate the sum of each buffer value times its offset value
  for (var i = 0; i < SIZE; i++) {
    for (var j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + buffer[j] * buffer[j+i]
    }
  }

  // Find the last index where that value is greater than the next one (the dip)
  var d = 0;
  while (c[d] > c[d+1]) {
    d++;
  }

  // Iterate from that index through the end and find the maximum sum
  var maxValue = -1;
  var maxIndex = -1;
  for (var i = d; i < SIZE; i++) {
    if (c[i] > maxValue) {
      maxValue = c[i];
      maxIndex = i;
    }
  }

  var T0 = maxIndex;

  // parabolic interpolation
  var x1 = c[T0 - 1];
  var x2 = c[T0];
  var x3 = c[T0 + 1]

  var a = (x1 + x3 - 2 * x2) / 2;
  var b = (x3 - x1) / 2
  if (a) {
    T0 = T0 - b / (2 * a);
  }

  return sampleRate/T0;
}

// Stub for legacy Flash interaction
function getSoundSensor() {
    return {
        getPitch: getPitch,
        setCutoffLevel: setCutoffLevel
    };
}

// Helper to start from UI
function startSoundSensor() {
    initAudio();
}