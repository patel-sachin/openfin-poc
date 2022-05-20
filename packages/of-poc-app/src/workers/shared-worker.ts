import { broadcastId, publishMessage, stopMessage } from '../common/messaging';

let actionMap: { [key: string]: ((options: any, responseId: any) => Promise<any>) | (() => Promise<any>) } = {};

// Create a broadcast channel to notify all listeners of changes that applies to all instances
const broadcastChannel = new BroadcastChannel(broadcastId);

const start = async (options: any, responseId: string): Promise<any> => {
    let data = {
        message: options.message,
    };
    let run = true;
    publishMessage(
        (data: any) => {
            data.time = Date.now();
            broadcastChannel.postMessage(data);
        },
        data,
        run
    );
};

let stop = async (): Promise<any> => {
    return {
        messagesSent: stopMessage(),
    };
};

actionMap['start'] = start;
actionMap['stop'] = stop;

async function onconnect(event: any) {
    console.log(event);

    let port = event.ports[0];

    port.start();

    port.addEventListener('message', async (e: any) => {
        console.log('Message received by worker is...');
        if (e.data && e.data.action !== undefined) {
            console.log(e.data);
            let action = actionMap[e.data.action];

            if (action !== undefined) {
                let result = await action(e.data.options, e.data.responseId);
                if (result !== undefined) {
                    console.log('Message sent by worker is...');
                    console.log(JSON.stringify(result));
                    console.log('Message sent by worker is going to requestor.');
                    port.postMessage(result);
                }
            }
        }
    });
}
