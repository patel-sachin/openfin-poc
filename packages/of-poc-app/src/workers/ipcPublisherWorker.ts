// import { IpcBusPublisher } from "../common/ipcBusPublisher";
// import { IpcBusSubscriber } from "../common/ipcBusSubscriber";
//
// let ipcBusPublisher: IpcBusPublisher;
// let ipcBusSubscriber: IpcBusSubscriber;
//
// (async function() {
//     ipcBusPublisher = await IpcBusPublisher.getInstanceAsync();
//     ipcBusSubscriber = await IpcBusSubscriber.getInstanceAsync();
// })();

export { };
let connections: number = 0;

self.onconnect = (e: any) => {
    console.log(`ipcPublisherWorker | connect | client connected | port #: ${connections}`);
    const port = e.ports[0];
    connections++;

    // console.log(`ipcPublisherWorker | connect | client connected | port #: ${connections}`);

    port.onmessage = (e1: any) => {
        port.postMessage(`Hello ${e1.data} (port #: ${connections}`)
    };
}
// addEventListener('connect', e => {
//     const port = e.ports[0];
//     connections++;
//
//     console.log(`ipcPublisherWorker | connect | client connected | port #: ${connections}`);
//
//     port.addEventListener("message", e1 => {
//         port.postMessage(`Hello ${e1.data} (port #: ${connections}`)
//     })
//
//     port.start();
//  }, false);