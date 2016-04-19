(function playbackControl() {  
  L.Control.Playback = L.Control.extend({
    options: {
      position: 'topleft',
      playbackSpeed: 1,
      onUpdate: null, //function(data, delta, timestamp) {}
      attributeMapping: { gate: 'latitude', velocity: 'area', pitch: 'longitude' },
      geojson: ''
    },
    initialize: function (options) {
      var _this = this;
      L.Util.setOptions(this, options);
      this.playing = false;
      this.playhead = L.playhead({min: 1, max:14});
      this.IOadapter = window.IOadapter(this.options.attributeMapping);
      this.sequencer = window.sequencer(function(data, delta, timestamp) {
        var newPos = _this.playhead.getPos() + delta * _this.options.playbackSpeed / 1000;
        _this.playhead.setPos(newPos);
        return newPos;
      });
      this.sequencer.onUpdate(this.options.onUpdate || this.IOadapter.midiOut, this.IOadapter);
      this.layer = null;
      if (this.options.geojson) this.loadSequence(this.options.geojson);
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
        this.IOadapter.allNotesOff();
        this.btnPlay.innerHTML = '<b>PLAY</b>';
        this.sequencer.stop();
      }
    },
    loadSequence: function(geojson, playbackSpeed, spacing) {
      if (this._map && this.layer) this.layer.removeFrom(this._map);
      this.layer = L.geoJson(geojson);
      var layerBounds = this.layer.getBounds();
      var minMaxBounds = L.latLngBounds([
        [layerBounds.getSouth(), layerBounds.getWest() - (spacing || 0)],
        [layerBounds.getNorth(), layerBounds.getEast() + (spacing || 0)]
      ]);
      
      if (this._map) {
        this.layer.addTo(this._map);
        this._map.fitBounds(minMaxBounds);
      }
      
      this.playhead.setMinMax({ min: minMaxBounds.getWest(), max: minMaxBounds.getEast() });
      this.playhead.setPos(minMaxBounds.getWest());
      
      var sequenceData = this.IOadapter.geojson2sequence(geojson, minMaxBounds.getWest());
      this.sequencer.loadSequence(sequenceData);
      if (playbackSpeed) this.options.playbackSpeed = playbackSpeed;
    }
  });

  L.control.playback = function(options) {
    return new L.Control.Playback(options);
  };
})();