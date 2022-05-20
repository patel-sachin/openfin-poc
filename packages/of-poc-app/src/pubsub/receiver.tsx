import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './receiver-styles.scss';
import { TMouseLocation, ETopic } from '../common/messaging';
import { fin } from 'openfin-adapter/src/mock';
import { IpcBusSubscriber } from '../common/ipcBusSubscriber';

type TState = {
    isRunningInOpenFin: boolean;
    pid?: number;
    mouseLocation?: TMouseLocation;
};

const Receiver = () => {
    const [state, setState] = useState<TState>({ isRunningInOpenFin: false });
    const viewNameRef = useRef<string>();
    const url = new URL(window.location.href);
    const ipcBusSubscriberRef = useRef<IpcBusSubscriber>();

    function handleOnMouseLocationTopic(payload: TMouseLocation): void {
        if (!payload) {
            return;
        }
    
        setState((prevState) => ({
            ...prevState,
            mouseLocation: payload
        }));
    }

    async function initIpcProviderAndSubscribeTopics(): Promise<void> {
        if (!state.isRunningInOpenFin) {
            return;
        }
        let identity: OpenFin.Identity;
        if (fin.me.isWindow) {
            identity = fin.me.identity;
            viewNameRef.current  = identity.name;
        } else if (fin.me.isView) {
            identity = (await fin.me.getCurrentWindow()).identity;
            viewNameRef.current = identity.name;
        } else {
            console.log('not running in platform View or Window');
            return;
        }

        // const ipcBusSubscriber = await IpcBusSubscriber.getInstanceAsync();
        const ipcBusSubscriber = new IpcBusSubscriber(state.isRunningInOpenFin, identity);
        if (!ipcBusSubscriber) {
            return;
        }

        ipcBusSubscriberRef.current = ipcBusSubscriber;

        await Promise.all([
            ipcBusSubscriber.subscribeTopicAsync(ETopic.MouseLocation, (payload, identity) => {
                console.log(`ChartRenderer | received mouselocation`);
                setTimeout(() => {
                    handleOnMouseLocationTopic(payload as TMouseLocation);
                }, 0);
                return { ack: true };
            }),
        ]);
    }

    async function disposeAsync(): Promise<void> {
        if (!ipcBusSubscriberRef.current) {
            return;
        }

        await ipcBusSubscriberRef.current.disposeAsync();
        ipcBusSubscriberRef.current = undefined;
    }

    useEffect(() => {
        if (!state.isRunningInOpenFin) {
            return;
        }

        console.log(`ChartRenderer | useEffect | isOpenFin: ${state.isRunningInOpenFin} | calling initIpcProviderAndSubscribeTopics`);
        const initFinRelatedProps = async () => {
            await initIpcProviderAndSubscribeTopics();
            const processInfo = await fin.me.getProcessInfo();
            if (processInfo) {
                setState((prevState) => ({
                    ...prevState,
                    pid: processInfo.pid
                }));
            }
        };
        initFinRelatedProps();
    }, [state.isRunningInOpenFin]);

    useEffect(() => {
        const isRunningInOpenFin = window.fin?.Application?.isOpenFinEnvironment() ? true : false;

        setState({
            isRunningInOpenFin: isRunningInOpenFin,
        });


        return (() => {
            disposeAsync();
        });
        // if (isRunningInOpenFin && !channelClientRef?.current) {
        //     (async () => {
        //         const ipcBusProvider = await IpcBusProvider.getInstanceAsync();
        //         ipcBusProvider?.subscribeTopicAsync(ETopic.ChartData, (payload, identity) => {
        //             handleOnMouseLocationTopic(payload as TMouseLocation);
        //         })
        //     })();
        // }
    }, []);


    const mouseLocationContent = state.mouseLocation ? (
        <h3>{`Mouse Location: X: ${state.mouseLocation.x}, Y: ${state.mouseLocation.y}`} </h3>
    ) : undefined;

    return (
        <div className="App">
            <header className="App-header">
                <h2>Chart Renderer-{url.searchParams.get('index')} (receiver){state.pid ? `  Pid: ${state.pid}` : ''}</h2>
                <h3>IsRunningInOpenFin: {state?.isRunningInOpenFin ? 'true' : 'false'}</h3>
                <h3>Receiver</h3>
            </header>
            {mouseLocationContent}
        </div>
    );
};

const container = document.getElementById('app');
const root = createRoot(container!);
root.render(
    <React.StrictMode>
        <Receiver />
    </React.StrictMode>
);