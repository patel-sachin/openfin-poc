import { ChannelProvider } from "openfin-adapter/src/api/interappbus/channel/provider";
import { fin } from "openfin-adapter/src/mock";
import { pubSubChannelProviderId, ETopic } from "./messaging";

export class IpcBusPublisher {
    private static instance: IpcBusPublisher;
    private _isDefaultActionSet: boolean;
    private _worker: Worker;
    private _isDataGenerationStopped: boolean;
    
    private constructor(private _isRunningInOpenFin: boolean, private _channelProvider?: ChannelProvider) {
        this._isDefaultActionSet = false;
        this._isDataGenerationStopped = false;
        Object.values(ETopic).forEach(v => this.registerTopic(v, this._channelProvider));

        this._worker = new Worker(new URL('./GenerateDataWorker.ts', import.meta.url));
        this._worker.onmessage = (message) => this.handleWorkerMessage(message);
    }

    private async handleWorkerMessage(message: any) {
        if (!message) {
            return;
        };

        switch (message.data.type) {
            case 'chart-data':
                this.publishTopicDataAsync(ETopic.ChartData, message.data.payload);
                break;
            case 'start':
                this._isDataGenerationStopped = false;
                console.log('worker -> ipcPublisher | start');
                this.publishTopicDataAsync(ETopic.ChartDataGenerationStarting, message.data.payload);
                break;
            case 'stop':
                this._isDataGenerationStopped = true;
                console.log('worker -> ipcPublisher | stop');
                this.publishTopicDataAsync(ETopic.ChartDataGenerationStopped, message.data.payload);
                break;
        };
    }

    private registerTopic(topic: ETopic, channelProvider?: ChannelProvider): void {
        if (!this._isRunningInOpenFin || !channelProvider) {
            return;
        }

        try {
            console.log(`ipcBusPublisher: registering topic '${topic}' on provider '${pubSubChannelProviderId}'`);
            const rv = channelProvider.register(topic, (payload, identity) => {
                console.log(`ipcBusPublisher: topic '${topic}' -> received payload`, payload);
                return { ack: true };
            });

            if (!rv) {
                console.error(`ipcBusPublisher | register topic failed | ${topic}`);
                return;
            }

            if (!this._isDefaultActionSet) {
                channelProvider.setDefaultAction((topic, payload, senderIdentity) => {
                    return {ack: true};
                });
                this._isDefaultActionSet = true;
            }
        } catch (error) {
            console.error(`ipcBusPublisher | exception while registering topic ${topic}`, error);
        }
    }

    public async publishTopicDataAsync(topic: ETopic, data: any): Promise<void> {
        if (!this._isRunningInOpenFin || !this._channelProvider) {
            return;
        }

        if (this._isDataGenerationStopped && topic === ETopic.ChartData) {
            return;
        }

        try {
            const startTime = Date.now();
            const diffWithWorker = Date.now() - data.workerSentTime;
            const dataToSend = { ...data, ipcSentTime: Date.now() };
            await Promise.all(this._channelProvider.publish(topic, dataToSend));
            // await this._channelProvider.publish(topic, dataToSend);
            // this._channelProvider.publish(topic, dataToSend);
            const diff = Date.now() - startTime;
            console.log('ipcBusPublisher | time:', diff);
            // const chartData: IChartData = data as IChartData;
            // if (chartData) {
            //     console.log(`ipcBusPublisher | publishTopicDataAsync | ${topic} | connections: ${this._channelProvider.connections.length} | counter: ${data.counter} | worker -> this: ${diffWithWorker.toFixed(2)} | this -> clients: ${diff.toFixed(2)} `);
            // } else {
            //     console.log(`ipcBusPublisher | publishTopicDataAsync | ${topic} | connections: ${this._channelProvider.connections.length} | worker -> this: ${diffWithWorker.toFixed(2)} | this -> clients: ${diff.toFixed(2)} `);
            // }
        } catch (error) {
            console.log('publish error: ', error);
        }
    }

    public startPublishingChartData() {
        console.log('ipcPublisher -> worker: start');
        this._worker.postMessage({ action: 'start' });
    }

    public stopPublishingChartData() {
        console.log('ipcPublisher -> worker: stop');
        this._worker.postMessage({ action: 'stop' });
    }

    public nextChartData() {
        console.log('ipcPublisher -> worker: next');
        this._worker.postMessage({ action: 'next' });
    }

    public static async getInstanceAsync(): Promise<IpcBusPublisher> {
        if (IpcBusPublisher.instance) {
            console.log(`ipcBusPublisher | getInstanceAsync | returning existing instance`);
            return IpcBusPublisher.instance;
        }

        const isRunningInOpenFin = window.fin?.Application?.isOpenFinEnvironment() ? true : false;
        
        const channelProvider = isRunningInOpenFin
            ? await this.tryCreateChannelProviderAsync()
            : undefined;

        console.log(`ipcBusPublisher | getInstanceAsync | creating new instance`);
        IpcBusPublisher.instance = new IpcBusPublisher(isRunningInOpenFin, channelProvider);
        
        console.log(`ipcBusPublisher | getInstanceAsync | returning new instance`);
        return IpcBusPublisher.instance;
    }

    private static async tryCreateChannelProviderAsync(): Promise<ChannelProvider | undefined> {
        let channelProvider: ChannelProvider | undefined;
        try {
            channelProvider = await fin.InterApplicationBus.Channel.create(pubSubChannelProviderId, { protocols: ['rtc'] });
        } catch (error) {
            console.error('ipcBusPublisher | tryCreateChannelProviderAsync | failed to create Channel', error);
        }
        return channelProvider;
    }
}



