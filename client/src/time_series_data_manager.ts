
import TimeSeriesEntry from './time_series_entry'

export default class TimeSeriesDataManager {

  padToTwoDigits(num: Number) {
    const str = num.toString();
    if (str.length < 2) {
      return '0' + str;
    }
    return str;
  }

  formatDateForFilename(date: Date) {
    const year = date.getFullYear();
    const month = this.padToTwoDigits(date.getMonth() + 1);
    const day = this.padToTwoDigits(date.getDate());
    return `${year}${month}${day}`;
  }

  getTimeSeriesData(date: Date) {
    const formattedDate = this.formatDateForFilename(date);
    return fetch(`json/timeseries/${formattedDate}.json`)
      .then((res: Response) => res.json())
      .then(this.prepareData);
  }

  prepareData(rawData: any): Array<TimeSeriesEntry> {
    return rawData.time_series.map((timeSeriesEntry: any) => {
      if (timeSeriesEntry.departure_time) {
        timeSeriesEntry.departure_time = new Date(`${timeSeriesEntry.departure_time} GMT+1100`);
      }
      if (timeSeriesEntry.arrival_time) {
        timeSeriesEntry.arrival_time = new Date(`${timeSeriesEntry.arrival_time} GMT+1100`);
      }
      return timeSeriesEntry;
    });
  }

}
