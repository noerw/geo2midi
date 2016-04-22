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
      clickHandlers: true,
      btnPlay:  '<span style="font-size: 130%" title="PLAY">&blacktriangleright;</span>',
      btnPause: '<span style="font-size: 80%" title="PAUSE">&marker;&marker;</span>',
      btnStop:  '<span title="STOP">&FilledSmallSquare;</span>',
      btnLoop:  '<span style="font-size: 130%" title="LOOP">&lrhar;</span>'
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

      if (this.options.clickHandlers) map.on('click', this._onClick, this);

      // resize the minmax shadows when moving the map
      map.on('moveend', function(e) {
        this.playhead.setMinMax(this.playhead.getMinMax());
      }, this);

      var container = L.DomUtil.create('div', 'leaflet-bar horizontal');
      L.DomEvent.disableClickPropagation(container);

      if (this.options.btnPlay) {
        this.btnPlay = L.DomUtil.create('a', '', container);
        this.btnPlay.innerHTML = this.options.btnPlay;
        this.btnPlay.href = '#';
        L.DomEvent.addListener(this.btnPlay, 'click', this.togglePlay, this);
      }
      if (this.options.btnStop) {
        this.btnStop = L.DomUtil.create('a', '', container);
        this.btnStop.innerHTML = this.options.btnStop;
        this.btnStop.href = '#';
        L.DomEvent.addListener(this.btnStop, 'click', this.stop, this);
      }
      if (this.options.btnLoop) {
        this.btnLoop = L.DomUtil.create('a', this.options.loop ? 'enabled' : '', container);
        this.btnLoop.innerHTML = this.options.btnLoop;
        this.btnLoop.href = '#';
        L.DomEvent.addListener(this.btnLoop, 'click', this.toggleLoop, this);
      }

      return container;
    },
    onRemove: function (map) {
      this.playhead.removeFrom(map);
      map.off('click', this._onClick, this);
      map.off('moveend', this);
      if (this.btnPlay)
        L.DomEvent.removeListener(this.btnPlay, 'click', this.togglePlay, this);
      if (this.btnStop)
        L.DomEvent.removeListener(this.btnStop, 'click', this.stop, this);
      if (this.btnLoop)
        L.DomEvent.removeListener(this.btnLoop, 'click', this.toggleLoop, this);
    },
    _onClick: function(e) {
      var minMax = this.playhead.getMinMax(),
        pPos = this.playhead.getPosition(),
        clickPos = e.latlng.lng,
        shift = e.originalEvent.shiftKey,
        ctrl = e.originalEvent.ctrlKey;

      // set minMax when clicked with ctrl or shift
      if (ctrl)  this.playhead.setMinMax({ min: minMax.min, max: clickPos });
      if (shift) this.playhead.setMinMax({ min: clickPos, max: minMax.max });

      // reset playhead position if its outside of the new minMax
      minMax = this.playhead.getMinMax();
      if (minMax.min > pPos || minMax.max < pPos)
        this.playhead.setPosition(clickPos);
      if (shift || ctrl) return;

      // set playhead position if clicked (without modifiers) within the minmax range
      if (clickPos >= minMax.min && clickPos < minMax.max)
        this.playhead.setPosition(clickPos);
    },
    toggleLoop(e) {
      if (typeof e !== 'undefined') L.DomEvent.preventDefault(e);
      this.options.loop = !this.options.loop;
      if (this._map && this.btnLoop) this.btnLoop.classList.toggle('enabled');
      return this;
    },
    togglePlay: function(e) {
      if (typeof e !== 'undefined') L.DomEvent.preventDefault(e);
      if (!this.playing) {
        if ( this.sequencer.start(this.playhead.getPosition()) ) {
          if (this._map && this.btnPlay)
            this.btnPlay.innerHTML = this.options.btnPause;
          this.fire('play', { playbackPosition: this.playhead.getPosition() });
          this.playing = true;
        }
      } else {
        this.sequencer.stop();
        if (this._map && this.btnStop)
          this.btnPlay.innerHTML = this.options.btnPlay;
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
      if (stop)
        this.playhead.setPosition(this.playhead.getMinMax().min);
      if (this.playing)
        this.togglePlay();
      return this;
    },
    stop: function(e) {
      if (typeof e !== 'undefined') L.DomEvent.preventDefault(e);
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
    getPlaybackPosition: function() {
      return this.playhead.getPosition();
    },
    setPlaybackPosition: function(lng) {
      this.playhead.setPosition(lng);
      return this;
    }
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

      if (!this._map) return; // update UI only if it's on the map
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
