import { ExampleDataGenerator, EMode } from "../ExampleData/ExampleDataGenerator";
import { IChartData } from "../ExampleData/Shapes";

let dataGenerator: ExampleDataGenerator = new ExampleDataGenerator(
    EMode.AutoAdvance,
    (payload: IChartData) => postMessage({ type: 'chart-data', payload: payload }),
    () => postMessage({ type: 'start', payload: { workerSentTime: Date.now() } }),
    () => postMessage({ type: 'stop', payload: { workerSentTime: Date.now() } })
);

onmessage = function (message) {
    switch (message.data.action) {
        case "start":
            console.log('Worker | onMessage | start');
            dataGenerator?.start();
            break;
        case "next":
            console.log('Worker | onMessage | next');
            dataGenerator?.next();
            break;
        case "stop":
            console.log('Worker | onMessage | stop');
            dataGenerator?.stop();
            break;
    }
}