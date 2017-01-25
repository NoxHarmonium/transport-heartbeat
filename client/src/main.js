
import setupBaseLayer from './setup_base_layer.js'
import setupRoutes from './setup_routes.js'
import TimeSeriesDataManager from './time_series_data_manager.js'
import TimeController from './time_controller.js'
import TimeSeriesEventEmitter from './time_series_event_emitter.js'
import MarkerManager from './marker_manager.js'

const dataManager = new TimeSeriesDataManager();

const map = setupBaseLayer();
const timeController = new TimeController();
const markerManager = new MarkerManager(map);
const markerLifetime = 1000; //ms
let eventEmitter;

setupRoutes(map)
  .then(() => dataManager.getTimeSeriesData(new Date(2017, 0, 20)))
  .then((data) => {
    timeController.start();
    eventEmitter = new TimeSeriesEventEmitter(timeController, data, (eventTime, event) => {
      markerManager.handleEvent(event);
    });
    timeController.tickCallbacks.push((time) => {
      document.getElementById('time_indicator').innerHTML = time;
    });
  })
  .catch((err) => {
    console.error(err);
  });
