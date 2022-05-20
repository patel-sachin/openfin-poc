import {IXyValues} from "./Shapes";

export class RandomWalkGenerator {
    private readonly bias: number;
    private last: number;
    private i: number;
    private shouldStop: boolean;

    constructor(bias: number = 0.01) {
        this.bias = bias;
        this.last = 0;
        this.i = 0;
        this.shouldStop = false;
        this.reset();
    }
    public stop() {
        console.log('RandomWalkGenerator | reset');
        this.shouldStop = true;
    }

    public reset() {
        console.log('RandomWalkGenerator | reset');
        this.i = 0;
        this.last = 0;
        this.shouldStop = false;
    }

    public getRandomWalkSeries(count: number): IXyValues {
        const xValues: number[] = [];
        const yValues: number[] = [];
        for (let i = 0; i < count; i++) {
            if (this.shouldStop) {
                return { xValues, yValues };
            }
            const next: number = this.last + (Math.random() - 0.5 + this.bias);
            xValues.push(this.i++);
            yValues.push(next);
            this.last = next;
        }

        return {xValues, yValues};
    }
}