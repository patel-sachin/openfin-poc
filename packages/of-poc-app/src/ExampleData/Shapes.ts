export interface IXyValues {
    xValues: number[];
    yValues: number[];
}

export interface ISeriesData {
    index: number;
    data: IXyValues;
}

export interface IChartData {
    type: 'start' | 'stop' | 'next' | 'series-data' | 'time-series-data' | 'orders-data';
    data: ILineSeriesData | ITimeSeriesData | IOrderData | null;
}

export interface ILineSeriesData {
    workerSentTime: number;
    ipcSentTime: number;
    counter: number;
    seriesData: ISeriesData[];
}

export interface ITimeSeriesData {
    workerSentTime: number;
    ipcSentTime: number;
    time: number;
    price: number;
}

export interface IOrderData {
    workerSentTime: number;
    ipcSentTime: number;
    time: number;
    price: number;
    orderId: string;
    side: string;
}
