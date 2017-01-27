/*
{
"departure_lat": "-38.2158144726992",
"name": "Waurn Ponds Railway Station (Waurn Ponds)",
"arrival_lon": "144.35505671194",
"arrival_time": "2017-01-20 04:37:00",
"departure_lon": "144.30681939977",
"arrival_lat": "-38.1985490047076",
"id": "5830.T0.1-V23-D-mjp-1.22.R",
"departure_time": "2017-01-20 04:32:00"
}*/
import * as L from 'Leaflet';

const pulsingIcon = L.icon.pulse({ iconSize: [20, 20], color: 'red' });

export default class MarkerManager {

  constructor(map) {
    this.map = map;
    this.markers = {};
    this.markerCooldown = 1000;
  }

  eventToLocation(event) {
    return [parseFloat(event.departure_lat), parseFloat(event.departure_lon)];
  }

  eventIsNew(event) {
    return !(event.id in this.markers);
  }

  eventIsLast(event) {
    return event.arrival_time === null
  }

  createMarker(event) {
    const latLng = this.eventToLocation(event);
    const marker = L.marker(latLng, { icon: pulsingIcon }).addTo(this.map);
    this.markers[event.id] = marker;
  }

  updateMarker(event) {
    const latLng = this.eventToLocation(event);
    const marker = this.markers[event.id]
    marker.setLatLng(latLng)
  }

  destroyMarker(event) {
    this.updateMarker(event)
    const id = event.id
    const marker = this.markers[id];
    L.DomUtil.addClass(marker._icon, 'marker-destroyed');
    setTimeout(() => {
      this.markers[id] = null;
      this.map.removeLayer(marker);
    }, this.markerCooldown);
  }

  handleEvent(event) {
    if (this.eventIsNew(event)) {
      this.createMarker(event);
    } else if (this.eventIsLast(event)) {
      this.destroyMarker(event);
    } else {
      this.updateMarker(event);
    }
  }
}