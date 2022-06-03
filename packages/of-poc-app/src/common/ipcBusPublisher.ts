import { ChannelProvider } from 'openfin-adapter/src/api/interappbus/channel/provider';
import { fin } from 'openfin-adapter/src/mock';
import { ETopic, pubSubChannelProviderId } from './messaging';

export class IpcBusPublisher {
    private static instance: IpcBusPublisher;
    private _isDefaultActionSet: boolean;
    private _worker: Worker;
    private _isDataGenerationStopped: boolean;

    private constructor(private _isRunningInOpenFin: boolean, private _channelProvider?: ChannelProvider) {
        this._isDefaultActionSet = false;
        this._isDataGenerationStopped = false;
        Object.values(ETopic).forEach((v) => this.registerTopic(v, this._channelProvider));

        this._worker = new Worker(new URL('./GenerateDataWorker.ts', import.meta.url));
        this._worker.onmessage = (message) => this.handleWorkerMessage(message);
    }

    private async handleWorkerMessage(message: any) {
        if (!message) {
            return;
        }
        switch (message.data.type) {
            case 'series-data':
                this.publishTopicDataAsync(ETopic.ChartData, message.data);
                break;
            case 'start':
                this._isDataGenerationStopped = false;
                console.log('worker -> ipcPublisher | start');
                this.publishTopicDataAsync(ETopic.ChartDataGenerationStarting, message.data);
                break;
            case 'stop':
                this._isDataGenerationStopped = true;
                console.log('worker -> ipcPublisher | stop');
                this.publishTopicDataAsync(ETopic.ChartDataGenerationStopped, message.data);
                break;
        }
    }

    private registerTopic(topic: ETopic, channelProvider?: ChannelProvider): void {
        if (!this._isRunningInOpenFin || !channelProvider) {
            return;
        }

        try {
            console.log(`ipcBusPublisher: registering topic '${topic}' on provider '${pubSubChannelProviderId}'`);
            let rv = false;

            switch (topic) {
                case ETopic.MouseLocation:
                case ETopic.ChartData:
                case ETopic.ChartDataGenerationStarting:
                case ETopic.ChartDataGenerationStopped:
                case ETopic.ChartDataSubscriberTimings:
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    rv = channelProvider.register(topic, (payload, identity) => {
                        // console.log(`ipcBusPublisher: topic '${topic}' -> received payload`, payload);
                        return { ack: true };
                    });
                    break;
                case ETopic.PublishChartDataSubscriberTimings:
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    rv = channelProvider.register(topic, (payload, identity) => {
                        return channelProvider.publish(ETopic.ChartDataSubscriberTimings, payload);
                        // return { ack: true };
                    });
                    break;
                default:
                    throw new Error(`ipcBusPublisher | unhandled topic: ${topic}`);
            }

            if (!rv) {
                console.error(`ipcBusPublisher | register topic failed | ${topic}`);
                return;
            }

            // if (!this._isDefaultActionSet) {
            //     channelProvider.setDefaultAction((topic, payload, senderIdentity) => {
            //         return { ack: true };
            //     });
            //     this._isDefaultActionSet = true;
            // }
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
            // const diffWithWorker = Date.now() - data.workerSentTime;
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
        this._worker.postMessage({ type: 'start' });
    }

    public stopPublishingChartData() {
        console.log('ipcPublisher -> worker: stop');
        this._worker.postMessage({ type: 'stop' });
    }

    public nextChartData() {
        console.log('ipcPublisher -> worker: next');
        this._worker.postMessage({ type: 'next' });
    }

    public static async getInstanceAsync(): Promise<IpcBusPublisher> {
        if (IpcBusPublisher.instance) {
            console.log(`ipcBusPublisher | getInstanceAsync | returning existing instance`);
            return IpcBusPublisher.instance;
        }

        const isRunningInOpenFin = window.fin?.Application?.isOpenFinEnvironment() ? true : false;

        const channelProvider = isRunningInOpenFin ? await this.tryCreateChannelProviderAsync() : undefined;

        console.log(`ipcBusPublisher | getInstanceAsync | creating new instance`);
        IpcBusPublisher.instance = new IpcBusPublisher(isRunningInOpenFin, channelProvider);

        console.log(`ipcBusPublisher | getInstanceAsync | returning new instance`);
        return IpcBusPublisher.instance;
    }

    private static async tryCreateChannelProviderAsync(): Promise<ChannelProvider | undefined> {
        let channelProvider: ChannelProvider | undefined;
        try {
            channelProvider = await fin.InterApplicationBus.Channel.create(pubSubChannelProviderId, {
                protocols: ['rtc'],
            });

            channelProvider.onConnection((identity) => {
                console.log(`ipcBusPublisher | Client Connected | ${identity.name}`);
            });

            channelProvider.onDisconnection((identity) => {
                console.log(`ipcBusPublisher | Client Disconnected | ${identity.name}`);
            });

            channelProvider.onError((action, error, identity) => {
                console.error(`ipcBusPublisher | onError | action: ${action} | ${identity.name}`, error);
            });

            // channelProvider.beforeAction((action, payload, identity) => {
            //     console.log(
            //         `ipcBusPublisher | beforeAction | action: ${action} | ${identity.name}`
            //     );
            //     return payload;
            // });
            //
            // channelProvider.afterAction((action, payload, identity) => {
            //     console.log(
            //         `ipcBusPublisher | afterAction | action: ${action} | ${identity.name}`
            //     );
            //     return payload;
            // });
            //
            // channelProvider.setDefaultAction((action, payload, identity) => {
            //     console.log(
            //         `ipcBusPublisher | setDefaultAction | action: ${action} | ${identity.name}`
            //     );
            //
            //     return payload;
            // });
        } catch (error) {
            console.error('ipcBusPublisher | tryCreateChannelProviderAsync | failed to create Channel', error);
        }
        return channelProvider;
    }
}
