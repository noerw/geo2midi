(function IOadapter() {
  
  var IOadapter = function(midiDevice, attributeMapping) {
    this.attributeMapping = attributeMapping;
    this.midiDevice = midiDevice;
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
    console.log(sequence);
    function sortSequenceData(valA, valB) {
      var a = parseFloat(valA.split(' cut to ')[0]),
        b = parseFloat(valB.split(' cut to ')[0]);
      return a - b;
    }
    
    return sequence;
  };
  
  IOadapter.prototype.midiOut = function(data, delta, timestamp, context) {
    // check if an event is due. if so; send corresponding midi!
    var gateDiff = data.gate - context.prevData.gate,
      pitchDiff = data.pitch - context.prevData.pitch;
    context.prevData = data;
    
    if (gateDiff > 0 || pitchDiff)      // note on
      try { context.midiDevice.send([0x90, data.pitch, data.velocity]); } catch(err) {midiError(err);}
    else if (gateDiff < 0 || pitchDiff) // note off
      try { context.midiDevice.send([0x80, data.pitch, 127]); } catch(err) {midiError(err);}
    
    function midiError(err) {
      console.log('data at ' + timestamp + ': ' + JSON.stringify(data));
      //console.error(err);
      //console.log(performance.now());
    }
  };
  
  IOadapter.prototype.allNotesOff = function() {
    //midiDevice.allNotesOff();
  };

  window.IOadapter = function(midiDevice, attributeMapping) {
    return new IOadapter(midiDevice, attributeMapping);
  };
})();