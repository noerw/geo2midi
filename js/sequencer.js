(function () {
  var Sequencer = function(onUpdate, context) {
    this.sequence = null;
    this.updateloop = null;
    this.updateCallbacks = onUpdate ? [{callback: onUpdate, context: context}] : [];
    this.timeNow = performance.now();
  };
  
  Sequencer.prototype.update = function(timestamp, position) {
    var _this = this;
    var delta = 0.04;
    var newPos = position;
    var sequenceData = { gate: 0, velocity: 0, pitch: 0 };
    if (this.sequence)
      sequenceData = {
        gate: this.sequence.get('gate', position),
        velocity: this.sequence.get('velocity', position),
        pitch: this.sequence.get('pitch', position)
      };
    
    if (typeof timestamp == 'number') {
      delta = timestamp - this.timeNow;
      this.timeNow = timestamp;
    }
    for (var i = this.updateCallbacks.length - 1; i >= 0; i--) {
      newPos = this.updateCallbacks[i].callback(
        sequenceData, delta, timestamp,
        this.updateCallbacks[i].context
      );
    }
    
    if (timestamp === 'stop') {
      cancelAnimationFrame(this.updateloop);
      this.updateloop = null;
    } else {
      this.updateloop = requestAnimationFrame(function recurse(timestamp) {
        _this.update(timestamp, newPos);
      });
    }
  };
  
  Sequencer.prototype.start = function(position, positionUpdate) {
    this.positionUpdate = positionUpdate;
    this.timeNow = performance.now();
    if(this.sequence) this.update('start', position);
  };
  
  Sequencer.prototype.stop = function() {
    this.update('stop');
  };
  
  Sequencer.prototype.loadSequence = function(sequenceData) {
    this.sequence = STORYLINE.parseStoryline(sequenceData);
  };
  
  Sequencer.prototype.onUpdate = function(callback, context) {
    this.updateCallbacks.push({ callback: callback, context: context });
  };
  
  window.sequencer = function(onUpdate, context) {
    return new Sequencer(onUpdate, context);
  };
})();
