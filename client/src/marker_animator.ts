
export default class MarkerAnimator {

    private targetMarker: L.Marker;
    private origin: L.LatLngTuple;
    private destination: L.LatLngTuple;
    private startTime: Date;
    private endTime: Date;

    constructor(targetMarker: L.Marker, origin: L.LatLngTuple, destination: L.LatLngTuple, startTime: Date, endTime: Date) {
        this.targetMarker = targetMarker;
        this.origin = origin;
        this.destination = destination;
        this.startTime = startTime;
        this.endTime = endTime;

        if (endTime == null) {
            throw Error("Cannot animate to a null end time");
        }
    }

    tick(time: Date) {
        const progress = this.clamp((time.valueOf() - this.startTime.valueOf()) /
            (this.endTime.valueOf() - this.startTime.valueOf()), 0, 1);
        const latDelta = (this.destination[0] - this.origin[0]) * progress;
        const lonDelta = (this.destination[1] - this.origin[1]) * progress;
        if (isNaN(latDelta) || isNaN(lonDelta)) { return; }
        this.targetMarker.setLatLng([this.origin[0] + latDelta, this.origin[1] + lonDelta]);
    }

    clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max);
    }

}
