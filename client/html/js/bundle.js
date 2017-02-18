System.register("marker_animator", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var MarkerAnimator;
    return {
        setters: [],
        execute: function () {
            MarkerAnimator = (function () {
                function MarkerAnimator(targetMarker, origin, destination, startTime, endTime) {
                    this.targetMarker = targetMarker;
                    this.origin = origin;
                    this.destination = destination;
                    this.startTime = startTime;
                    this.endTime = endTime;
                    if (endTime == null) {
                        throw Error('Cannot animate to a null end time');
                    }
                }
                MarkerAnimator.prototype.tick = function (time) {
                    var progress = this.clamp((time.valueOf() - this.startTime.valueOf()) /
                        (this.endTime.valueOf() - this.startTime.valueOf()), 0, 1);
                    var latDelta = (this.destination[0] - this.origin[0]) * progress;
                    var lonDelta = (this.destination[1] - this.origin[1]) * progress;
                    if (isNaN(latDelta) || isNaN(lonDelta)) {
                        return;
                    }
                    this.targetMarker.setLatLng([this.origin[0] + latDelta, this.origin[1] + lonDelta]);
                };
                MarkerAnimator.prototype.clamp = function (value, min, max) {
                    return Math.min(Math.max(value, min), max);
                };
                return MarkerAnimator;
            }());
            exports_1("default", MarkerAnimator);
        }
    };
});
System.register("time_series_entry", [], function (exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("type_defs", [], function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("time_controller", [], function (exports_4, context_4) {
    "use strict";
    var __moduleName = context_4 && context_4.id;
    var TimeController;
    return {
        setters: [],
        execute: function () {
            TimeController = (function () {
                function TimeController() {
                    this.started = false;
                    this.animationFrameId = 0;
                    this.tickCallbacks = [];
                    this.reset();
                }
                TimeController.prototype.reset = function () {
                    this.started = false;
                    this.currentTime = new Date(2017, 0, 20, 4, 59);
                    this.rate = 60 * 5; // Seconds per second
                };
                TimeController.prototype.start = function () {
                    this.started = true;
                    window.requestAnimationFrame(this.tick.bind(this));
                };
                TimeController.prototype.stop = function () {
                    this.started = false;
                    window.cancelAnimationFrame(this.animationFrameId);
                };
                TimeController.prototype.tick = function (time) {
                    var _this = this;
                    if (this.lastTickTime) {
                        var delta = (time - this.lastTickTime) * this.rate;
                        this.currentTime = new Date(this.currentTime.getTime() + delta);
                    }
                    if (this.tickCallbacks.length > 0) {
                        this.tickCallbacks.forEach(function (callback) { return callback(_this.currentTime); });
                    }
                    if (this.started) {
                        this.animationFrameId = window.requestAnimationFrame(this.tick.bind(this));
                    }
                    this.lastTickTime = time;
                };
                TimeController.prototype.registerCallback = function (callback) {
                    this.tickCallbacks.push(callback);
                };
                return TimeController;
            }());
            exports_4("default", TimeController);
        }
    };
});
System.register("marker_manager", ["marker_animator"], function (exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    var marker_animator_1, pulsingIcon, MarkerManager;
    return {
        setters: [
            function (marker_animator_1_1) {
                marker_animator_1 = marker_animator_1_1;
            }
        ],
        execute: function () {
            // FutureWork: Create type definitions for leaflet-icon-pulse
            pulsingIcon = L.icon.pulse({ iconSize: [20, 20], color: 'red' });
            MarkerManager = (function () {
                function MarkerManager(map, timeController) {
                    var _this = this;
                    this.map = map;
                    this.markers = {};
                    this.animators = {};
                    this.markerCooldown = 1000;
                    timeController.registerCallback(function (time) { return _this.tick(time); });
                }
                MarkerManager.prototype.destinationFromEvent = function (event) {
                    return [parseFloat(event.departure_lat), parseFloat(event.departure_lon)];
                };
                MarkerManager.prototype.arrivalFromEvent = function (event) {
                    return [parseFloat(event.arrival_lat), parseFloat(event.arrival_lon)];
                };
                MarkerManager.prototype.eventIsNew = function (event) {
                    return !(event.id in this.markers);
                };
                MarkerManager.prototype.eventIsLast = function (event) {
                    return event.arrival_time === null;
                };
                MarkerManager.prototype.pingMarker = function (marker) {
                    var markerElement = marker._icon; // _icon is private but I can't find a public alternative
                    L.DomUtil.removeClass(markerElement, 'marker-pinged');
                    setTimeout(function () {
                        L.DomUtil.addClass(markerElement, 'marker-pinged');
                    }, 0);
                };
                MarkerManager.prototype.createMarker = function (event) {
                    var origin = this.destinationFromEvent(event);
                    var destination = this.arrivalFromEvent(event);
                    var marker = L.marker(origin, { icon: pulsingIcon }).addTo(this.map);
                    this.markers[event.id] = marker;
                    if (destination) {
                        this.animators[event.id] = new marker_animator_1.default(marker, origin, destination, event.departure_time, event.arrival_time);
                    }
                    this.pingMarker(marker);
                };
                MarkerManager.prototype.updateMarker = function (event) {
                    var origin = this.destinationFromEvent(event);
                    var destination = this.arrivalFromEvent(event);
                    var marker = this.markers[event.id];
                    if (destination) {
                        this.animators[event.id] = new marker_animator_1.default(marker, origin, destination, event.departure_time, event.arrival_time);
                    }
                    marker.setLatLng(origin);
                    this.pingMarker(marker);
                };
                MarkerManager.prototype.destroyMarker = function (event) {
                    var _this = this;
                    var id = event.id;
                    var marker = this.markers[id];
                    var markerElement = marker._icon; // _icon is private but I can't find a public alternative
                    L.DomUtil.addClass(markerElement, 'marker-destroyed');
                    setTimeout(function () {
                        delete _this.markers[id];
                        delete _this.animators[event.id];
                        _this.map.removeLayer(marker);
                    }, this.markerCooldown);
                };
                MarkerManager.prototype.handleEvent = function (event) {
                    if (this.eventIsLast(event)) {
                        this.destroyMarker(event);
                    }
                    else if (this.eventIsNew(event)) {
                        this.createMarker(event);
                    }
                    else {
                        this.updateMarker(event);
                    }
                };
                MarkerManager.prototype.tick = function (time) {
                    for (var tripId in this.animators) {
                        this.animators[tripId].tick(time);
                    }
                };
                return MarkerManager;
            }());
            exports_5("default", MarkerManager);
        }
    };
});
System.register("setup_base_layer", [], function (exports_6, context_6) {
    "use strict";
    var __moduleName = context_6 && context_6.id;
    function setupBaseLayer() {
        var layer = new L.StamenTileLayer("toner-background", {
            opacity: 0.5,
        });
        var map = new L.Map("mapid", {
            center: new L.LatLng(-37.8136, 144.9631),
            zoom: 12,
        });
        map.addLayer(layer);
        return map;
    }
    exports_6("default", setupBaseLayer);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("setup_routes", [], function (exports_7, context_7) {
    "use strict";
    var __moduleName = context_7 && context_7.id;
    function setupRoutes(map) {
        return Promise.all([
            fetch('json/routes/bus-lines-simplified.json').then(function (res) { return res.json(); }),
            fetch('json/routes/tram-lines-simplified.json').then(function (res) { return res.json(); }),
            fetch('json/routes/train-lines-simplified.json').then(function (res) { return res.json(); })
        ])
            .then(function (results) {
            L.geoJSON(results[0], {
                style: function (_) { return ({
                    "color": "#FFB74D",
                    "weight": 2,
                    "opacity": 0.25,
                }); }
            }).addTo(map);
            L.geoJSON(results[1], {
                style: function (_) { return ({
                    "color": "#7CB342",
                    "weight": 3,
                    "opacity": 0.75,
                }); }
            }).addTo(map);
            L.geoJSON(results[2], {
                style: function (_) { return ({
                    "color": "#01579B",
                    "weight": 4,
                    "opacity": 1,
                }); }
            }).addTo(map);
            map.createPane('labels');
            map.getPane('labels').style.zIndex = "650";
            map.getPane('labels').style.pointerEvents = 'none';
            var layer = new L.StamenTileLayer("toner-labels", {
                pane: 'labels'
            });
            map.addLayer(layer);
        });
    }
    exports_7("default", setupRoutes);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("time_series_data_manager", [], function (exports_8, context_8) {
    "use strict";
    var __moduleName = context_8 && context_8.id;
    var TimeSeriesDataManager;
    return {
        setters: [],
        execute: function () {
            TimeSeriesDataManager = (function () {
                function TimeSeriesDataManager() {
                    this.utcOffsetMillis = 11 * 60 * 60 * 1000;
                }
                TimeSeriesDataManager.prototype.padToTwoDigits = function (num) {
                    var str = num.toString();
                    if (str.length < 2) {
                        return '0' + str;
                    }
                    return str;
                };
                TimeSeriesDataManager.prototype.parseDate = function (dateString) {
                    // Safari seems to treat dates differently to other browsers
                    // Therefore this function breaks down the date format manually
                    // It is probably not ideal as it is brittle if the date format changes but it will do for now
                    // Supported format: 2017-01-21 05:46:00 in AEDT
                    var dateComponent, timeComponent, hours, minutes, seconds, day, month, year;
                    _a = dateString.split(' '), dateComponent = _a[0], timeComponent = _a[1];
                    _b = dateComponent.split('-').map(function (n) { return parseInt(n); }), year = _b[0], month = _b[1], day = _b[2];
                    _c = timeComponent.split(':').map(function (n) { return parseInt(n); }), hours = _c[0], minutes = _c[1], seconds = _c[2];
                    var utcTimeMillis = Date.UTC(year, month - 1, day, hours, minutes, seconds);
                    return new Date(utcTimeMillis - this.utcOffsetMillis);
                    var _a, _b, _c;
                };
                TimeSeriesDataManager.prototype.formatDateForFilename = function (date) {
                    var year = date.getFullYear();
                    var month = this.padToTwoDigits(date.getMonth() + 1);
                    var day = this.padToTwoDigits(date.getDate());
                    return "" + year + month + day;
                };
                TimeSeriesDataManager.prototype.getTimeSeriesData = function (date) {
                    var _this = this;
                    var formattedDate = this.formatDateForFilename(date);
                    return fetch("json/timeseries/" + formattedDate + ".json")
                        .then(function (res) { return res.json(); })
                        .then(function (data) { return _this.prepareData(data); });
                };
                TimeSeriesDataManager.prototype.prepareData = function (rawData) {
                    var _this = this;
                    return rawData.time_series.map(function (timeSeriesEntry) {
                        if (timeSeriesEntry.departure_time) {
                            timeSeriesEntry.departure_time = _this.parseDate(timeSeriesEntry.departure_time);
                        }
                        if (timeSeriesEntry.arrival_time) {
                            timeSeriesEntry.arrival_time = _this.parseDate(timeSeriesEntry.arrival_time);
                        }
                        return timeSeriesEntry;
                    });
                };
                return TimeSeriesDataManager;
            }());
            exports_8("default", TimeSeriesDataManager);
        }
    };
});
System.register("time_series_event_emitter", [], function (exports_9, context_9) {
    "use strict";
    var __moduleName = context_9 && context_9.id;
    var TimeSeriesEventEmitter;
    return {
        setters: [],
        execute: function () {
            TimeSeriesEventEmitter = (function () {
                function TimeSeriesEventEmitter(timeController, timeSeriesData, eventCallback) {
                    this.timeController = timeController;
                    this.timeSeriesData = timeSeriesData;
                    this.eventCallback = eventCallback;
                    timeController.registerCallback(this.tickCallback.bind(this));
                }
                TimeSeriesEventEmitter.prototype.tickCallback = function (time) {
                    if (!this.eventCallback) {
                        return;
                    }
                    while (time > this.timeSeriesData[0].departure_time) {
                        this.eventCallback(time, this.timeSeriesData.shift());
                    }
                };
                return TimeSeriesEventEmitter;
            }());
            exports_9("default", TimeSeriesEventEmitter);
        }
    };
});
System.register("main", ["marker_manager", "setup_base_layer", "setup_routes", "time_controller", "time_series_data_manager", "time_series_event_emitter"], function (exports_10, context_10) {
    "use strict";
    var __moduleName = context_10 && context_10.id;
    var marker_manager_js_1, setup_base_layer_1, setup_routes_1, time_controller_1, time_series_data_manager_1, time_series_event_emitter_1, dataManager, map, timeController, markerManager, eventEmitter;
    return {
        setters: [
            function (marker_manager_js_1_1) {
                marker_manager_js_1 = marker_manager_js_1_1;
            },
            function (setup_base_layer_1_1) {
                setup_base_layer_1 = setup_base_layer_1_1;
            },
            function (setup_routes_1_1) {
                setup_routes_1 = setup_routes_1_1;
            },
            function (time_controller_1_1) {
                time_controller_1 = time_controller_1_1;
            },
            function (time_series_data_manager_1_1) {
                time_series_data_manager_1 = time_series_data_manager_1_1;
            },
            function (time_series_event_emitter_1_1) {
                time_series_event_emitter_1 = time_series_event_emitter_1_1;
            }
        ],
        execute: function () {
            dataManager = new time_series_data_manager_1.default();
            map = setup_base_layer_1.default();
            timeController = new time_controller_1.default();
            markerManager = new marker_manager_js_1.default(map, timeController);
            setup_routes_1.default(map)
                .then(function () { return dataManager.getTimeSeriesData(new Date(2017, 0, 20)); })
                .then(function (data) {
                timeController.start();
                eventEmitter = new time_series_event_emitter_1.default(timeController, data, function (_, event) {
                    markerManager.handleEvent(event);
                });
                timeController.registerCallback(function (time) {
                    var timeIndicatorElement = document.getElementById('time_indicator');
                    if (timeIndicatorElement) {
                        timeIndicatorElement.innerHTML = time.toString();
                    }
                });
            })
                .catch(function (err) {
                console.error(err);
            });
        }
    };
});
//# sourceMappingURL=bundle.js.map