function Map(element) {
  'use strict';
  
  function init(element) {
    var map, playback;
    map = L.map(element, {
      zoomControl: false,
      boxZoom: false,
      doubleClickZoom: false,
      dragging: false,
      keyboard: false,
      scrollWheelZoom: false,
      touchZoom: false,
      center: [51.96, 7.63],
      zoom: 7,
      minZoom: 2,
      maxBounds: [[-180,-180], [180, 180]]
    });
    map.addLayer(L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }));
    
    playback = L.control.playback();
    playback.addTo(map);
    return map;
  }
  
  var _map = init(element || 'map');
  
  return {
    map: _map,
    setDataset: function(dataset) {},
    getDataset: function() {}
  };
}

var midimap = Map();
