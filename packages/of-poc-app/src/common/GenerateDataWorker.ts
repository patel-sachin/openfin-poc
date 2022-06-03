import { ExampleDataGenerator, EMode } from '../ExampleData/ExampleDataGenerator';
import { IChartData } from '../ExampleData/Shapes';

const dataGenerator: ExampleDataGenerator = new ExampleDataGenerator(EMode.AutoAdvance, (payload: IChartData) =>
    postMessage(payload)
);

onmessage = function (message: MessageEvent<IChartData>) {
    switch (message.data.type) {
        case 'start':
            console.log('Worker | onMessage | start');
            dataGenerator.start();
            break;
        case 'next':
            console.log('Worker | onMessage | next');
            dataGenerator.next();
            break;
        case 'stop':
            console.log('Worker | onMessage | stop');
            dataGenerator.stop();
            break;
    }
};
