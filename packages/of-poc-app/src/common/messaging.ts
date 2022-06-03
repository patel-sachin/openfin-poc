export const broadcastId = 'MessageBroadcastChannel';
export const pubSubChannelProviderId = 'pubsub-provider';

export enum ETopic {
    MouseLocation = 'mouse-location',
    ChartData = 'chart-data',
    ChartDataGenerationStarting = 'chart-data-generation-starting',
    ChartDataGenerationStopped = 'chart-data-generation-stopped',
    PublishChartDataSubscriberTimings = 'publish-chart-data-subscriber-timings',
    ChartDataSubscriberTimings = 'chart-data-subscriber-timings',
}

export type TMouseLocation = {
    x: number;
    y: number;
};

let run = false;
let messageCount = 0;

export function publishMessage(publisher: any, data: any, runNow?: boolean): void {
    if (runNow !== undefined) {
        run = runNow;
        messageCount = 0;
    }
    if (run) {
        setTimeout(() => {
            data.time = Date.now();
            publisher(data);
            messageCount++;
            publishMessage(publisher, data);
        }, 0);
    }
}

export async function publishMessageAsync(publisher: any, data: any, runNow?: boolean): Promise<any> {
    if (runNow !== undefined) {
        run = runNow;
        messageCount = 0;
    }
    if (run) {
        setTimeout(async () => {
            data.time = Date.now();
            await publisher(data);
            messageCount++;
            publishMessageAsync(publisher, data);
        }, 0);
    }
}

export function stopMessage(): number {
    run = false;
    return messageCount;
}
