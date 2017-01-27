
export default class MarkerAnimator {

    constructor(targetMarker, origin, destination, startTime, endTime) {
        this.targetMarker = targetMarker;
        this.origin = origin;
        this.destination = destination;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    tick(time) {
        const progress = this.clamp((time - this.startTime) / (this.endTime - this.startTime), 0, 1);
        const latDelta = (this.destination[0] - this.origin[0]) * progress;
        const lonDelta = (this.destination[1] - this.origin[1]) * progress;
        if (isNaN(latDelta) || isNaN(lonDelta)) { return }
        this.targetMarker.setLatLng([this.origin[0] + latDelta, this.origin[1] + lonDelta]);
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

}