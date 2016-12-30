
import * as L from 'Leaflet';

var layer = new L.StamenTileLayer("toner");
var map = new L.Map("mapid", {
    center: new L.LatLng(-37.8136, 144.9631),
    zoom: 12,
});

map.addLayer(layer);