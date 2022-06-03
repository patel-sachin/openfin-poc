import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import OpenFin, { fin } from 'openfin-adapter/src/mock';
import './ChartLoader-styles.scss';
import { View } from 'openfin-adapter/src/api/view';
import { create_UUID } from '../common/uuidUtil';
import { ETopic } from '../common/messaging';
import { IpcBusPublisher } from '../common/ipcBusPublisher';
import { IpcBusSubscriber } from '../common/ipcBusSubscriber';

type State = {
    isRunningInOpenFin: boolean;
    numSubscribers: number;
    isDataGenerating: boolean;
    viewInfo: OpenFin.ViewInfo | null;
};

const Publisher = () => {
    const [state, setState] = useState<State>({
        isRunningInOpenFin: false,
        numSubscribers: 1,
        isDataGenerating: false,
        viewInfo: null,
    });
    const ipcBusPublisherRef = useRef<IpcBusPublisher>();
    const ipcBusSubscriberRef = useRef<IpcBusSubscriber>();
    const openedViewsRef = useRef<Map<string, View>>();
    const openfinIdentityRef = useRef<OpenFin.Identity>();

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
        const ipcBusSubscriber = await IpcBusSubscriber.createAsync(state.isRunningInOpenFin, identity);
        ipcBusSubscriberRef.current = ipcBusSubscriber;

        if (ipcBusSubscriber) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            await ipcBusSubscriber?.subscribeTopicAsync(ETopic.ChartDataGenerationStarting, (payload, identity) => {
                console.log(`ChartLoader | received data generation starting`);
                setState((prevState) => ({ ...prevState, isDataGenerating: true }));
                return { ack: true };
            });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            await ipcBusSubscriber?.subscribeTopicAsync(ETopic.ChartDataGenerationStopped, (payload, identity) => {
                console.log(`ChartLoader | received data generation stopping`);
                setState((prevState) => ({ ...prevState, isDataGenerating: false }));
                return { ack: true };
            });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            await ipcBusSubscriber?.subscribeTopicAsync(ETopic.ChartDataSubscriberTimings, (payload: any, identity) => {
                console.log(`ChartLoader | received client timings:`, payload?.data);
                return { ack: true };
            });
        }

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
        const isRunningInOpenFin = window.fin?.Application?.isOpenFinEnvironment() ?? false;
        openedViewsRef.current = new Map();

        setState((prevState) => ({
            ...prevState,
            isRunningInOpenFin: isRunningInOpenFin,
        }));
    }, []);

    async function handleStartOrStopDataGenerationButtonClick() {
        if (!state.isRunningInOpenFin || !ipcBusPublisherRef.current) {
            return;
        }

        state.isDataGenerating
            ? ipcBusPublisherRef.current.stopPublishingChartData()
            : ipcBusPublisherRef.current.startPublishingChartData();
    }

    async function handleGenerateNextButtonClick() {
        if (!state.isRunningInOpenFin || !ipcBusPublisherRef.current) {
            return;
        }

        ipcBusPublisherRef.current.nextChartData();
    }

    function handleNumSubscribersChange(e: React.ChangeEvent<HTMLInputElement>) {
        setState((prevState) => ({
            ...prevState,
            numSubscribers: e.target.valueAsNumber ?? 1,
        }));
    }

    async function handleCloseAllSubscriberButtonClick() {
        if (!state.isRunningInOpenFin) {
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        openedViewsRef.current?.forEach((view, key) => destroyView(view));
    }

    async function handleCreate1SubscriberButtonClick() {
        if (!state.isRunningInOpenFin) {
            return;
        }

        await createView();
    }

    async function handleOpenSubscribersButtonClick() {
        if (!state.isRunningInOpenFin) {
            return;
        }

        await Promise.all(
            Array<number>(state.numSubscribers)
                .fill(0)
                .map((x, i) => i)
                .reduce((acc, i) => {
                    acc.push(createView(i));
                    return acc;
                }, new Array<Promise<View | null>>())
        );
    }

    function destroyView(view: View) {
        console.log(`closing view | name:${view.identity.name} | uuid: ${view.identity.uuid}`);
        const platform = fin.Platform.getCurrentSync();
        platform.closeView(view.identity);
    }

    async function createView(index = 0): Promise<View | null> {
        try {
            if (!state.viewInfo || !openfinIdentityRef.current) {
                return null;
            }

            const publisherUrl = new URL(state.viewInfo.url);

            const uuid = create_UUID();
            const viewName = `chart-renderer: ${uuid}`;
            const platform = await fin.Platform.getCurrent();
            const view = await platform.createView(
                {
                    name: viewName,
                    url: `http://${publisherUrl.host}/chart-renderer.html?index=${index}`,
                    target: { name: viewName, uuid: uuid },
                    processAffinity: `ps-${viewName}`,
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
            console.log('ChartLoader | createView | failed to create view!', error);
            return null;
        }
    }

    return (
        <div className="App">
            <header className="App-header">
                <h2>Chart Loader (publisher)</h2>
            </header>
            <h3>IsRunningInOpenFin: {state?.isRunningInOpenFin ? 'true' : 'false'}</h3>
            <div className="num-subscribers-container">
                <label htmlFor="numSubscribers">Number of Subscribers:</label>
                <input
                    id="numSubscribers"
                    type="number"
                    value={state.numSubscribers}
                    disabled={!state.isRunningInOpenFin}
                    onChange={(e) => handleNumSubscribersChange(e)}
                />
                <button
                    className="btn"
                    type="button"
                    disabled={!state.isRunningInOpenFin}
                    onClick={() => handleOpenSubscribersButtonClick()}
                >
                    Open
                </button>
                <button
                    className="btn"
                    type="button"
                    disabled={!state.isRunningInOpenFin}
                    onClick={() => handleCreate1SubscriberButtonClick()}
                >
                    Create 1
                </button>
                <button
                    className="btn"
                    type="button"
                    disabled={!state.isRunningInOpenFin}
                    onClick={() => handleCloseAllSubscriberButtonClick()}
                >
                    Close All
                </button>
                <button
                    className="btn"
                    type="button"
                    disabled={!state.isRunningInOpenFin}
                    onClick={() => handleStartOrStopDataGenerationButtonClick()}
                >
                    {state.isDataGenerating ? 'Stop' : 'Start'}
                </button>
                <button
                    className="btn"
                    type="button"
                    disabled={!state.isRunningInOpenFin}
                    onClick={() => handleGenerateNextButtonClick()}
                >
                    Next
                </button>
            </div>
            {/* <div className='mouse-move-area' onMouseMove={onMouseMove}>
                <p>Move mouse here...</p>
            </div> */}
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
root.render(<Publisher />);
