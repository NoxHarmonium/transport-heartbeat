
import * as L from 'Leaflet';

export default function setupRoutes(map) {

	return Promise.all([
	  fetch('geojson/bus-lines-simplified.json').then((res) => res.json()),
	  fetch('geojson/tram-lines-simplified.json').then((res) => res.json()),
	  fetch('geojson/train-lines-simplified.json').then((res) => res.json())
	])
	  .then((results) => {
	    L.geoJSON(results[0], {
	        style: {
	          "color": "#FFB74D",
	          "weight": 2,
	          "opacity": 0.25,
	        }
	      }).addTo(map);

	    L.geoJSON(results[1], {
	        style: {
	          "color": "#7CB342",
	          "weight": 3,
	          "opacity": 0.75,
	        }
	      }).addTo(map);

	      L.geoJSON(results[2], {
	        style: {
	          "color": "#01579B",
	          "weight": 4,
	          "opacity": 1,
	        }
	      }).addTo(map);

	      map.createPane('labels');
	      map.getPane('labels').style.zIndex = 650;
	      map.getPane('labels').style.pointerEvents = 'none';

	      var layer = new L.StamenTileLayer("toner-labels", {
	        pane: 'labels'
	      });
	      map.addLayer(layer);
	  });

}
