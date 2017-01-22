"""
Utilities for generate_time_series.py
"""

from itertools import islice
from datetime import datetime, timedelta, time

def window(seq, window_size=2):
    """Returns a sliding window (of width n) over data from the iterable
        s -> (s0,s1,...s[n-1]), (s1,s2,...,sn), ..."""
    it = iter(seq)
    result = tuple(islice(it, window_size))
    if len(result) == window_size:
        yield result
    for elem in it:
        result = result[1:] + (elem,)
        yield result

def parse_time_with_base_date(time_string, base_date):
    hour = int(time_string.split(':')[0])
    minute = int(time_string.split(':')[1])
    second = int(time_string.split(':')[2])

    if hour > 23:
        hour -= 23
        base_date = base_date + timedelta(days=1)

    time_component = time(hour, minute, second)
    output = datetime.combine(base_date.date(), time_component)
    return output
