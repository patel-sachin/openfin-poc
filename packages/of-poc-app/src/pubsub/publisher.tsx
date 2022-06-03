import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { fin } from 'openfin-adapter/src/mock';
import './publisher-styles.scss';
import { ETopic } from '../common/messaging';
import { create_UUID } from '../common/uuidUtil';
import { View } from 'openfin-adapter/src/api/view';
import { IpcBusPublisher } from '../common/ipcBusPublisher';

type State = {
    isRunningInOpenFin: boolean;
    numSubscribers: number;
    viewInfo: OpenFin.ViewInfo | null;
};

const Publisher = () => {
    const [state, setState] = useState<State>({ isRunningInOpenFin: false, numSubscribers: 1, viewInfo: null });
    const ipcBusPublisherRef = useRef<IpcBusPublisher>();
    const openedViewsRef = useRef<Map<string, View>>();
    const openfinIdentityRef = useRef<OpenFin.Identity>();

    const onMouseMove = (e: React.MouseEvent) => {
        ipcBusPublisherRef.current?.publishTopicDataAsync(ETopic.MouseLocation, { x: e.clientX, y: e.clientY });
    };

    async function initIpcProviderAndSubscribeTopics(): Promise<void> {
        if (!state.isRunningInOpenFin || ipcBusPublisherRef.current) {
            return;
        }

        let identity: OpenFin.Identity;
        if (fin.me.isWindow) {
            identity = fin.me.identity;
        } else if (fin.me.isView) {
            identity = (await fin.me.getCurrentWindow()).identity;
        } else {
            console.log('not running in platform View or Window');
            return;
        }

        openfinIdentityRef.current = identity;

        ipcBusPublisherRef.current = await IpcBusPublisher.getInstanceAsync();

        const view = fin.View.getCurrentSync();
        const viewInfo = await view?.getInfo();
        setState((prevState) => ({
            ...prevState,
            viewInfo: viewInfo ?? null,
        }));
    }

    useEffect(() => {
        console.log(
            `ChartLoader | useEffect | isOpenFin: ${state.isRunningInOpenFin} | calling initIpcProviderAndSubscribeTopics`
        );
        initIpcProviderAndSubscribeTopics();
    }, [state.isRunningInOpenFin]);

    useEffect(() => {
        const isRunningInOpenFin = window.fin?.Application?.isOpenFinEnvironment() ? true : false;

        setState((prevState) => ({
            ...prevState,
            isRunningInOpenFin: isRunningInOpenFin,
        }));

        // if (isRunningInOpenFin && !ipcBusProviderRef.current) {
        //     (async () => {
        //         ipcBusProviderRef.current = await IpcBusProvider.getInstanceAsync();
        //         const view = fin.View.getCurrentSync();
        //         const viewInfo = await view?.getInfo();
        //         setState((prevState) => ({
        //             ...prevState,
        //             viewInfo: viewInfo ?? null
        //         }));
        //     })();
        // }
    }, []);

    async function handleCloseAllSubscriberButtonClick() {
        if (!state.isRunningInOpenFin) {
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        openedViewsRef.current?.forEach((view, key) => destroyView(view));
    }

    function handleNumSubscribersChange(e: React.ChangeEvent<HTMLInputElement>) {
        setState((prevState) => ({
            ...prevState,
            numSubscribers: e.target.valueAsNumber ?? 1,
        }));
    }

    async function handleOpenSubscribersButtonClick() {
        if (!state.isRunningInOpenFin) {
            return;
        }

        await Promise.all(
            Array<number>(state.numSubscribers)
                .fill(0)
                .map((x, i) => i)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .reduce((acc, i) => {
                    acc.push(createView());
                    return acc;
                }, new Array<Promise<View | null>>())
        );
    }

    function destroyView(view: View) {
        console.log(`closing view | name:${view.identity.name} | uuid: ${view.identity.uuid}`);
        const platform = fin.Platform.getCurrentSync();
        platform.closeView(view.identity);
    }

    async function createView(): Promise<View | null> {
        try {
            if (!state.viewInfo || !openfinIdentityRef.current) {
                return null;
            }

            const publisherUrl = new URL(state.viewInfo.url);

            const uuid = create_UUID();
            const viewName = `pubsub-receiver: ${uuid}`;
            const platform = fin.Platform.getCurrentSync();
            const view = await platform.createView(
                {
                    name: viewName,
                    url: `http://${publisherUrl.host}/pubsub-receiver.html`,
                    processAffinity: `ps-${viewName}`,
                    target: { name: viewName, uuid: uuid },
                },
                openfinIdentityRef.current
            );

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            view?.once('destroyed', (payload, args) => {
                openedViewsRef.current?.delete(payload.name);
            });

            openedViewsRef.current?.set(view.identity.name, view);

            return view;
        } catch (error) {
            console.log('publisher | createView | failed to create view!', error);
            return null;
        }
    }

    return (
        <div className="App">
            <header className="App-header">
                <h2>PubSub - (publisher)</h2>
            </header>
            <h3>IsRunningInOpenFin: {state?.isRunningInOpenFin ? 'true' : 'false'}</h3>
            <div className="num-subscribers-container">
                <label htmlFor="numSubscribers">Number of Subscribers:</label>
                <input
                    id="numSubscribers"
                    type="number"
                    value={state.numSubscribers}
                    onChange={(e) => handleNumSubscribersChange(e)}
                />
                <button className="btn" onClick={() => handleOpenSubscribersButtonClick()}>
                    Open
                </button>
                <button
                    className="btn"
                    type="button"
                    disabled={!state.isRunningInOpenFin}
                    onClick={() => handleCloseAllSubscriberButtonClick()}
                >
                    Close All
                </button>
            </div>
            <div className="mouse-move-area" onMouseMove={onMouseMove}>
                <p>Move mouse here...</p>
            </div>
            <pre>
                View Info:
                <br></br>
                <code>{JSON.stringify(state.viewInfo, null, 2)}</code>
            </pre>
        </div>
    );
};

const container = document.getElementById('app');
const root = createRoot(container!);
root.render(
    <React.StrictMode>
        <Publisher />
    </React.StrictMode>
);
