"""
Utilities for generate_time_series.py
"""

from itertools import islice, chain
from datetime import datetime, timedelta, time

def window(seq, window_size=2, pad_right_edge=False):
    """Returns a sliding window (of width n) over data from the iterable
        s -> (s0,s1,...s[n-1]), (s1,s2,...,sn), ..."""

    # If pad_right_edge is true the window will run over the edge
    # E.g. window([0, 1], 2, True) -> [(0, 1), (1, None)]
    if pad_right_edge:
        seq = chain(seq, [None] * (window_size - 1))

    it = iter(seq)
    result = tuple(islice(it, window_size))
    if len(result) == window_size:
        yield result
    for elem in it:
        result = result[1:] + (elem,)
        yield result

def parse_time_with_base_date(time_string, base_date):
    if time_string == None or base_date == None:
        return None

    hour = int(time_string.split(':')[0])
    minute = int(time_string.split(':')[1])
    second = int(time_string.split(':')[2])

    if hour > 23:
        hour -= 23
        base_date = base_date + timedelta(days=1)

    time_component = time(hour, minute, second)
    output = datetime.combine(base_date.date(), time_component)
    return output

def safe_get(dictionary, key, default=None):
    if dictionary is None:
        return default
    return dictionary[key]
