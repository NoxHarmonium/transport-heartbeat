System.register("marker_animator", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var MarkerAnimator;
    return {
        setters: [],
        execute: function () {
            MarkerAnimator = class MarkerAnimator {
                constructor(targetMarker, origin, destination, startTime, endTime) {
                    this.targetMarker = targetMarker;
                    this.origin = origin;
                    this.destination = destination;
                    this.startTime = startTime;
                    this.endTime = endTime;
                }
                tick(time) {
                    const progress = this.clamp((time.valueOf() - this.startTime.valueOf()) /
                        (this.endTime.valueOf() - this.startTime.valueOf()), 0, 1);
                    const latDelta = (this.destination[0] - this.origin[0]) * progress;
                    const lonDelta = (this.destination[1] - this.origin[1]) * progress;
                    if (isNaN(latDelta) || isNaN(lonDelta)) {
                        return;
                    }
                    this.targetMarker.setLatLng([this.origin[0] + latDelta, this.origin[1] + lonDelta]);
                }
                clamp(value, min, max) {
                    return Math.min(Math.max(value, min), max);
                }
            };
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
            TimeController = class TimeController {
                constructor() {
                    this.started = false;
                    this.animationFrameId = 0;
                    this.tickCallbacks = [];
                    this.reset();
                }
                reset() {
                    this.started = false;
                    this.currentTime = new Date(2017, 0, 20, 4, 59);
                    this.rate = 60 * 5; // Seconds per second
                }
                start() {
                    this.started = true;
                    window.requestAnimationFrame(this.tick.bind(this));
                }
                stop() {
                    this.started = false;
                    window.cancelAnimationFrame(this.animationFrameId);
                }
                tick(time) {
                    if (this.lastTickTime) {
                        const delta = (time - this.lastTickTime) * this.rate;
                        this.currentTime = new Date(this.currentTime.getTime() + delta);
                    }
                    if (this.tickCallbacks.length > 0) {
                        this.tickCallbacks.forEach((callback) => callback(this.currentTime));
                    }
                    if (this.started) {
                        this.animationFrameId = window.requestAnimationFrame(this.tick.bind(this));
                    }
                    this.lastTickTime = time;
                }
                registerCallback(callback) {
                    this.tickCallbacks.push(callback);
                }
            };
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
            pulsingIcon = L.icon.pulse({ iconSize: [20, 20], color: 'red' });
            MarkerManager = class MarkerManager {
                constructor(map, timeController) {
                    this.map = map;
                    this.markers = {};
                    this.animators = {};
                    this.markerCooldown = 1000;
                    timeController.registerCallback((time) => this.tick(time));
                }
                destinationFromEvent(event) {
                    return [parseFloat(event.departure_lat), parseFloat(event.departure_lon)];
                }
                arrivalFromEvent(event) {
                    return [parseFloat(event.arrival_lat), parseFloat(event.arrival_lon)];
                }
                eventIsNew(event) {
                    return !(event.id in this.markers);
                }
                eventIsLast(event) {
                    return event.arrival_time === null;
                }
                pingMarker(marker) {
                    const markerElement = marker._icon; // _icon is private but I can't find a public alternative
                    L.DomUtil.removeClass(markerElement, 'marker-pinged');
                    setTimeout(() => {
                        L.DomUtil.addClass(markerElement, 'marker-pinged');
                    }, 0);
                }
                createMarker(event) {
                    const origin = this.destinationFromEvent(event);
                    const destination = this.arrivalFromEvent(event);
                    const marker = L.marker(origin, { icon: pulsingIcon }).addTo(this.map);
                    this.markers[event.id] = marker;
                    if (destination) {
                        this.animators[event.id] = new marker_animator_1.default(marker, origin, destination, event.departure_time, event.arrival_time);
                    }
                    this.pingMarker(marker);
                }
                updateMarker(event) {
                    const origin = this.destinationFromEvent(event);
                    const destination = this.arrivalFromEvent(event);
                    const marker = this.markers[event.id];
                    if (destination) {
                        this.animators[event.id] = new marker_animator_1.default(marker, origin, destination, event.departure_time, event.arrival_time);
                    }
                    marker.setLatLng(origin);
                    this.pingMarker(marker);
                }
                destroyMarker(event) {
                    this.updateMarker(event);
                    const id = event.id;
                    const marker = this.markers[id];
                    const markerElement = marker._icon; // _icon is private but I can't find a public alternative
                    L.DomUtil.addClass(markerElement, 'marker-destroyed');
                    setTimeout(() => {
                        delete this.markers[id];
                        delete this.animators[event.id];
                        this.map.removeLayer(marker);
                    }, this.markerCooldown);
                }
                handleEvent(event) {
                    if (this.eventIsNew(event)) {
                        this.createMarker(event);
                    }
                    else if (this.eventIsLast(event)) {
                        this.destroyMarker(event);
                    }
                    else {
                        this.updateMarker(event);
                    }
                }
                tick(time) {
                    for (const tripId in this.animators) {
                        this.animators[tripId].tick(time);
                    }
                }
            };
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
            fetch('json/routes/bus-lines-simplified.json').then((res) => res.json()),
            fetch('json/routes/tram-lines-simplified.json').then((res) => res.json()),
            fetch('json/routes/train-lines-simplified.json').then((res) => res.json())
        ])
            .then((results) => {
            L.geoJSON(results[0], {
                style: (_) => ({
                    "color": "#FFB74D",
                    "weight": 2,
                    "opacity": 0.25,
                })
            }).addTo(map);
            L.geoJSON(results[1], {
                style: (_) => ({
                    "color": "#7CB342",
                    "weight": 3,
                    "opacity": 0.75,
                })
            }).addTo(map);
            L.geoJSON(results[2], {
                style: (_) => ({
                    "color": "#01579B",
                    "weight": 4,
                    "opacity": 1,
                })
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
            TimeSeriesDataManager = class TimeSeriesDataManager {
                padToTwoDigits(num) {
                    const str = num.toString();
                    if (str.length < 2) {
                        return '0' + str;
                    }
                    return str;
                }
                formatDateForFilename(date) {
                    const year = date.getFullYear();
                    const month = this.padToTwoDigits(date.getMonth() + 1);
                    const day = this.padToTwoDigits(date.getDate());
                    return `${year}${month}${day}`;
                }
                getTimeSeriesData(date) {
                    const formattedDate = this.formatDateForFilename(date);
                    return fetch(`json/timeseries/${formattedDate}.json`)
                        .then((res) => res.json())
                        .then(this.prepareData);
                }
                prepareData(rawData) {
                    return rawData.time_series.map((timeSeriesEntry) => {
                        if (timeSeriesEntry.departure_time) {
                            timeSeriesEntry.departure_time = new Date(`${timeSeriesEntry.departure_time} GMT+1100`);
                        }
                        if (timeSeriesEntry.arrival_time) {
                            timeSeriesEntry.arrival_time = new Date(`${timeSeriesEntry.arrival_time} GMT+1100`);
                        }
                        return timeSeriesEntry;
                    });
                }
            };
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
            TimeSeriesEventEmitter = class TimeSeriesEventEmitter {
                constructor(timeController, timeSeriesData, eventCallback) {
                    this.timeController = timeController;
                    this.timeSeriesData = timeSeriesData;
                    this.eventCallback = eventCallback;
                    timeController.registerCallback(this.tickCallback.bind(this));
                }
                tickCallback(time) {
                    if (!this.eventCallback) {
                        return;
                    }
                    while (time > this.timeSeriesData[0].departure_time) {
                        this.eventCallback(time, this.timeSeriesData.shift());
                    }
                }
            };
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
                .then(() => dataManager.getTimeSeriesData(new Date(2017, 0, 20)))
                .then((data) => {
                timeController.start();
                eventEmitter = new time_series_event_emitter_1.default(timeController, data, (_, event) => {
                    markerManager.handleEvent(event);
                });
                timeController.registerCallback((time) => {
                    let timeIndicatorElement = document.getElementById('time_indicator');
                    if (timeIndicatorElement) {
                        timeIndicatorElement.innerHTML = time.toString();
                    }
                });
            })
                .catch((err) => {
                console.error(err);
            });
        }
    };
});
//# sourceMappingURL=bundle.js.map