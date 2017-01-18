
import * as L from 'Leaflet';
import setupBaseLayer from './setup_base_layer.js'
import setupRoutes from './setup_routes.js'
import TimeSeriesDataManager from './time_series_data_manager.js'

const dataManager = new TimeSeriesDataManager()

const map = setupBaseLayer()
setupRoutes(map)
  .then(dataManager.getTimeSeriesData(new Date(2017, 1, 20)))
