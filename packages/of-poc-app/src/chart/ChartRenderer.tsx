import { useEffect, useRef, useState } from 'react';
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
import { IChartData } from '../ExampleData/Shapes';
import { IpcBusSubscriber } from '../common/ipcBusSubscriber';
import { EAxisAlignment } from 'scichart/types/AxisAlignment';
import { UpdateSuspender } from 'scichart/Charting/Visuals/UpdateSuspender';
import { fin } from 'openfin-adapter/src/mock';

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

    async function initChartAsync(): Promise<void> {
        // DpiHelper.IsDpiScaleEnabled = false;
        const { sciChartSurface, wasmContext } = await SciChartSurface.create(chartId, {
            disableAspect: true,
            // heightAspect: 1,
            // widthAspect: 2,
            // heightAspect: 2,
        });
        // sciChartSurface.padding = Thickness.fromNumber(5);
        // sciChartSurface.background = 'yellow';

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
                color: "#666666",
            }, isVisible: true,
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
                color: "#666666",
            }, isVisible: true,
         });
            
        sciChartSurface.xAxes.add(xAxis);
        sciChartSurface.yAxes.add(yAxis);

        const dataSeries: XyDataSeries[] = [
            new XyDataSeries(wasmContext, {containsNaN: false}),
            new XyDataSeries(wasmContext, {containsNaN: false}),
            new XyDataSeries(wasmContext, {containsNaN: false})
        ];

        const seriesColors = ["#4083B7", "#FFA500", "#E13219"];

        dataSeries.map((ds, index) => {
            sciChartSurface.renderableSeries.add(
                new FastLineRenderableSeries(wasmContext, {
                    dataSeries: ds,
                    strokeThickness: 2,
                    stroke: seriesColors[index]
                })
            );
        });

        sciChartSurface.chartModifiers.add(
            new RubberBandXyZoomModifier(),
            new MouseWheelZoomModifier(),
            new XAxisDragModifier({ dragMode: EDragMode.Panning }),
            new YAxisDragModifier({ dragMode: EDragMode.Panning }),
            new ZoomExtentsModifier()
        );

        chartComponentsRef.current = {
            chartSurface: sciChartSurface,
            wasmContext,
            yAxis,
            xAxis,
            series: dataSeries,
        };
    }

    function handleonChartDataTopic(payload: IChartData): void {
        if (!payload) {
            console.log('ChartRenderer | payload is undefined | returning...')
            return;
        }
    
        if (!chartComponentsRef.current) {
            return;
        }

        const messageCounter: number = payload.counter;
        const diffWithIpc = Date.now() - payload.ipcSentTime;
        console.log(`ChartRenderer | received chart-data | counter: ${payload.counter} | diffWithIpc: ${diffWithIpc.toFixed(2)}`);

        if (messageCounter % 1000 === 0 && viewNameRef.current && ipcBusSubscriberRef.current) {
            ipcBusSubscriberRef.current.sendToProviderAsync(
                pubSubChannelProviderId,
                ETopic.ChartDataSubscriberTimings, {
                name: viewNameRef.current,
                counter: messageCounter,
                receivedTimeDuration: diffWithIpc,
            });
        }

        UpdateSuspender.using(chartComponentsRef.current.chartSurface, () => {
            payload.seriesData.forEach((series, index) => { 
                chartComponentsRef.current!.series[series.index].appendRange(series.data.xValues, series.data.yValues);
            });
            //chartComponentsRef.current!.xAxis.autoRange = EAutoRange.Always;
        });
    }

    function handleonChartDataGenerationStartingTopic(): void {
        console.log('ChartRenderer')
        if (!chartComponentsRef.current) {
            return;
        }

        chartComponentsRef.current.xAxis.autoRange = EAutoRange.Once;
        chartComponentsRef.current.yAxis.autoRange = EAutoRange.Once;
        chartComponentsRef.current.series.forEach(ds => ds.clear());
    }

    function handleonChartDataGenerationStoppedTopic(): void {
        if (!chartComponentsRef.current) {
            return;
        }

        chartComponentsRef.current.xAxis.autoRange = EAutoRange.Once;
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
            ipcBusSubscriber.subscribeTopicAsync(ETopic.ChartData, (payload, identity) => {
                console.log(`ChartRenderer | received chartData`);
                setTimeout(() => {
                    handleonChartDataTopic(payload as IChartData);
                }, 0);
                return { ack: true };
            }),
            ipcBusSubscriber.subscribeTopicAsync(ETopic.ChartDataGenerationStarting, (payload, identity) => {
                console.log(`ChartRenderer | received chartData generation starting`);
                handleonChartDataGenerationStartingTopic();
                return { ack: true };
            }),
            ipcBusSubscriber.subscribeTopicAsync(ETopic.ChartDataGenerationStopped, (payload, identity) => {
                console.log(`ChartRenderer | received chartData generation stopped`);
                handleonChartDataGenerationStoppedTopic();
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
        SciChartSurface.setRuntimeLicenseKey(
            'your-license-here'
        );
        initChartAsync();
    }, [chartId]);

    useEffect(() => {
        console.log('useEffect[]');
        
        const isRunningInOpenFin = window.fin?.Application?.isOpenFinEnvironment() ? true : false;

        setState({
            isRunningInOpenFin: isRunningInOpenFin,
        });

        return (() => {
            disposeAsync();
        });
    }, []);

    return (
        <div className="App">
            <div className='App-header'>
                <h2>Chart Renderer-{url.searchParams.get('index')} (receiver){state.pid ? `  Pid: ${state.pid}` : ''}</h2>
                <h3>IsRunningInOpenFin: {state?.isRunningInOpenFin ? 'true' : 'false'}</h3>
            </div>
            <div
                id={chartId}
                className="line-chart-container"
            />
        </div>
    );
};

const container = document.getElementById('app');
const root = createRoot(container!);
root.render(<ChartRenderer />);
