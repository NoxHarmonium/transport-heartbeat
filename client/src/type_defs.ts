import TimeSeriesEntry from './time_series_entry'

export type EventCallbackFn = (time: Date, timeSeriesEntry?: TimeSeriesEntry) => void;
export type TickCallbackFn = (time: Date) => void;
