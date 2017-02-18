
import TimeSeriesEntry from './time_series_entry'

export default class TimeSeriesDataManager {
  
  private utcOffsetMillis: number = 11 * 60 * 60 * 1000

  padToTwoDigits(num: number) {
    const str = num.toString();
    if (str.length < 2) {
      return '0' + str;
    }
    return str;
  }

  parseDate(dateString: string): Date {
    // Safari seems to treat dates differently to other browsers
    // Therefore this function breaks down the date format manually
    // It is probably not ideal as it is brittle if the date format changes but it will do for now
    // Supported format: 2017-01-21 05:46:00 in AEDT
    let dateComponent, timeComponent, hours, minutes, seconds, day, month, year;
    [dateComponent, timeComponent] = dateString.split(' ');
    [year, month, day] = dateComponent.split('-').map((n) => parseInt(n));
    [hours, minutes, seconds] = timeComponent.split(':').map((n) => parseInt(n));
    let utcTimeMillis = Date.UTC(year, month - 1, day, hours, minutes, seconds)
    return new Date(utcTimeMillis - this.utcOffsetMillis);
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
      .then((data) => this.prepareData(data));
  }

  prepareData(rawData: any): Array<TimeSeriesEntry> {
    return rawData.time_series.map((timeSeriesEntry: any) => {
      if (timeSeriesEntry.departure_time) {
        timeSeriesEntry.departure_time = this.parseDate(timeSeriesEntry.departure_time);
      }
      if (timeSeriesEntry.arrival_time) {
        timeSeriesEntry.arrival_time = this.parseDate(timeSeriesEntry.arrival_time);
      }
      return timeSeriesEntry;
    });
  }

}
