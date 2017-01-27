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
        if (timeSeriesEntry.departure_time) {
          timeSeriesEntry.departure_time = new Date(timeSeriesEntry.departure_time + ' GMT+1100');
        }
        if (timeSeriesEntry.arrival_time) {
          timeSeriesEntry.arrival_time = new Date(timeSeriesEntry.arrival_time + ' GMT+1100');
        }
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
      this.currentTime = new Date(2017, 0, 20, 4, 59);
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

      while (time > this.timeSeriesData[0].departure_time) {
        this.eventCallback(time, this.timeSeriesData.shift());
      }
    }
  }]);
  return TimeSeriesEventEmitter;
}();

var MarkerAnimator = function () {
    function MarkerAnimator(targetMarker, origin, destination, startTime, endTime) {
        classCallCheck(this, MarkerAnimator);

        this.targetMarker = targetMarker;
        this.origin = origin;
        this.destination = destination;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    createClass(MarkerAnimator, [{
        key: "tick",
        value: function tick(time) {
            var progress = this.clamp((time - this.startTime) / (this.endTime - this.startTime), 0, 1);
            var latDelta = (this.destination[0] - this.origin[0]) * progress;
            var lonDelta = (this.destination[1] - this.origin[1]) * progress;
            if (isNaN(latDelta) || isNaN(lonDelta)) {
                return;
            }
            this.targetMarker.setLatLng([this.origin[0] + latDelta, this.origin[1] + lonDelta]);
        }
    }, {
        key: "clamp",
        value: function clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        }
    }]);
    return MarkerAnimator;
}();

/*
{
"departure_lat": "-38.2158144726992",
"name": "Waurn Ponds Railway Station (Waurn Ponds)",
"arrival_lon": "144.35505671194",
"arrival_time": "2017-01-20 04:37:00",
"departure_lon": "144.30681939977",
"arrival_lat": "-38.1985490047076",
"id": "5830.T0.1-V23-D-mjp-1.22.R",
"departure_time": "2017-01-20 04:32:00"
}*/
var pulsingIcon = L.icon.pulse({ iconSize: [20, 20], color: 'red' });

var MarkerManager = function () {
  function MarkerManager(map, timeController) {
    var _this = this;

    classCallCheck(this, MarkerManager);

    this.map = map;
    this.markers = {};
    this.animators = {};
    this.markerCooldown = 1000;
    timeController.tickCallbacks.push(function (time) {
      return _this.tick(time);
    });
  }

  createClass(MarkerManager, [{
    key: 'destinationFromEvent',
    value: function destinationFromEvent(event) {
      return [parseFloat(event.departure_lat), parseFloat(event.departure_lon)];
    }
  }, {
    key: 'arrivalFromEvent',
    value: function arrivalFromEvent(event) {
      return [parseFloat(event.arrival_lat), parseFloat(event.arrival_lon)];
    }
  }, {
    key: 'eventIsNew',
    value: function eventIsNew(event) {
      return !(event.id in this.markers);
    }
  }, {
    key: 'eventIsLast',
    value: function eventIsLast(event) {
      return event.arrival_time === null;
    }
  }, {
    key: 'createMarker',
    value: function createMarker(event) {
      var origin = this.destinationFromEvent(event);
      var destination = this.arrivalFromEvent(event);
      var marker$$1 = L.marker(origin, { icon: pulsingIcon }).addTo(this.map);
      this.markers[event.id] = marker$$1;
      if (destination) {
        this.animators[event.id] = new MarkerAnimator(marker$$1, origin, destination, event.departure_time, event.arrival_time);
      }
    }
  }, {
    key: 'updateMarker',
    value: function updateMarker(event) {
      var origin = this.destinationFromEvent(event);
      var destination = this.arrivalFromEvent(event);
      var marker$$1 = this.markers[event.id];
      if (destination) {
        this.animators[event.id] = new MarkerAnimator(marker$$1, origin, destination, event.departure_time, event.arrival_time);
      }
      marker$$1.setLatLng(origin);
    }
  }, {
    key: 'destroyMarker',
    value: function destroyMarker(event) {
      var _this2 = this;

      this.updateMarker(event);
      var id = event.id;
      var marker$$1 = this.markers[id];
      L.DomUtil.addClass(marker$$1._icon, 'marker-destroyed');
      setTimeout(function () {
        delete _this2.markers[id];
        delete _this2.animators[event.id];
        _this2.map.removeLayer(marker$$1);
      }, this.markerCooldown);
    }
  }, {
    key: 'handleEvent',
    value: function handleEvent(event) {
      if (this.eventIsNew(event)) {
        this.createMarker(event);
      } else if (this.eventIsLast(event)) {
        this.destroyMarker(event);
      } else {
        this.updateMarker(event);
      }
    }
  }, {
    key: 'tick',
    value: function tick(time) {
      for (var tripId in this.animators) {
        this.animators[tripId].tick(time);
      }
    }
  }]);
  return MarkerManager;
}();

var dataManager = new TimeSeriesDataManager();

var map = setupBaseLayer();
var timeController = new TimeController();
var markerManager = new MarkerManager(map, timeController);
var eventEmitter = void 0;

setupRoutes(map).then(function () {
  return dataManager.getTimeSeriesData(new Date(2017, 0, 20));
}).then(function (data) {
  timeController.start();
  eventEmitter = new TimeSeriesEventEmitter(timeController, data, function (eventTime, event) {
    markerManager.handleEvent(event);
  });
  timeController.tickCallbacks.push(function (time) {
    document.getElementById('time_indicator').innerHTML = time;
  });
}).catch(function (err) {
  console.error(err);
});

}(L));
