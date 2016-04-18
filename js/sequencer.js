(function () {
  var Sequencer = function(updateCallback) {
    this.sequence = null;
    this.updateloop = null;
    this.updateCallbacks = [updateCallback] || [];
    this.timeNow = performance.now();
  };
  
  Sequencer.prototype.update = function(timestamp, position) {
    var _this = this;
    var delta = 0.04;
    var newPos = position;
    var data = {};//this.sequence.get(position);
    
    if (typeof timestamp == 'number') {
      delta = timestamp - this.timeNow;
      this.timeNow = timestamp;
    }
    for (var i = 0; i < this.updateCallbacks.length; i++) {
      newPos = this.updateCallbacks[i](data, delta, timestamp);
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
    if(!this.sequence) this.update('start', position);
  };
  
  Sequencer.prototype.stop = function() {
    this.update('stop');
  };
  
  Sequencer.prototype.loadSequence = function(sequenceData, playbackSpeed) {
    this.sequence = STORYLINE.parseStoryline(sequenceData);
  };
  
  Sequencer.prototype.addUpdateCallback = function(callback) {
    this.updateCallbacks.push(callback);
  };
  
  window.sequencer = function(updateCallback) {
    return new Sequencer(updateCallback);
  };
})();
