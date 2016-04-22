# leaflet-playback
sequencer on top of `leaflet.js 1.0`

---

This is a control for leaflet 1.0, allowing you to "play back" spatial data.

`leaflet-playback` features a **generic sequencer with a UI**, allowing timed data-output based on a position on the map.
Sequence-data must be generated & parsed by the host application using the event-based API.

## example
The `examples` folder contains a proof of concept for a **GeoJSON->MIDI converter/player** (live [here](http://noerw.github.io/leaflet-playback/examples/index.html)),
which loads GeoJSON data into a map thats "played back" as in a usual audio-/ midi-player.
It tries to output the sequence-data as MIDI events via the WebMIDI-API (currently only supported in `chromium >=v43`).

Yeah, sounds weird. Polygons are converted to MIDI notes, by mapping the geometry to the following parameters:

* longitude-extent  -> gate (note on/off),
* min latitude -> pitch
* max latitude -> velocity

This library was was initially developed in an effort to get familiar with leaflet's API changes in v1.0, and to explore sequencing in the browser.
No, actually I just wanted to hear what spatial data may sound like.

Tell me if you find a good use for this! :^)

---

## usage
0. load `leaflet-playback` & dependencies in HTML

        <script src="leaflet.js" charset="utf-8"></script>
        <script src="js/leaflet-playback.min.js" charset="utf-8"></script>

1. initialize the playback control

        var playback = L.control.playback();

2. create a map & add the control. This is not necessary if you don't want the UI.

        var map = L.map('map');
        playback.addTo(map);

3. get some sequence data. must be in the format of [`Storyline.js`](https://github.com/spite/Storyline.js#using-storylinejs).

        var sequence = { foo: ['0 cut to 0', '2 ease to 2', '4 ease to 0'] };

4. load it, while defining start-/endpoint & playback speed

        playback.loadSequence(sequence, 0, 4, 2.5);

5. wait for data

        playback.on('sequenceData', function(e) {
          console.log('data at ' + e.playbackPosition ': ' + JSON.stringify(e.sequenceData));
        });

6. press play & enjoy!

---

## API

### Creation

    L.control.playback([options])

Initializes the whole control. `options` are optional and default to the following values:

    {
      position: 'topleft', // inherited from L.Control
      speed: 1,            // playback speed, without unit
      start: 1,            // longitude where the sequencer starts
      stop: 14,            // longitude where the sequencer ends
      loop: true,          // start over when reaching the end of the sequence
      clickHandlers: true, // en-/disable the controls clickhandlers on the map

      // content of the control's buttons. if falsy, the button won't be shown
      btnPlay:  '<span style="font-size: 130%" title="PLAY">&blacktriangleright;</span>',
      btnPause: '<span style="font-size: 80%" title="PAUSE">&marker;&marker;</span>',
      btnStop:  '<span title="STOP">&FilledSmallSquare;</span>',
      btnLoop:  '<span style="font-size: 130%" title="LOOP">&lrhar;</span>'
    }

### Methods
All functions - except getters - may be chained.
also, [see the inherited methods from L.Control](http://leafletjs.com/reference-1.0.0.html#control).

#### loadSequence(sequenceData, start, end, [speed])
Loads a sequence, where
`sequenceData` is a [`Storyline.js sequence`](https://github.com/spite/Storyline.js#using-storylinejs),
`start` & `end` define new borders of the sequencer as longitude-values, and
`speed` optionally sets the playback-speed.

#### getPlaybackPosition()
Returns the current positions of the playhead as longitude

#### setPlaybackPosition(longitude)
Sets a longitude value as new position of the playhead. Must be within the `start` and `stop` values.

#### play([playbackPosition])
Starts the sequencer, if its not running. Optionally starts at a given longitude.

#### pause([stop])
Pauses the sequencer, if its running. If optional `stop` is true, the playhead is resetted to the start of the sequence.

#### stop()
Alias for `pause(true)`.

#### togglePlay()
Toggles play/pause state of the sequencer, so you don't need to write your own toggle. :^)

#### toggleLoop()
Toggles looping behaviour of the sequencer.

---

### Events
The control fires the following events with respective event payload:

#### start
Fired when the sequencer begins doing its thing.

    { playbackPosition: <float> }

#### pause
Fired when the sequencer takes a break.

    { playbackPosition: <float> }

#### sequenceData
Fired when the sequencer outputs new data.
This generally happens while playing everytime the browser renders a frame, eg. 30 or 60 times a second.

    {
      playbackPosition: <float>  // current position of playback
      sequenceData:     <object> // contains the output of Storyline.js for the given time.
      deltaTime:        <float>  // millisecs since last update
      timestamp:        <float>  // timestamp from performance.now()
    }

---

## license
GPL-3.0

Used software packages are licensed under their own terms.
