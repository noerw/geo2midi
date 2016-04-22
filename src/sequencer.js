/**
 * window.sequencer(): Sequencer, wrapper around storyline.js
 */
var Sequencer = function(onUpdate) {
  this.sequence = null;
  this.updateloop = null;
  this.updateCallback = onUpdate;
  this.timeNow = performance.now();
};

Sequencer.prototype.update = function(timestamp, position) {
  var _this = this,
    delta = 0.04,
    newPos = position,
    sequenceData = {};

  for (var trackName in this.sequence.points) {
    sequenceData[trackName] = this.sequence.get(trackName, position);
  }

  if (typeof timestamp === 'number') {
    delta = timestamp - this.timeNow;
    this.timeNow = timestamp;
  }

  newPos = this.updateCallback(sequenceData, delta, timestamp);

  this.updateloop = requestAnimationFrame(function recurse(ts) {
    if (newPos !== 'stop') _this.update(ts, newPos);
  });
};

Sequencer.prototype.start = function(position) {
  this.timeNow = performance.now();
  if (this.sequence) {
    this.update('start', position);
    return true;
  } else {
    console.error('no sequence loaded!');
    return false;
  }
};

Sequencer.prototype.stop = function() {
  cancelAnimationFrame(this.updateloop);
  this.updateloop = null;
};

Sequencer.prototype.loadSequence = function(sequenceData) {
  this.sequence = STORYLINE.parseStoryline(sequenceData);
};

window.sequencer = function(onUpdate, context) {
  return new Sequencer(onUpdate, context);
};
