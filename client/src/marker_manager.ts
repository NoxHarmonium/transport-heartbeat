
import MarkerAnimator from './marker_animator'
import TimeController from './time_controller'
import TimeSeriesEntry from './time_series_entry'

const pulsingIcon = L.icon.pulse({ iconSize: [20, 20], color: 'red' });

export default class MarkerManager {

  private map: L.Map;
  private markers: { [id: string]: L.Marker };
  private animators: { [id: string]: MarkerAnimator };
  private markerCooldown: number;

  constructor(map: L.Map, timeController: TimeController) {
    this.map = map;
    this.markers = {};
    this.animators = {};
    this.markerCooldown = 1000;
    timeController.registerCallback((time: Date) => this.tick(time));
  }

  destinationFromEvent(event: TimeSeriesEntry): L.LatLngTuple {
    return [parseFloat(event.departure_lat), parseFloat(event.departure_lon)];
  }

  arrivalFromEvent(event: TimeSeriesEntry): L.LatLngTuple {
    return [parseFloat(event.arrival_lat), parseFloat(event.arrival_lon)];
  }

  eventIsNew(event: TimeSeriesEntry): boolean {
    return !(event.id in this.markers);
  }

  eventIsLast(event: TimeSeriesEntry): boolean {
    return event.arrival_time === null
  }

  pingMarker(marker: L.Marker) {
    L.DomUtil.removeClass(marker._icon, 'marker-pinged');
    setTimeout(() => {
      L.DomUtil.addClass(marker._icon, 'marker-pinged');
    }, 0);
  }

  createMarker(event: TimeSeriesEntry) {
    const origin = this.destinationFromEvent(event);
    const destination = this.arrivalFromEvent(event);
    const marker = L.marker(origin, { icon: pulsingIcon }).addTo(this.map);
    this.markers[event.id] = marker;
    if (destination) {
      this.animators[event.id] = new MarkerAnimator(marker, origin, destination, event.departure_time, event.arrival_time);
    }
    this.pingMarker(marker);
  }

  updateMarker(event: TimeSeriesEntry) {
    const origin = this.destinationFromEvent(event);
    const destination = this.arrivalFromEvent(event);
    const marker = this.markers[event.id]
    if (destination) {
      this.animators[event.id] = new MarkerAnimator(marker, origin, destination, event.departure_time, event.arrival_time);
    }
    marker.setLatLng(origin);
    this.pingMarker(marker);
  }

  destroyMarker(event: TimeSeriesEntry) {
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

  handleEvent(event: TimeSeriesEntry) {
    if (this.eventIsNew(event)) {
      this.createMarker(event);
    } else if (this.eventIsLast(event)) {
      this.destroyMarker(event);
    } else {
      this.updateMarker(event);
    }
  }

  tick(time: Date) {
    for (const tripId in this.animators) {
      this.animators[tripId].tick(time);
    }
  }
}
