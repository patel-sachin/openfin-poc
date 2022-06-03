import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './ChartRenderer-styles.scss';
import { ETopic, pubSubChannelProviderId, TMouseLocation } from '../common/messaging';
import { SciChartSurface } from 'scichart/Charting/Visuals/SciChartSurface';
import { NumericAxis } from 'scichart/Charting/Visuals/Axis/NumericAxis';
import { XyDataSeries } from 'scichart/Charting/Model/XyDataSeries';
import { FastLineRenderableSeries } from 'scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries';
import { MouseWheelZoomModifier } from 'scichart/Charting/ChartModifiers/MouseWheelZoomModifier';
import { RubberBandXyZoomModifier } from 'scichart/Charting/ChartModifiers/RubberBandXyZoomModifier';
import { ZoomExtentsModifier } from 'scichart/Charting/ChartModifiers/ZoomExtentsModifier';
import { TSciChart } from 'scichart/types/TSciChart';
import { XAxisDragModifier } from 'scichart/Charting/ChartModifiers/XAxisDragModifier';
import { EDragMode } from 'scichart/types/DragMode';
import { YAxisDragModifier } from 'scichart/Charting/ChartModifiers/YAxisDragModifier';
import { EAutoRange } from 'scichart/types/AutoRange';
import { ILineSeriesData } from '../ExampleData/Shapes';
import { IpcBusSubscriber } from '../common/ipcBusSubscriber';
import { EAxisAlignment } from 'scichart/types/AxisAlignment';
import { UpdateSuspender } from 'scichart/Charting/Visuals/UpdateSuspender';
import { fin } from 'openfin-adapter/src/mock';
import { Thickness } from 'scichart/Core/Thickness';
import { DpiHelper } from 'scichart/Charting/Visuals/TextureManager/DpiHelper';
import { EExecuteOn } from 'scichart/types/ExecuteOn';
import { ZoomPanModifier } from 'scichart/Charting/ChartModifiers/ZoomPanModifier';
import { CursorModifier } from 'scichart/Charting/ChartModifiers/CursorModifier';
import { RolloverModifier } from 'scichart/Charting/ChartModifiers/RolloverModifier';
import { getSciChartLicense } from '../common/chartUtils';

type TState = {
    isRunningInOpenFin: boolean;
    pid?: number;
    mouseLocation?: TMouseLocation;
};

type TChartComponentsRef = {
    chartSurface: SciChartSurface;
    wasmContext: TSciChart;
    xAxis: NumericAxis;
    yAxis: NumericAxis;
    series: XyDataSeries[];
};

const ChartRenderer = () => {
    const [state, setState] = useState<TState>({ isRunningInOpenFin: false });
    const [chartId] = useState('line-chart');
    const chartComponentsRef = useRef<TChartComponentsRef>();
    const viewNameRef = useRef<string>();
    const url = new URL(window.location.href);
    const ipcBusSubscriberRef = useRef<IpcBusSubscriber>();
    const chartContainerRef = useRef<HTMLDivElement>(null);

    const initChartAsync = useCallback(async () => {
        if (!chartContainerRef.current) {
            return;
        }

        DpiHelper.IsDpiScaleEnabled = false;
        const { sciChartSurface, wasmContext } = await SciChartSurface.create(chartContainerRef.current, {
            // disableAspect: true,
            // heightAspect: 1,
            // widthAspect: 1,
            // heightAspect: 2,
        });
        sciChartSurface.padding = Thickness.fromNumber(10);
        sciChartSurface.background = 'black';

        const xAxis = new NumericAxis(wasmContext, {
            autoRange: EAutoRange.Always,
            drawMajorGridLines: true,
            drawMajorTickLines: true,
            drawMinorGridLines: false,
            drawMinorTickLines: false,
            drawMajorBands: false,
            autoTicks: true,
            // maxAutoTicks: 50,
            drawLabels: true,
            axisAlignment: EAxisAlignment.Bottom,
            axisBorder: {
                borderTop: 1,
                color: '#666666',
            },
            isVisible: true,
        });
        const yAxis = new NumericAxis(wasmContext, {
            autoRange: EAutoRange.Always,
            drawMajorGridLines: true,
            drawMajorTickLines: true,
            drawMinorGridLines: false,
            drawMinorTickLines: false,
            drawMajorBands: false,
            autoTicks: true,
            // maxAutoTicks: 50,
            drawLabels: true,
            axisAlignment: EAxisAlignment.Left,
            axisBorder: {
                borderTop: 1,
                color: '#666666',
            },
            isVisible: true,
        });

        sciChartSurface.xAxes.add(xAxis);
        sciChartSurface.yAxes.add(yAxis);

        const dataSeries: XyDataSeries[] = [
            new XyDataSeries(wasmContext, { containsNaN: false }),
            new XyDataSeries(wasmContext, { containsNaN: false }),
            new XyDataSeries(wasmContext, { containsNaN: false }),
        ];

        const seriesColors = ['#4083B7', '#FFA500', '#E13219'];

        dataSeries.map((ds, index) => {
            sciChartSurface.renderableSeries.add(
                new FastLineRenderableSeries(wasmContext, {
                    dataSeries: ds,
                    strokeThickness: 2,
                    stroke: seriesColors[index],
                })
            );
        });

        sciChartSurface.chartModifiers.add(
            new RubberBandXyZoomModifier({
                isAnimated: false,
                executeOn: EExecuteOn.MouseRightButton,
            }),
            new RolloverModifier({
                showRolloverLine: false,
                snapToDataPoint: true,
            }),
            new ZoomPanModifier({ executeOn: EExecuteOn.MouseLeftButton }),
            new MouseWheelZoomModifier(),
            new XAxisDragModifier({ dragMode: EDragMode.Panning }),
            new YAxisDragModifier({ dragMode: EDragMode.Panning }),
            new CursorModifier({ modifierGroup: 'group1' }),
            new ZoomExtentsModifier({ isAnimated: false })
        );

        chartComponentsRef.current = {
            chartSurface: sciChartSurface,
            wasmContext,
            yAxis,
            xAxis,
            series: dataSeries,
        };
    }, []);

    function handleonChartDataTopic(payload: any): void {
        if (!payload || !payload.data) {
            console.log('ChartRenderer | payload is undefined | returning...');
            return;
        }

        if (!chartComponentsRef.current) {
            return;
        }

        const lineSeriesData = payload.data as ILineSeriesData;
        if (!lineSeriesData) {
            return;
        }

        const messageCounter: number = lineSeriesData.counter;
        const diffWithIpc = Date.now() - lineSeriesData.ipcSentTime;
        console.log(
            `ChartRenderer | received chart-data | counter: ${
                lineSeriesData.counter
            } | diffWithIpc: ${diffWithIpc.toFixed(2)}`
        );

        if (
            /*messageCounter % 1000 === 0 &&*/
            viewNameRef.current &&
            ipcBusSubscriberRef.current
        ) {
            ipcBusSubscriberRef.current.sendToProviderAsync(
                pubSubChannelProviderId,
                ETopic.PublishChartDataSubscriberTimings,
                {
                    name: viewNameRef.current,
                    data: {
                        counter: messageCounter,
                        receivedTimeDuration: diffWithIpc,
                    },
                }
            );
        }

        UpdateSuspender.using(chartComponentsRef.current.chartSurface, () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            lineSeriesData.seriesData.forEach((series, index) => {
                chartComponentsRef.current!.series[series.index].appendRange(series.data.xValues, series.data.yValues);
            });
            //chartComponentsRef.current!.xAxis.autoRange = EAutoRange.Always;
        });
    }

    function handleonChartDataGenerationStartingTopic(): void {
        console.log('ChartRenderer');
        if (!chartComponentsRef.current) {
            return;
        }

        // chartComponentsRef.current.xAxis.autoRange = EAutoRange.Once;
        // chartComponentsRef.current.yAxis.autoRange = EAutoRange.Once;
        chartComponentsRef.current.series.forEach((ds) => ds.clear());
    }

    function handleonChartDataGenerationStoppedTopic(): void {
        if (!chartComponentsRef.current) {
            return;
        }

        // chartComponentsRef.current.xAxis.autoRange = EAutoRange.Once;
    }

    const initIpcProviderAndSubscribeTopics = async () => {
        if (!state.isRunningInOpenFin) {
            return;
        }
        let identity: OpenFin.Identity;
        if (fin.me.isWindow) {
            identity = fin.me.identity;
            viewNameRef.current = identity.name;
        } else if (fin.me.isView) {
            identity = (await fin.me.getCurrentWindow()).identity;
            viewNameRef.current = identity.name;
        } else {
            console.log('not running in platform View or Window');
            return;
        }

        const ipcBusSubscriber = await IpcBusSubscriber.createAsync(state.isRunningInOpenFin, identity);
        if (!ipcBusSubscriber) {
            return;
        }

        ipcBusSubscriberRef.current = ipcBusSubscriber;

        await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ipcBusSubscriber.subscribeTopicAsync(ETopic.ChartData, (payload, identity) => {
                console.log(`ChartRenderer | received chartData`);
                setTimeout(() => {
                    handleonChartDataTopic(payload);
                }, 0);
                return { ack: true };
            }),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ipcBusSubscriber.subscribeTopicAsync(ETopic.ChartDataGenerationStarting, (payload, identity) => {
                console.log(`ChartRenderer | received chartData generation starting`);
                handleonChartDataGenerationStartingTopic();
                return { ack: true };
            }),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ipcBusSubscriber.subscribeTopicAsync(ETopic.ChartDataGenerationStopped, (payload, identity) => {
                console.log(`ChartRenderer | received chartData generation stopped`);
                handleonChartDataGenerationStoppedTopic();
                return { ack: true };
            }),
        ]);
    };

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

        console.log(
            `ChartRenderer | useEffect | isOpenFin: ${state.isRunningInOpenFin} | calling initIpcProviderAndSubscribeTopics`
        );
        const initFinRelatedPropsAsync = async () => {
            await initIpcProviderAndSubscribeTopics();
            const processInfo = await fin.me.getProcessInfo();
            if (processInfo) {
                setState((prevState) => ({
                    ...prevState,
                    pid: processInfo.pid,
                }));
            }
        };
        initFinRelatedPropsAsync().catch((error) => {
            console.error('ChartRenderer | useEffect | initFinRelatedPropsAsync failed!', error);
        });
    }, [state.isRunningInOpenFin]);

    useEffect(() => {
        SciChartSurface.setRuntimeLicenseKey(getSciChartLicense());
        initChartAsync().catch((error) => {
            console.error('ChartRenderer | useEffect | initChartAsync failed!', error);
        });
    }, [chartId]);

    useEffect(() => {
        console.log('useEffect[]');

        const isRunningInOpenFin = window.fin?.Application?.isOpenFinEnvironment() ? true : false;

        setState({
            isRunningInOpenFin: isRunningInOpenFin,
        });

        return () => {
            disposeAsync();
        };
    }, []);

    return (
        <div className="App">
            <div className="App-header">
                <h2>
                    Chart Renderer-{url.searchParams.get('index')} (receiver){state.pid ? `  Pid: ${state.pid}` : ''}
                </h2>
                <h3>IsRunningInOpenFin: {state?.isRunningInOpenFin ? 'true' : 'false'}</h3>
            </div>
            <div id={chartId} ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

const container = document.getElementById('app');
const root = createRoot(container!);
root.render(<ChartRenderer />);
