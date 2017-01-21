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
      var month = this.padToTwoDigits(date.getMonth() + 1);
      var day = this.padToTwoDigits(date.getDate());
      return '' + year + month + day;
    }
  }, {
    key: 'getTimeSeriesData',
    value: function getTimeSeriesData(date) {
      var formattedDate = this.formatDateForFilename(date);
      return fetch('json/timeseries/' + formattedDate + '.json').then(function (res) {
        return res.json();
      }).then(this.prepareData);
    }
  }, {
    key: 'prepareData',
    value: function prepareData(rawData) {
      var baseDate = rawData.date.split('T')[0];
      return rawData.time_series.map(function (timeSeriesEntry) {
        var combinedDate = baseDate + 'T' + timeSeriesEntry.departure_time + '+11:00';
        timeSeriesEntry.date = new Date(combinedDate);
        return timeSeriesEntry;
      });
    }
  }]);
  return TimeSeriesDataManager;
}();

var TimeController = function () {
  function TimeController() {
    classCallCheck(this, TimeController);

    this.tickCallbacks = [];
    this.reset();
  }

  createClass(TimeController, [{
    key: "reset",
    value: function reset() {
      this.started = false;
      this.currentTime = new Date(2017, 0, 20);
      this.rate = 60 * 5; // Seconds per second
    }
  }, {
    key: "start",
    value: function start() {
      this.started = true;
      this.tick();
    }
  }, {
    key: "stop",
    value: function stop() {
      this.started = false;
      window.cancelAnimationFrame();
    }
  }, {
    key: "tick",
    value: function tick(time) {
      var _this = this;

      if (this.lastTickTime) {
        var delta = (time - this.lastTickTime) * this.rate;
        this.currentTime = new Date(this.currentTime.getTime() + delta);
      }
      if (this.tickCallbacks.length > 0) {
        this.tickCallbacks.forEach(function (callback) {
          return callback(_this.currentTime);
        });
      }
      if (this.started) {
        window.requestAnimationFrame(this.tick.bind(this));
      }
      this.lastTickTime = time;
    }
  }]);
  return TimeController;
}();

var TimeSeriesEventEmitter = function () {
  function TimeSeriesEventEmitter(timeController, timeSeriesData, eventCallback) {
    classCallCheck(this, TimeSeriesEventEmitter);

    this.timeController = timeController;
    this.timeSeriesData = timeSeriesData;
    this.eventCallback = eventCallback;

    timeController.tickCallbacks.push(this.tickCallback.bind(this));
  }

  createClass(TimeSeriesEventEmitter, [{
    key: "tickCallback",
    value: function tickCallback(time) {
      if (!this.eventCallback) {
        return;
      }

      while (time > this.timeSeriesData[0].date) {
        this.eventCallback(time, this.timeSeriesData.shift());
      }
    }
  }]);
  return TimeSeriesEventEmitter;
}();

var dataManager = new TimeSeriesDataManager();

var map = setupBaseLayer();
var timeController = new TimeController();
var eventEmitter = void 0;

setupRoutes(map).then(function () {
  return dataManager.getTimeSeriesData(new Date(2017, 0, 20));
}).then(function (data) {
  timeController.start();
  eventEmitter = new TimeSeriesEventEmitter(timeController, data, function (eventTime, event) {
    console.log('[' + eventTime + '] Event occurred: ' + JSON.stringify(event, null, 2));
  });
  timeController.tickCallbacks.push(function (time) {
    document.getElementById('time_indicator').innerHTML = time;
  });
}).catch(function (err) {
  console.error(err);
});

}(L));
