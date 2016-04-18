(function playhead() {
  L.Playhead = L.Layer.extend({
    options: {
      cursorStyle: { color: '#44aacc', interactive: false, weight: 2 },
      outOfBoundsStyle: { stroke: false, fillOpacity: 0.7, fillColor: '#000000', interactive: false },
      min: -180,
      max: 180,
      loop: true
    },
    initialize: function(options) {
      L.Util.setOptions(this, options);
      this.currentPos = this.options.min;
    },
    onAdd: function(map) {
      map.createPane('playheadPane')//.style.zIndex = 1; //TODO: FIX!!!
      this.cursor = L.polyline([], { pane: 'playheadPane' }).addTo(map);
      this.leftBounds = L.rectangle([[-180,-180],[180,0]], { pane: 'playheadPane' }).addTo(map);
      this.rightBounds = L.rectangle([[-180,0],[180,180]], { pane: 'playheadPane' }).addTo(map);

      this.cursor.setStyle(this.options.cursorStyle);
      this.leftBounds.setStyle(this.options.outOfBoundsStyle);
      this.rightBounds.setStyle(this.options.outOfBoundsStyle);
      this.setPos(this.options.min);
      this.setMinMax({min: this.options.min, max: this.options.max});
    },
    onRemove: function(map) {
      this.cursor.removeFrom(map);
    },
    setPos: function(pos) {
      var max = this.options.max, maxDiff = pos - max,
          min = this.options.min, minDiff = pos - min;
          
      // if looping: bring into minmax-range (modulo like)
      // else:       limit to minmax
      if (this.options.loop) {
        if (maxDiff > 0)      this.currentPos = min + maxDiff;
        else if (minDiff < 0) this.currentPos = max + minDiff;
        else                  this.currentPos = pos;
      } else {
        if (pos > max)        this.currentPos = max;
        else if (pos < min)   this.currentPos = min;
        else                  this.currentPos = pos;
      }
      
      this.cursor.setLatLngs([[-180, this.currentPos], [180, this.currentPos]]);
    },
    getPos: function() { return this.currentPos; },
    setMinMax: function(minMax) {
      if (minMax.min >= minMax.max) return false;
      this.options.max = minMax.max;
      this.options.min = minMax.min;
      
      var mapBounds = this._map.getBounds();
      this.leftBounds.setBounds([[-180, mapBounds._southWest.lng - 20], [180, minMax.min]]);
      this.rightBounds.setBounds([[-180, minMax.max], [180, mapBounds._northEast.lng + 20]]);
    },
    getMinMax: function() {
      return { min: this.options.min, max: this.options.max };
    }
  });
  
  L.playhead = function(options) {
    return new L.Playhead(options);
  };
})();