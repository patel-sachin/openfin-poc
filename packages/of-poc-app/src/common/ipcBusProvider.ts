import ChannelClient from "openfin-adapter/src/api/interappbus/channel/client";
import { ChannelProvider } from "openfin-adapter/src/api/interappbus/channel/provider";
import { fin } from "openfin-adapter/src/mock";
import {EMode, ExampleDataGenerator} from "../ExampleData/ExampleDataGenerator";
import { IChartData } from "../ExampleData/Shapes";
import { pubSubChannelProviderId, ETopic } from "./messaging";
import { create_UUID } from "./uuidUtil";

export class IpcBusProvider {
    private static instance: IpcBusProvider;
    private _channelProviderId: string;
    private _exampleDataGenerator: ExampleDataGenerator;
    private readonly _channelsByPubSubChannelProviderIdMap: Map<string, ChannelClient>;
    
    private constructor(private _isRunningInOpenFin: boolean, private _channelProvider?: ChannelProvider) {
        this._channelProviderId = create_UUID();
        this._channelsByPubSubChannelProviderIdMap = new Map();
        
        Object.values(ETopic).forEach(v => this.registerTopic(v, this._channelProvider));
        
        this._exampleDataGenerator = new ExampleDataGenerator(
            EMode.AutoAdvance,
            (payload: IChartData) => this.publishTopicDataAsync(ETopic.ChartData, payload),
            () => this.publishTopicDataAsync(ETopic.ChartDataGenerationStarting, undefined),
            () => this.publishTopicDataAsync(ETopic.ChartDataGenerationStopped, undefined)
        );
    }

    private registerTopic(topic: ETopic, channelProvider?: ChannelProvider): void {
        if (!this._isRunningInOpenFin || !channelProvider) {
            return;
        }

        console.log(`ipcBusProvider: registering topic '${topic}' on provider '${pubSubChannelProviderId}'`);
        channelProvider.register(topic, (payload, identity) => {
            console.log(`ipcBusProvider: topic '${topic}' -> received payload '${payload}'`);
            return { ack: true, payload };
        });
    }

    public async publishTopicDataAsync(topic: ETopic, data: unknown): Promise<void> {
        if (!this._isRunningInOpenFin || !this._channelProvider) {
            return;
        }

        try {
            await Promise.all(this._channelProvider.publish(topic, data));
        } catch (error) {
            console.log('publish error: ', error);
        }
    }

    public async subscribeTopicAsync(topic: ETopic, listener: OpenFin.ChannelAction): Promise<ChannelClient | unknown> {
        if (!this._isRunningInOpenFin) {
            return undefined;
        }

        console.log(`ipcBusProvider | subscribeTopicAsync | ${topic} | begin -----`);
        try {
            let channelClient: ChannelClient | undefined = this._channelsByPubSubChannelProviderIdMap.get(pubSubChannelProviderId);
            if (!channelClient) {
                console.log(`ipcBusProvider | subscribeTopicAsync | ${topic} | no map entry..connecting to provider`);
                channelClient = await fin.InterApplicationBus.Channel.connect(pubSubChannelProviderId, {
                    protocols: ['rtc'],
                });
                this._channelsByPubSubChannelProviderIdMap.set(pubSubChannelProviderId, channelClient);
                console.log(`ipcBusProvider | subscribeTopicAsync | ${topic} | adding entry to map`);
            }
            
            console.log(`ipcBusProvider | subscribeTopicAsync | ${topic} | registering topic`);
            channelClient.register(topic, listener);
            console.log(`ipcBusProvider | subscribeTopicAsync | ${topic} | success -----`)
            return channelClient;
        } catch (error) {
            console.error(`ipcBusProvider | subscribeTopicAsync | ${topic} | failed`, error);
            return undefined;
        }
    }

    public startPublishingChartData() {
        this._exampleDataGenerator.start();
    }

    public stopPublishingChartData() {
        this._exampleDataGenerator.stop();
    }

    // private registerMouseLocationTopic(channelProvider?: ChannelProvider): void {
    //     if (!this._isRunningInOpenFin || !channelProvider) {
    //         return;
    //     }

    //     console.log(`ipcBusProvider: registering topic '${mouseLocationTopicId}' on provider '${pubSubChannelProviderId}'`);
    //     channelProvider.register(mouseLocationTopicId, (payload, identity) => {
    //         console.log(`ipcBusProvider: topic '${mouseLocationTopicId}' -> received payload '${payload}'`);
    //         return { ack: true, payload };
    //     });
    // }
    
    // public publishMouseLocation(mouseLocation: TMouseLocation): void {
    //     if (!this._isRunningInOpenFin || !this._channelProvider) {
    //         return;
    //     }

    //     this._channelProvider?.publish(mouseLocationTopicId, mouseLocation);
    // }

    // public async subscribeMouseLocationTopicAsync(subscriber: (payload: unknown, identity: OpenFin.ProviderIdentity | OpenFin.ClientIdentity) => unknown): Promise<ChannelClient | unknown> {
    //     if (!this._isRunningInOpenFin) {
    //         return undefined;
    //     }

    //     try {
    //         const channelClient = await fin.InterApplicationBus.Channel.connect(pubSubChannelProviderId, {
    //             protocols: ['rtc'],
    //         });
    //         channelClient.register(mouseLocationTopicId, subscriber);
    //         return channelClient;
    //     } catch (error) {
    //         console.error('ipcBusProvider | subscribeMouseLocationTopicAsync | subscribe failed', error);
    //         return undefined;
    //     }
    // }

    // private registerChartDataTopic(channelProvider?: ChannelProvider): void {
    //     if (!this._isRunningInOpenFin || !channelProvider) {
    //         return;
    //     }

    //     console.log(`ipcBusProvider: registering topic '${chartDataTopicId}' on provider '${pubSubChannelProviderId}'`);
    //     channelProvider.register(chartDataTopicId, (payload, identity) => {
    //         console.log(`ipcBusProvider: topic '${mouseLocationTopicId}' -> received payload '${payload}'`);
    //         return { ack: true, payload };
    //     });
    // }

    // public publishChartData(chartData: IChartData): void {
    //     if (!this._isRunningInOpenFin || !this._channelProvider) {
    //         return;
    //     }

    //     this._channelProvider?.publish(chartDataTopicId, chartData);
    // }

    // public async subscribeChartDataTopicAsync(subscriber: (payload: unknown, identity: OpenFin.ProviderIdentity | OpenFin.ClientIdentity) => unknown): Promise<ChannelClient | unknown> {
    //     if (!this._isRunningInOpenFin) {
    //         return undefined;
    //     }

    //     try {
    //         const channelClient = await fin.InterApplicationBus.Channel.connect(pubSubChannelProviderId, {
    //             protocols: ['rtc'],
    //         });
    //         channelClient.register(chartDataTopicId, subscriber);
    //         return channelClient;
    //     } catch (error) {
    //         console.error('ipcBusProvider | subscribeChartDataTopicAsync | subscribe failed', error);
    //         return undefined;
    //     }
    // }

    public static async getInstanceAsync(): Promise<IpcBusProvider> {
        if (IpcBusProvider.instance) {
            console.log(`ipcBusProvider | getInstanceAsync | returning existing instance`);
            return IpcBusProvider.instance;
        }

        const isRunningInOpenFin = window.fin?.Application?.isOpenFinEnvironment() ? true : false;
        
        const channelProvider = isRunningInOpenFin
            ? await this.tryCreateChannelProviderAsync()
            : undefined;

        console.log(`ipcBusProvider | getInstanceAsync | creating new instance`);
        IpcBusProvider.instance = new IpcBusProvider(isRunningInOpenFin, channelProvider);
        
        console.log(`ipcBusProvider | getInstanceAsync | returning new instance`);
        return IpcBusProvider.instance;
    }

    private static async tryCreateChannelProviderAsync(): Promise<ChannelProvider | undefined> {
        let channelProvider: ChannelProvider | undefined;
        try {
            channelProvider = await fin.InterApplicationBus.Channel.create(pubSubChannelProviderId, { protocols: ['rtc'] });
        } catch (error) {
            console.error('ipcBusProvider | tryCreateChannelProviderAsync | failed to create Channel', error);
        }
        return channelProvider;
    }

}

