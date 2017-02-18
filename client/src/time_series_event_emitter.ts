
import TimeController from "./time_controller";
import TimeSeriesEntry from "./time_series_entry";
import { EventCallbackFn } from "./type_defs";

export default class TimeSeriesEventEmitter {

  private timeController: TimeController;
  private timeSeriesData: Array<TimeSeriesEntry>;
  private eventCallback: EventCallbackFn;

  constructor(timeController: TimeController, timeSeriesData: Array<TimeSeriesEntry>, eventCallback: EventCallbackFn) {
    this.timeController = timeController;
    this.timeSeriesData = timeSeriesData;
    this.eventCallback = eventCallback;

    timeController.registerCallback(this.tickCallback.bind(this));
  }

  tickCallback(time: Date) {
    if (!this.eventCallback) { return; }

    while (time > this.timeSeriesData[0].departure_time) {
      this.eventCallback(time, this.timeSeriesData.shift());
    }
  }

}
