(function() {
  var map, playback, layer, dataset = 'USA-states.geojson',
   previousData = { gate: 0, velocity: 0, pitch: 0 };

  function init() {
    WebMidi.enable(function success() {
      console.log("WebMidi enabled. Available Ports:");
      console.log(WebMidi.outputs);
    }, function error(err) {
      console.error("WebMidi could not be enabled.", err);
    });

    map = L.map('map', {
      zoomControl: false,
      boxZoom: false,
      doubleClickZoom: false,
      dragging: false,
      keyboard: false,
      scrollWheelZoom: false,
      touchZoom: false,
      minZoom: 2
    }).addLayer(L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }));

    playback = L.control.playback().addTo(map);
    playback.on('play', function(e) { console.log(e); });
    playback.on('pause', function(e) { console.log(e); });
    playback.on('sequenceData', onSequenceData);

    ajax(dataset, function(response, statusCode) {
      if (statusCode === 200) loadGeoJSON(JSON.parse(response));
    });
  }

  function onSequenceData(e) {
    if (!WebMidi.connected || e.sequenceData.gate === null) return;

    // check if an event is due. if so; send corresponding midi!
    var gateDiff  = e.sequenceData.gate - previousData.gate;
    var pitchDiff = e.sequenceData.pitch - previousData.pitch;
    previousData = e.sequenceData;

    if (gateDiff > 0 || (pitchDiff && e.sequenceData.gate === 1)) // note on
      WebMidi.playNote(e.sequenceData.pitch);
    else if (gateDiff < 0 || (pitchDiff && e.sequenceData.gate === 0)) // note off
      WebMidi.stopNote(e.sequenceData.pitch);
  }

  function loadGeoJSON(json) {
    var sequence = { gate: [], velocity: [], pitch: [] };

    if (layer) layer.removeFrom(map);
    layer = L.geoJson(json, {
      style: { interactive: true, weight: 1, color: '#99b'},

      onEachFeature: function(feature, layer) {
        if (!layer.getBounds) return;
        var bounds = layer.getBounds(),
          start    = bounds.getWest(),
          end      = bounds.getEast(),
          velocity = ((bounds.getNorth() + 90) / 180 * 127).toFixed(0),
          pitch    = ((bounds.getSouth() + 180) / 360 * 127).toFixed(0);

        sequence.gate.push(start + ' cut to 1');
        sequence.gate.push(end + ' cut to 0');
        sequence.velocity.push(start + ' cut to ' + velocity);
        sequence.velocity.push(end + ' cut to ' + velocity);
        sequence.pitch.push(start + ' cut to ' + pitch);
        sequence.pitch.push(end + ' cut to ' + pitch);

        layer.on('click', function(e){
          playback.setPlaybackPosition(start);
          L.DomEvent.stopPropagation(e);
        });
      }
    });

    var layerBounds = layer.getBounds();
    sequence.gate.push(layerBounds.getWest() - 1 + ' cut to 0');
    sequence.gate.sort(sortSequenceData);
    sequence.velocity.push(layerBounds.getWest() - 1 + ' cut to 0');
    sequence.velocity.sort(sortSequenceData);
    sequence.pitch.push(layerBounds.getWest() - 1 + ' cut to 0');
    sequence.pitch.sort(sortSequenceData);

    playback.loadSequence(sequence, layerBounds.getWest() - 1, layerBounds.getEast() + 1, 4);
    map.addLayer(layer).fitBounds(layerBounds);
  }

  function sortSequenceData(valA, valB) {
    var a = parseFloat(valA.split(' cut to ')[0]),
      b = parseFloat(valB.split(' cut to ')[0]);
    return a - b;
  }

  function ajax(url, success, method, mimetype) {
    var oReq = new XMLHttpRequest();
    oReq.onload = function(res) { success(res.target.response, res.target.status); };
    oReq.open(method || 'get', url, true);
    oReq.overrideMimeType(mimetype || 'text/plain');
    oReq.send();
    return oReq;
  }

  init();
})();
