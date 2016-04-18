(function playbackControl() {  
  L.Control.Playback = L.Control.extend({
    options: {
      position: 'topleft',
      autoPlay: false,
      playbackSpeed: 2,
      updateCallback: function(data, delta, timestamp) {
        //console.log(JSON.stringify({data: data, delta: delta, timestamp: timestamp}, null, 2));
        //console.log(performance.now());
      }
    },
    initialize: function (options) {
      var _this = this;
      L.Util.setOptions(this, options);
      this.playing = this.options.autoPlay;
      this.playhead = L.playhead({min: 1, max: 14});
      this.sequencer = window.sequencer(this.options.updateCallback);
      this.sequencer.addUpdateCallback(function(data, delta, timestamp) {
        var newPos = _this.playhead.getPos() + delta * _this.options.playbackSpeed / 1000;
        _this.playhead.setPos(newPos);
        return newPos;
      });
    },
    onAdd: function (map) {
      this.playhead.addTo(map);
      map.on('click', function(e) {
        var minMax = this.playhead.getMinMax();
        if (e.latlng.lng >= minMax.min && e.latlng.lng < minMax.max) {
          this.IOadapter.allNotesOff();
          this.playhead.setPos(e.latlng.lng);
        }
      }, this);
      
      map.on('moveend', function(e) {
        this.playhead.setMinMax(this.playhead.getMinMax());
      }, this);

      var container = L.DomUtil.create('div', 'playback-control leaflet-bar');
      this.btnPlay = L.DomUtil.create('a', '', container);  
      this.btnPlay.innerHTML = '<b>' + (this.playing ? 'PAUSE' : 'PLAY') + '</b>';
      this.btnPlay.href = '#';

      L.DomEvent.addListener(this.btnPlay, 'click', this._togglePlay, this);
      L.DomEvent.disableClickPropagation(container);
      
      return container;
    },
    onRemove: function (map) {
      this.playhead.removeFrom(map);
      map.off('click', this);
      L.DomEvent.removeListener(this.btnPlay, 'click', this._togglePlay, this);
    },
    _togglePlay: function(e) {
      if (e) L.DomEvent.preventDefault(e);
      if ((this.playing = !this.playing)) {
        this.btnPlay.innerHTML = '<b>PAUSE</b>';
        this.sequencer.start(this.playhead.getPos(), this.playhead.getPos);
      } else {
        //this.IOadapter.allNotesOff();
        this.btnPlay.innerHTML = '<b>PLAY</b>';
        this.sequencer.stop();
      }
    },
    loadSequence: function(geojson) { 
      //var sequenceData = this.IOadapter.geojson2sequence(geojson);
      this.sequencer.loadSequence(sequenceData);
    }
  });

  L.control.playback = function(options) {
    return new L.Control.Playback(options);
  };
})();