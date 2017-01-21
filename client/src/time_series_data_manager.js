
export default class TimeSeriesDataManager {

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
    const baseDate = rawData.date.split('T')[0];
    return rawData.time_series.map((timeSeriesEntry) => {
      const combinedDate = `${baseDate}T${timeSeriesEntry.departure_time}+11:00`;
      timeSeriesEntry.date = new Date(combinedDate);
      return timeSeriesEntry;
    });
  }

}
