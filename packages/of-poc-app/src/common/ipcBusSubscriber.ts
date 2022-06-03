import ChannelClient from 'openfin-adapter/src/api/interappbus/channel/client';
import { fin } from 'openfin-adapter/src/mock';
import { pubSubChannelProviderId, ETopic } from './messaging';
import { IDisposable } from '../types/IDisposable';

export class IpcBusSubscriber implements IDisposable {
    // private _channelClient?: ChannelClient;

    private constructor(
        private readonly _isRunningInOpenFin: boolean,
        private readonly _identity: OpenFin.Identity,
        private readonly _channelClient: ChannelClient | null
    ) {
        // this._channelClient = undefined;
    }

    public static async createAsync(
        isRunningInOpenFin: boolean,
        identity: OpenFin.Identity
    ): Promise<IpcBusSubscriber> {
        let ipcBusSubscriber: IpcBusSubscriber | null = null;

        if (isRunningInOpenFin) {
            console.log(
                `ipcBusSubscriber | createAsync | uuid: ${identity.uuid} | name: ${identity.name} | begin -----`
            );
            try {
                const channelClient = await fin.InterApplicationBus.Channel.connect(pubSubChannelProviderId, {
                    protocols: ['rtc'],
                    wait: true,
                });

                channelClient.onDisconnection((identity) => {
                    console.log(`ipcBusSubscriber | Client Disconnected | ${identity.uuid} | ${identity.name}`);
                });

                channelClient.onError((action, error, identity) => {
                    console.error(
                        `ipcBusSubscriber | onError | action: ${action} | identity: ${identity.uuid}, name: ${identity.name}`,
                        error
                    );
                });

                // channelClient.beforeAction((action, payload, identity) => {
                //     console.log(
                //         `ipcBusSubscriber | beforeAction | action: ${action} | identity: ${identity.uuid}, name: ${identity.name}`
                //     );
                //     return payload;
                // });
                //
                // channelClient.afterAction((action, payload, identity) => {
                //     console.log(
                //         `ipcBusSubscriber | afterAction | action: ${action} | identity: ${identity.uuid}, name: ${identity.name}`
                //     );
                //     return payload;
                // });

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                channelClient.setDefaultAction((action, payload, identity) => {
                    // console.log(
                    //     `ipcBusSubscriber | setDefaultAction | action: ${action} | identity: ${identity.uuid}, name: ${identity.name}`
                    // );

                    return undefined;
                });

                console.log(
                    `ipcBusSubscriber | createAsync | uuid: ${identity.uuid} | name: ${identity.name} | success`
                );
                ipcBusSubscriber = new IpcBusSubscriber(isRunningInOpenFin, identity, channelClient);
            } catch (error) {
                console.error(
                    `ipcBusSubscriber | createAsync | uuid: ${identity.uuid} | name: ${identity.name} | failed`,
                    error
                );
            }
        }

        return ipcBusSubscriber ?? new IpcBusSubscriber(isRunningInOpenFin, identity, null);
    }

    public async subscribeTopicAsync(topic: ETopic, listener: OpenFin.ChannelAction): Promise<void> {
        if (!this._isRunningInOpenFin || !this._channelClient) {
            return;
        }

        console.log(`ipcBusSubscriber | ${this._identity.name} | subscribeTopicAsync | ${topic} | begin -----`);
        try {
            // this._channelClient = await fin.InterApplicationBus.Channel.connect(pubSubChannelProviderId, {
            //     protocols: ['rtc'],
            //     wait: true,
            // });

            console.log(
                `ipcBusSubscriber | ${this._identity.name} | subscribeTopicAsync | ${topic} | registering topic`
            );
            this._channelClient.register(topic, listener);
            console.log(`ipcBusSubscriber | ${this._identity.name} | subscribeTopicAsync | ${topic} | success -----`);
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
