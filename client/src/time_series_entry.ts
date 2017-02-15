
interface TimeSeriesEntry {
    id: string;
    name: string;
    departure_lat: string;
    departure_lon: string;
    arrival_lat: string;
    arrival_lon: string;
    departure_time: Date;
    arrival_time: Date;
}

export default TimeSeriesEntry;
