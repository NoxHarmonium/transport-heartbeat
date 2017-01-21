
import * as L from 'Leaflet';
import setupBaseLayer from './setup_base_layer.js'
import setupRoutes from './setup_routes.js'
import TimeSeriesDataManager from './time_series_data_manager.js'
import TimeController from './time_controller.js'
import TimeSeriesEventEmitter from './time_series_event_emitter.js'

const dataManager = new TimeSeriesDataManager();

const map = setupBaseLayer();
const timeController = new TimeController();
let eventEmitter;

setupRoutes(map)
  .then(() => dataManager.getTimeSeriesData(new Date(2017, 0, 20)))
  .then((data) => {
    timeController.start();
    eventEmitter = new TimeSeriesEventEmitter(timeController, data, (eventTime, event) => {
      console.log(`[${eventTime}] Event occurred: ${JSON.stringify(event, null, 2)}`);
    });
    timeController.tickCallbacks.push((time) => {
      document.getElementById('time_indicator').innerHTML = time;
    });
  })
  .catch((err) => {
    console.error(err);
  });
