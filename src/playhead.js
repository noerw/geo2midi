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
    if (minMax.min >= minMax.max) return false;
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
