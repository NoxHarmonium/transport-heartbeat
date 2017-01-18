(function (L) {
'use strict';

function setupBaseLayer() {

	var layer = new L.StamenTileLayer("toner-background", {
		opacity: 0.5
	});
	var map = new L.Map("mapid", {
		center: new L.LatLng(-37.8136, 144.9631),
		zoom: 12
	});
	map.addLayer(layer);

	return map;
}

function setupRoutes(map) {

	return Promise.all([fetch('json/routes/bus-lines-simplified.json').then(function (res) {
		return res.json();
	}), fetch('json/routes/tram-lines-simplified.json').then(function (res) {
		return res.json();
	}), fetch('json/routes/train-lines-simplified.json').then(function (res) {
		return res.json();
	})]).then(function (results) {
		L.geoJSON(results[0], {
			style: {
				"color": "#FFB74D",
				"weight": 2,
				"opacity": 0.25
			}
		}).addTo(map);

		L.geoJSON(results[1], {
			style: {
				"color": "#7CB342",
				"weight": 3,
				"opacity": 0.75
			}
		}).addTo(map);

		L.geoJSON(results[2], {
			style: {
				"color": "#01579B",
				"weight": 4,
				"opacity": 1
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

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var TimeSeriesDataManager = function () {
  function TimeSeriesDataManager() {
    classCallCheck(this, TimeSeriesDataManager);
  }

  createClass(TimeSeriesDataManager, [{
    key: 'padToTwoDigits',
    value: function padToTwoDigits(num) {
      var str = num.toString();
      if (str.length < 2) {
        return '0' + str;
      }
      return str;
    }
  }, {
    key: 'formatDateForFilename',
    value: function formatDateForFilename(date) {
      var year = date.getFullYear();
      var month = this.padToTwoDigits(date.getMonth());
      var day = this.padToTwoDigits(date.getDate());
      return '' + year + month + day;
    }
  }, {
    key: 'getTimeSeriesData',
    value: function getTimeSeriesData(date) {
      var formattedDate = this.formatDateForFilename(date);
      return fetch('json/timeseries/' + formattedDate + '.json').then(function (res) {
        return res.json();
      });
    }
  }]);
  return TimeSeriesDataManager;
}();

var dataManager = new TimeSeriesDataManager();

var map = setupBaseLayer();
setupRoutes(map).then(dataManager.getTimeSeriesData(new Date(2017, 1, 20)));

}(L));
