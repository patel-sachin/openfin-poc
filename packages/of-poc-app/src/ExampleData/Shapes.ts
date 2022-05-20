export interface IXyValues {
    xValues: number[];
    yValues: number[];
}

export interface ISeriesData {
    index: number;
    data: IXyValues;
}
export interface IChartData {
    workerSentTime: number,
    ipcSentTime: number,
    counter: number;
    seriesData: ISeriesData[];
}