
import * as L from 'Leaflet';
import setupBaseLayer from './setup_base_layer.js'
import setupRoutes from './setup_routes.js'

const map = setupBaseLayer()
setupRoutes(map)
