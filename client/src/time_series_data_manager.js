
export default class TimeSeriesDataManager {

  padToTwoDigits(num) {
    const str = num.toString()
    if (str.length < 2) {
      return '0' + str
    }
    return str
  }

  formatDateForFilename(date) {
    const year = date.getFullYear()
    const month = this.padToTwoDigits(date.getMonth())
    const day = this.padToTwoDigits(date.getDate())
    return `${year}${month}${day}`
  }

  getTimeSeriesData(date) {
    const formattedDate = this.formatDateForFilename(date)
    return fetch(`json/timeseries/${formattedDate}.json`)
      .then((res) => res.json())
  }

}
