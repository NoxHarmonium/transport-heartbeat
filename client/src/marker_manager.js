
import * as L from 'Leaflet';
import MarkerAnimator from './marker_animator.js'

const pulsingIcon = L.icon.pulse({ iconSize: [20, 20], color: 'red' });

export default class MarkerManager {

  constructor(map, timeController) {
    this.map = map;
    this.markers = {};
    this.animators = {};
    this.markerCooldown = 1000;
    timeController.tickCallbacks.push((time) => this.tick(time));
  }

  destinationFromEvent(event) {
    return [parseFloat(event.departure_lat), parseFloat(event.departure_lon)];
  }

  arrivalFromEvent(event) {
    return [parseFloat(event.arrival_lat), parseFloat(event.arrival_lon)];
  }

  eventIsNew(event) {
    return !(event.id in this.markers);
  }

  eventIsLast(event) {
    return event.arrival_time === null
  }

  createMarker(event) {
    const origin = this.destinationFromEvent(event);
    const destination = this.arrivalFromEvent(event);
    const marker = L.marker(origin, { icon: pulsingIcon }).addTo(this.map);
    this.markers[event.id] = marker;
    if (destination) {
      this.animators[event.id] = new MarkerAnimator(marker, origin, destination, event.departure_time, event.arrival_time);
    }
  }

  updateMarker(event) {
    const origin = this.destinationFromEvent(event);
    const destination = this.arrivalFromEvent(event);
    const marker = this.markers[event.id]
    if (destination) {
      this.animators[event.id] = new MarkerAnimator(marker, origin, destination, event.departure_time, event.arrival_time);
    }
    marker.setLatLng(origin)
  }

  destroyMarker(event) {
    this.updateMarker(event)
    const id = event.id
    const marker = this.markers[id];
    L.DomUtil.addClass(marker._icon, 'marker-destroyed');
    setTimeout(() => {
      delete this.markers[id];
      delete this.animators[event.id];
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

  tick(time) {
    for (const tripId in this.animators) {
      this.animators[tripId].tick(time);
    }
  }
}