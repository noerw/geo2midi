(function IOadapter() {
  // initialize WebMIDI API
  WebMidi.enable(function onSuccess() {
    console.log("WebMidi enabled. Available Ports:");
    console.log(WebMidi.outputs);
  },
  function onFailure(err) {
    console.error("WebMidi could not be enabled.", err);
  });

  var IOadapter = function(attributeMapping) {
    this.attributeMapping = attributeMapping;
    this.prevData = { gate: 0, velocity: 0, pitch: 0 };
  };

  IOadapter.prototype.geojson2sequence = function(geojson, min) {
    var sequence = {
      gate:     [min + ' cut to 0'],
      velocity: [min + ' cut to 0'],
      pitch:    [min + ' cut to 0']
    };

    var i = 1;

    L.geoJson(geojson, {
      onEachFeature: function(feature, layer) {
        if (!layer.getBounds) return;
        var bounds = layer.getBounds(),
          start    = bounds.getWest(),
          end      = bounds.getEast(),
          velocity = bounds.getNorth().toFixed(0),
          pitch    = i++;//bounds.getSouth().toFixed(0);

        sequence.gate.push(start + ' cut to 1');
        sequence.velocity.push(start + ' cut to ' + velocity);
        sequence.pitch.push(start + ' cut to ' + pitch);
        sequence.gate.push(end + ' cut to 0');
        sequence.velocity.push(end + ' cut to ' + velocity);
        sequence.pitch.push(end + ' cut to ' + pitch);
      }
    });

    sequence.gate.sort(sortSequenceData);
    sequence.velocity.sort(sortSequenceData);
    sequence.pitch.sort(sortSequenceData);

    function sortSequenceData(valA, valB) {
      var a = parseFloat(valA.split(' cut to ')[0]),
        b = parseFloat(valB.split(' cut to ')[0]);
      return a - b;
    }

    return sequence;
  };

  IOadapter.prototype.midiOut = function(data, delta, timestamp, context) {
    if (!WebMidi.connected || data.gate === null) return;
    // check if an event is due. if so; send corresponding midi!
    var gateDiff = data.gate - context.prevData.gate,
      pitchDiff = data.pitch - context.prevData.pitch;
    context.prevData = data;

    if (gateDiff > 0 || (pitchDiff && data.gate === 1)) // note on
      WebMidi.playNote(data.pitch);
    else if (gateDiff < 0 || (pitchDiff && data.gate === 0)) // note off
      WebMidi.stopNote(data.pitch);
  };

  IOadapter.prototype.allNotesOff = function() {
    //midiDevice.allNotesOff();
  };

  window.IOadapter = function(midiDevice, attributeMapping) {
    return new IOadapter(midiDevice, attributeMapping);
  };
})();
