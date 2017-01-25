
export default class TimeSeriesEventEmitter {

  constructor(timeController, timeSeriesData, eventCallback) {
    this.timeController = timeController;
    this.timeSeriesData = timeSeriesData;
    this.eventCallback = eventCallback;

    timeController.tickCallbacks.push(this.tickCallback.bind(this));
  }

  tickCallback(time) {
    if (!this.eventCallback) { return }

    while (time > this.timeSeriesData[0].departure_time) {
      this.eventCallback(time, this.timeSeriesData.shift())
    }
  }

}