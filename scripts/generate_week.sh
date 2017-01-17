#!/usr/bin/env bash

./generate_time_series.py -vv -d data/trains -o output/20170120.json -D 2017-01-20 # Friday
./generate_time_series.py -vv -d data/trains -o output/20170121.json -D 2017-01-21 # Saturday
./generate_time_series.py -vv -d data/trains -o output/20170122.json -D 2017-01-22 # Sunday
./generate_time_series.py -vv -d data/trains -o output/20170123.json -D 2017-01-23 # Monday
./generate_time_series.py -vv -d data/trains -o output/20170124.json -D 2017-01-24 # Tuesday
./generate_time_series.py -vv -d data/trains -o output/20170125.json -D 2017-01-25 # Wednesday
./generate_time_series.py -vv -d data/trains -o output/20170126.json -D 2017-01-26 # Thursday