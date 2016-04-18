(function IOadapter() {
  
  var IOadapter = function(attributeMapping, midiDevice) {
    this.attributeMapping = attributeMapping || { gate: 'latitude', velocity: 'area', pitch: 'longitude' };
    this.midiDevice = midiDevice;
  };
  
  IOadapter.prototype.geoJson2sequence = function(geojson) {
    return {
      gate: [],
      velocity: [],
      pitch: []
    };
  };
  
  IOadapter.prototype.midiOut = function(data) {
    //midiDevice.send();
  };

  window.IOadapter = function(attributeMapping, midiDevice) {
    return new IOadapter(attributeMapping, midiDevice);
  };
})();