import ChannelClient from "openfin-adapter/src/api/interappbus/channel/client";
import { fin } from "openfin-adapter/src/mock";
import { pubSubChannelProviderId, ETopic } from "./messaging";
import { IDisposable } from "../types/IDisposable";

export class IpcBusSubscriber implements IDisposable {
    private _channelClient?: ChannelClient;
    
    public constructor(private readonly _isRunningInOpenFin: boolean, private readonly _identity: OpenFin.Identity) {
        this._channelClient = undefined;
    }

    public async subscribeTopicAsync(topic: ETopic, listener: OpenFin.ChannelAction): Promise<void> {
        if (!this._isRunningInOpenFin) {
            return;
        }

        console.log(`ipcBusSubscriber | ${this._identity.name} | subscribeTopicAsync | ${topic} | begin -----`);
        try {
            this._channelClient = await fin.InterApplicationBus.Channel.connect(pubSubChannelProviderId, {
                protocols: ['rtc'],
            });
            
            console.log(`ipcBusSubscriber | ${this._identity.name} | subscribeTopicAsync | ${topic} | registering topic`);
            this._channelClient.register(topic, listener);
            console.log(`ipcBusSubscriber | ${this._identity.name} | subscribeTopicAsync | ${topic} | success -----`)
            return;
        } catch (error) {
            console.error(`ipcBusSubscriber | ${this._identity.name} | subscribeTopicAsync | ${topic} | failed`, error);
            return;
        }
    }

    public async sendToProviderAsync(channelProviderId: string, topic: ETopic, data: any): Promise<void> {
        if (!this._channelClient) {
            return;
        }
        return this._channelClient.dispatch(topic, data);
    }

    public disposeAsync(): Promise<void> {
        if (!this._channelClient) {
            return Promise.resolve(undefined);
        }

        console.log(`ipcBusSubscriber | ${this._identity.name} | disconnecting client`);
        return this._channelClient.disconnect();
    }
}

