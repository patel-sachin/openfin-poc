import { RandomWalkGenerator } from "./RandomWalkGenerator";
import { IChartData, ISeriesData } from "./Shapes";

export enum EMode {
    AutoAdvance = 1,
    ManualAdvance = 2,
}

const numberOfPointsPerTimerTick = 1000; // 1,000 points every timer tick
const timerInterval = 200; // timer tick every 10 milliseconds
const maxPoints = 1e6;  //1e6; // max points for a single series before the demo stops
    
export class ExampleDataGenerator {
    private _randomWalkGenerators: RandomWalkGenerator[];
    private _timerId?: NodeJS.Timeout;
    private _dataPointGeneratedCount: number;

    constructor(
        private _mode: EMode,
        private publisherFn: (payload: IChartData) => void,
        private onStartingCallBackFn: () => void,
        private onStopCallBackFn: () => void
    ) {
        this._randomWalkGenerators = [1, 2, 3].map(_ => new RandomWalkGenerator(0));
        this._dataPointGeneratedCount = 0;
    }

    public stop = () => {
        console.log('ExampleDataGenerator | stop');
        if (this._timerId) {
            clearInterval(this._timerId);
        }

        this._timerId = undefined;
        this.onStopCallBackFn();
        this._dataPointGeneratedCount = 0;
        this._randomWalkGenerators.forEach(rw => rw.stop());
        // Disable autoranging on X when the demo is paused. This allows zooming and panning
        // xAxis.autoRange = EAutoRange.Once;
    }

    public next() {
        if (this._mode !== EMode.ManualAdvance) {
            return;
        }
        this.updateFunc();
    }

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
                }
            };

            acc.push(data);
            return acc;
        }, new Array<ISeriesData>());

        this._dataPointGeneratedCount += seriesData[0].data.xValues.length;

        this.publisherFn({
            workerSentTime: Date.now(),
            ipcSentTime: Date.now(),
            counter: this._dataPointGeneratedCount,
            seriesData,
        });
    }

    public start = () => {
        console.log('ExampleDataGenerator | start');
        if (this._timerId) {
            stop();
            this._randomWalkGenerators.forEach((randomWalk, index) => { 
                randomWalk.reset();
            });
        }

        this.onStartingCallBackFn();

        if (this._mode === EMode.AutoAdvance) {
            this._timerId = setInterval(this.updateFunc, timerInterval);
        }
    }
}