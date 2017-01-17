#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Generates time series data from the PTV GTFS zip files
See: https://www.data.vic.gov.au/data/dataset/ptv-timetable-and-geographic-information-2015-gtfs
See: https://developers.google.com/transit/gtfs/reference
"""

__appname__ = "generate-time-series"
__author__ = "Sean Dawson <contact@seandawson.info>"
__version__ = "0.0.1"
__license__ = "MIT"

import codecs
import json
import logging
import os
import sqlite3
import sys
import unicodecsv as csv

from dateutil.parser import parse as parse_date
from datetime_encoder import DateTimeEncoder

LOG = logging.getLogger(__name__)

def validate_paths(folder_path):
    if not os.path.isdir(folder_path):
        sys.exit("Invalid folder path: " + folder_path)
    stop_times_filename = os.path.join(folder_path, 'stop_times.txt')
    if not os.path.exists(stop_times_filename):
        sys.exit("Missing file: 'stop_times.txt'")
    stops_filename = os.path.join(folder_path, 'stops.txt')
    if not os.path.exists(stops_filename):
        sys.exit("Missing file: 'stops.txt'")
    calendar_filename = os.path.join(folder_path, 'calendar.txt')
    if not os.path.exists(calendar_filename):
        sys.exit("Missing file: 'calendar.txt'")
    return stops_filename, stop_times_filename, calendar_filename

def create_temp_db():
    return sqlite3.connect(":memory:")

def process_stops(database, stops_filename):
    cur = database.cursor()
    cur.execute("CREATE TABLE stops (id PRIMARY KEY, name, lat, lon);")
    with codecs.open(stops_filename, encoding='utf-8-sig') as stop_file:
        dict_reader = csv.UnicodeCSVDictReader(stop_file)
        to_db = [(i['stop_id'], i['stop_name'], i['stop_lat'], i['stop_lon']) for i in dict_reader]

    cur.executemany("INSERT INTO stops (id, name, lat, lon) VALUES (?, ?, ?, ?);", to_db)
    database.commit()

def process_stop_times(database, stop_times_filename):
    cur = database.cursor()
    cur.execute("CREATE TABLE stop_times (id, sequence, stop_id, departure_time, service_id, " +
                "FOREIGN KEY(stop_id) REFERENCES stops(id) " +
                "FOREIGN KEY(service_id) REFERENCES calendar(id) " +
                "PRIMARY KEY (id, sequence));")
    with codecs.open(stop_times_filename, encoding='utf-8-sig') as stop_times_file:
        dict_reader = csv.UnicodeCSVDictReader(stop_times_file)
        to_db = [(i['trip_id'],
                  i['stop_sequence'],
                  i['stop_id'],
                  i['departure_time'],
                  i['trip_id'].split('.')[1]) for i in dict_reader]

    cur.executemany("INSERT INTO stop_times " +
                    "(id, sequence, stop_id, departure_time, service_id) " +
                    "VALUES (?, ?, ?, ?, ?);", to_db)
    database.commit()

def generate_day_mask(csv_dict):
    return int(csv_dict['sunday'] +
               csv_dict['saturday'] +
               csv_dict['friday'] +
               csv_dict['thursday'] +
               csv_dict['wednesday'] +
               csv_dict['tuesday'] +
               csv_dict['monday'], 2)

def day_of_week_to_mask(day_of_week):
    if day_of_week < 0 or day_of_week > 6:
        sys.exit("Invalid day of week: " + str(day_of_week))
    return 1 << day_of_week

def process_calendar(database, calendar_filename):
    cur = database.cursor()
    cur.execute("CREATE TABLE calendar (id, day_mask, start_date, end_date, " +
                "PRIMARY KEY (id));")
    with codecs.open(calendar_filename, encoding='utf-8-sig') as calendar_file:
        dict_reader = csv.UnicodeCSVDictReader(calendar_file)
        to_db = [(i['service_id'],
                  generate_day_mask(i),
                  parse_date(i['start_date']),
                  parse_date(i['end_date'])) for i in dict_reader]

    cur.executemany("INSERT INTO calendar (id, day_mask, start_date, end_date)" +
                    "VALUES (?, ?, ?, ?);", to_db)
    database.commit()

def write_data(database, output_filename, date):
    cur = database.cursor()
    day_of_week = day_of_week_to_mask(date.weekday())
    cur.execute("SELECT s.name, s.lat, s.lon, st.departure_time, c.day_mask " +
                "FROM stop_times st " +
                "INNER JOIN stops s ON s.id = st.stop_id " +
                "INNER JOIN calendar c ON c.id = st.service_id " +
                "WHERE (c.day_mask & ?) == ? " +
                "AND   (c.start_date <= ? AND c.end_date >= ?) " +
                "ORDER BY st.departure_time ",
                (day_of_week, day_of_week, date, date))

    columns = [d[0] for d in cur.description]
    dict_with_rows = [dict(zip(columns, row)) for row in cur.fetchall()]
    json_structure = {
        'date': date,
        'time_series': dict_with_rows
    }
    with open(output_filename, 'w') as output_file:
        json.dump(json_structure, output_file, cls=DateTimeEncoder)

def process_folder(folder_path, output_filename, date):
    LOG.info('Validating paths...')
    stops_filename, stop_times_filename, calendar_filename = validate_paths(folder_path)
    LOG.info('Initialising temporary database...')
    database = create_temp_db()
    LOG.info('Reading calendar data...')
    process_calendar(database, calendar_filename)
    LOG.info('Reading stops data...')
    process_stops(database, stops_filename)
    LOG.info('Reading stop times data...')
    process_stop_times(database, stop_times_filename)
    LOG.info('Dumping JSON...')
    write_data(database, output_filename, date)
    database.close()
    LOG.info('Done')

def main():
    # Example usage: ./generate_time_series.py -d data/trains/ -o test.json
    from optparse import OptionParser
    parser = OptionParser(version="%%prog v%s" % __version__,
                          usage="%prog [options] <argument> ...",
                          description=__doc__.replace('\r\n', '\n').split('\n--snip--\n')[0])

    parser.add_option("-d", "--data_folder", dest="data_folder",
                      help="Directory to read the PT data from")
    parser.add_option("-o", "--output_filename", dest="output_filename",
                      help="File to write the output to (e.g. data.json)")
    parser.add_option("-D", "--date", dest="raw_date",
                      help="Date to dump PT data for")
    parser.add_option('-v', '--verbose', action="count", dest="verbose",
                      default=3, help="Increase the verbosity. Use twice for extra effect")
    parser.add_option('-q', '--quiet', action="count", dest="quiet",
                      default=0, help="Decrease the verbosity. Use twice for extra effect")
    #Reminder: %default can be used in help strings.

    # Allow pre-formatted descriptions
    parser.formatter.format_description = lambda description: description

    opts, _ = parser.parse_args()

    for required in ['data_folder', 'output_filename', 'raw_date']:
        if opts.__dict__[required] is None:
            parser.error("parameter %s required" % required)

    # Set up clean logging to stderr
    log_levels = [logging.CRITICAL, logging.ERROR, logging.WARNING,
                  logging.INFO, logging.DEBUG]
    opts.verbose = min(opts.verbose - opts.quiet, len(log_levels) - 1)
    opts.verbose = max(opts.verbose, 0)
    logging.basicConfig(level=log_levels[opts.verbose],
                        format='%(levelname)s: %(message)s')

    date = parse_date(opts.raw_date)
    process_folder(opts.data_folder, opts.output_filename, date)

if __name__ == '__main__':
    main()
