// eslint-disable-next-line import/namespace
import { RandomWalkGenerator } from './RandomWalkGenerator';
import { IChartData, ILineSeriesData, ISeriesData } from './Shapes';

export enum EMode {
    AutoAdvance = 1,
    ManualAdvance = 2,
}

const numberOfPointsPerTimerTick = 1000; // 1,000 points every timer tick
const timerInterval = 200; // timer tick every 10 milliseconds
const maxPoints = 1e6; //1e6; // max points for a single series before the demo stops

export class ExampleDataGenerator {
    private _randomWalkGenerators: RandomWalkGenerator[];
    private _timerId?: NodeJS.Timeout;
    private _dataPointGeneratedCount: number;

    constructor(private _mode: EMode, private publisherFn: (payload: IChartData) => void) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this._randomWalkGenerators = [1, 2, 3].map((_) => new RandomWalkGenerator(0));
        this._dataPointGeneratedCount = 0;
    }

    public start = () => {
        console.log('ExampleDataGenerator | start');
        if (this._timerId) {
            stop();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            this._randomWalkGenerators.forEach((randomWalk, index) => {
                randomWalk.reset();
            });
        }

        this.publisherFn(ExampleDataGenerator.getStartRequest());

        if (this._mode === EMode.AutoAdvance) {
            this._timerId = setInterval(this.updateFunc, timerInterval);
        }
    };

    public next() {
        if (this._mode !== EMode.ManualAdvance) {
            return;
        }
        this.updateFunc();
    }

    public stop = () => {
        console.log('ExampleDataGenerator | stop');
        if (this._timerId) {
            clearInterval(this._timerId);
        }

        this._timerId = undefined;
        this.publisherFn(ExampleDataGenerator.getStopRequest());
        this._dataPointGeneratedCount = 0;
        this._randomWalkGenerators.forEach((rw) => rw.stop());
        // Disable autoranging on X when the demo is paused. This allows zooming and panning
        // xAxis.autoRange = EAutoRange.Once;
    };

    private updateFunc = () => {
        if (this._dataPointGeneratedCount >= maxPoints) {
            this.stop();
            return;
        }

        const seriesData = this._randomWalkGenerators.reduce((acc, current, index) => {
            if (this._mode === EMode.AutoAdvance && !this._timerId) {
                return acc;
            }

            // Get the next N random walk x,y values
            const { xValues, yValues } = current.getRandomWalkSeries(numberOfPointsPerTimerTick);

            const data: ISeriesData = {
                index: index,
                data: {
                    xValues,
                    yValues,
                },
            };

            acc.push(data);
            return acc;
        }, new Array<ISeriesData>());

        this._dataPointGeneratedCount += seriesData[0].data.xValues.length;

        this.publisherFn({
            type: 'series-data',
            data: {
                workerSentTime: Date.now(),
                ipcSentTime: Date.now(),
                counter: this._dataPointGeneratedCount,
                seriesData,
            },
        });
    };

    public static getStartRequest(): IChartData {
        return { type: 'start', data: null };
    }

    public static getStopRequest(): IChartData {
        return { type: 'stop', data: null };
    }

    private static getChartDataPublishMessage(data: ILineSeriesData): IChartData {
        return { type: 'series-data', data };
    }
}
