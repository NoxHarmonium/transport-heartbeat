
import MarkerManager from './marker_manager.js'
import setupBaseLayer from './setup_base_layer'
import setupRoutes from './setup_routes'
import TimeController from './time_controller'
import TimeSeriesDataManager from './time_series_data_manager'
import TimeSeriesEntry from './time_series_entry'
import TimeSeriesEventEmitter from './time_series_event_emitter'

const dataManager = new TimeSeriesDataManager();

const map = setupBaseLayer();
const timeController = new TimeController();
const markerManager = new MarkerManager(map, timeController);
let eventEmitter;

setupRoutes(map)
  .then(() => dataManager.getTimeSeriesData(new Date(2017, 0, 20)))
  .then((data) => {
    timeController.start();
    eventEmitter = new TimeSeriesEventEmitter(timeController, data, (_, event: TimeSeriesEntry) => {
      markerManager.handleEvent(event);
    });
    timeController.registerCallback((time: Date) => {
      let timeIndicatorElement = document.getElementById('time_indicator')
      if (timeIndicatorElement) {
        timeIndicatorElement.innerHTML = time.toString()
      }
    });
  })
  .catch((err) => {
    console.error(err);
  });
