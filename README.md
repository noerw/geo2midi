# geo2midi
experimental GeoJSON -> MIDI converter/player, running on leaflet.js v1.x

---

This tool is a proof of concept, loading GeoJSON data into a map which then may be "played back" as in a usual audio-/ midi-player.

By default it tries to output the sequence-data as midi events via the WebMIDI-API (currently only supported in `chromium >=v43`). Other backends my be used instead, making this a generic "geo-sequencer".

You may customize which of the GeoJSON properties are mapped to which (MIDI-) parameters. The default mapping is:

* latitude-extent of an object -> gate (note on/off),
* min longitude -> pitch
* max longitude -> velocity

`geo2midi` is developed in an effort to get familiar with leaflet's API changes in v1.0, and to explore sequencing in the browser.
Let me know if you used the playback-control in some interesting way!

## usage

### minimal example
0. load leaflet & playbackControl scripts in HTML
```html
<script src="lib/leaflet/leaflet.js" charset="utf-8"></script>
<script src="lib/storyline.js" charset="utf-8"></script>
<script src="js/IOadapter.js" charset="utf-8"></script>
<script src="js/sequencer.js" charset="utf-8"></script>
<script src="js/leaflet-control-playback_playhead.js" charset="utf-8"></script>
<script src="js/leaflet-control-playback.js" charset="utf-8"></script>
```
1. create a map
```js
var map = L.map('map');
```
2. get some GeoJSON data
```js
var dataset = { type: "FeatureCollection"  ... };
```
3. initialize the MIDI backend
```js
var midiOut = ...
```
4. initialize the sequencer
```js
var playbackOptions = {
  midiOut: midiOut,
  geojson: dataset
};
var playbackControl = L.control.playback(playbackOptions)
```
5. connect some hardware to your midiOut
6. enjoy the beauty of spatial music!

### API
`todo`

## license
GPL-3.0

Used software packages are licensed under their own terms.
