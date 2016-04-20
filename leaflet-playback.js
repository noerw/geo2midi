(function() {
  /**
   * L.control.playback(): top level, provides control & API
   */
  L.Control.Playback = L.Control.extend({
    includes: L.Mixin.Events,
    options: {
      position: 'topleft',
      speed: 1,
      start: 1,
      stop: 14,
      loop: true,
    },
    initialize: function (options) {
      var _this = this;
      L.Util.setOptions(this, options);
      this.playing = false;
      this.playhead = L.playhead({
        min: this.options.start,
        max: this.options.stop
      });

      this.sequencer = window.sequencer(onUpdate);
      function onUpdate(sequenceData, delta, timestamp) {
        var oldPos = _this.playhead.getPosition(),
          newPos = oldPos + delta * _this.options.speed / 1000,
          minMax = _this.playhead.getMinMax();

        if(!_this.options.loop && newPos >= minMax.max) {
          _this.togglePlay();
          _this.playhead.setPosition(minMax.min);
          return 'stop';
        }

        _this.playhead.setPosition(newPos);
        _this.fire('sequenceData', {
          playbackPosition: newPos,
          sequenceData: sequenceData,
          deltaTime: delta,
          timestamp: timestamp
        }, false);

        return newPos;
      }
    },
    onAdd: function (map) {
      this.playhead.addTo(map);

      var container = L.DomUtil.create('div', 'playback-control leaflet-bar');
      this.btnPlay = L.DomUtil.create('a', '', container);
      this.btnPlay.innerHTML = '<b>' + (this.playing ? 'PAUSE' : 'PLAY') + '</b>';
      this.btnPlay.href = '#';

      map.on('click', function(e) {
        var minMax = this.playhead.getMinMax();
        if (e.latlng.lng >= minMax.min && e.latlng.lng < minMax.max)
          this.playhead.setPosition(e.latlng.lng);
      }, this);
      map.on('moveend', function(e) {
        this.playhead.setMinMax(this.playhead.getMinMax());
      }, this);

      L.DomEvent.addListener(this.btnPlay, 'click', this.togglePlay, this);
      L.DomEvent.disableClickPropagation(container);

      return container;
    },
    onRemove: function (map) {
      this.playhead.removeFrom(map);
      map.off('click', this);
      map.off('moveend', this);
      L.DomEvent.removeListener(this.btnPlay, 'click', this.togglePlay, this);
    },
    togglePlay: function(e) {
      if (e) L.DomEvent.preventDefault(e);
      if (!this.playing) {
        if ( this.sequencer.start(this.playhead.getPosition()) ) {
          if (this._map) this.btnPlay.innerHTML = '<b>PAUSE</b>';
          this.fire('play', { playbackPosition: this.playhead.getPosition() });
          this.playing = true;
        }
      } else {
        this.sequencer.stop();
        if (this._map) this.btnPlay.innerHTML = '<b>PLAY</b>';
        this.fire('pause', { playbackPosition: this.playhead.getPosition() });
        this.playing = false;
      }
      return this;
    },
    play: function(playbackPos) {
      if (!this.playing) {
        if (typeof playbackPos === 'number')
          this.playhead.setPosition(playbackPos);
        this.togglePlay();
      }
      return this;
    },
    pause: function(stop) {
      if (this.playing) {
        this.togglePlay();
        if (stop) this.playhead.setPosition(this.playhead.getMinMax().min);
      }
      return this;
    },
    stop: function() {
      return this.pause(true);
    },
    loadSequence: function(sequenceData, sequenceStart, sequenceEnd, playbackSpeed) {
      if (typeof sequenceStart === 'number' && typeof sequenceEnd === 'number')
        this.playhead.setMinMax({ min: sequenceStart, max: sequenceEnd });
      if (playbackSpeed)
        this.options.speed = playbackSpeed;

      this.playhead.setPosition(this.playhead.getMinMax().min);
      this.sequencer.loadSequence(sequenceData);
      return this;
    },
    getPlaybackPosition() {
      return this.playhead.getPosition();
    },
    setPlaybackPosition(lng) {
      this.playhead.setPosition(lng);
      return this;
    },
  });

  L.control.playback = function(options) {
    return new L.Control.Playback(options);
  };

  /**
   * L.playhead(): GUI of the control, provides cursor & start/end markers
   */
  L.Playhead = L.Layer.extend({
    options: {
      cursorStyle: { color: '#44aacc', interactive: false, weight: 2 },
      shadowStyle: { stroke: false, fillOpacity: 0.7, fillColor: '#000000', interactive: false },
      min: -180,
      max: 180
    },
    initialize: function(options) {
      L.Util.setOptions(this, options);
      this.currentPos = this.options.min;
      this.cursor = L.polyline([]);
      this.shadowL = L.rectangle([[-180,-180],[180,0]]);
      this.shadowR = L.rectangle([[-180,0],[180,180]]);
      this.cursor.setStyle(this.options.cursorStyle);
      this.shadowL.setStyle(this.options.shadowStyle);
      this.shadowR.setStyle(this.options.shadowStyle);
      this.setPosition(this.options.min);
    },
    onAdd: function(map) {
      this.cursor.addTo(map);
      this.shadowL.addTo(map);
      this.shadowR.addTo(map);
      this.setMinMax({min: this.options.min, max: this.options.max});
    },
    onRemove: function(map) {
      this.cursor.removeFrom(map);
      this.shadowL.removeFrom(map);
      this.shadowR.removeFrom(map);
    },
    setPosition: function(pos) {
      var max = this.options.max, maxDiff = pos - max,
          min = this.options.min, minDiff = pos - min;

      // bring into minmax-range (modulo like)
      if (maxDiff > 0)      this.currentPos = min + maxDiff;
      else if (minDiff < 0) this.currentPos = max + minDiff;
      else                  this.currentPos = pos;

      this.cursor.setLatLngs([[-180, this.currentPos], [180, this.currentPos]]);
      return this;
    },
    getPosition: function() { return this.currentPos; },
    setMinMax: function(minMax) {
      if (!(minMax.min < minMax.max)) return false;
      this.options.max = minMax.max;
      this.options.min = minMax.min;

      if (!this._map) return; // update UI only, if it's on the map
      var mapBounds = this._map.getBounds();
      this.shadowL.setBounds([[-180, mapBounds._southWest.lng], [180, minMax.min]]);
      this.shadowR.setBounds([[-180, minMax.max], [180, mapBounds._northEast.lng]]);
      return this;
    },
    getMinMax: function() {
      return { min: this.options.min, max: this.options.max };
    }
  });

  L.playhead = function(options) {
    return new L.Playhead(options);
  };

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

    if (typeof timestamp == 'number') {
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
})();
