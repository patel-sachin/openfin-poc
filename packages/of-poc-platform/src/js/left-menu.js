import { html, render } from 'lit-html';
import { getTemplates, getTemplateByName, onStoreUpdate } from './template-store';
import { CONTAINER_ID } from './platform';

const CHART_URL = 'https://cdn.openfin.co/embed-web/chart.html';
const LAYOUT_STORE_KEY = 'LayoutForm';
const SNAPSHOT_STORE_KEY = 'SnapshotForm';

//Our Left Menu element
class LeftMenu extends HTMLElement {
    constructor() {
        super();
        this.onclick = this.clickHandler;
        this.appInstanceCounter = new Map();

        //List of apps available in the menu.
        this.appList = [
            {
                url: 'http://localhost:3000/cpu-hogger.html',
                printName: 'CpuHogger',
            },
            {
                url: 'http://localhost:3000/cpu-hogger.html',
                printName: 'CpuHogger (PsA)',
                processAffinity: 'ch_1',
            },
        ];

        // this.snapshotForm = document.querySelector('snapshot-form');
        // this.layoutForm = document.querySelector('layout-form');
        this.layoutContainer = document.querySelector(`#${CONTAINER_ID}`);

        this.render();

        //Whenever the store updates we will want to render any new elements.
        onStoreUpdate(() => {
            this.render();
        });
    }

    clickHandler = (e) => {
        const target = e.target;

        if (target.className === 'snapshot-button' || target.className === 'layout-button') {
            if (!this.layoutContainer.classList.contains('hidden')) {
                this.layoutContainer.classList.toggle('hidden');
            }
        }

        if (target.className === 'snapshot-button') {
            // this.snapshotForm.showElement();
            // this.layoutForm.hideElement();
        } else if (target.className === 'layout-button') {
            // this.layoutForm.showElement();
            // this.snapshotForm.hideElement();
        } else {
            // this.layoutForm.hideElement();
            // this.snapshotForm.hideElement();

            if (this.layoutContainer.classList.contains('hidden')) {
                this.layoutContainer.classList.toggle('hidden');
            }
        }
    };

    render = async () => {
        const layoutTemplates = getTemplates(LAYOUT_STORE_KEY);
        const snapshotTemplates = getTemplates(SNAPSHOT_STORE_KEY);
        const menuItems = html`
            <span>Applications</span>
            <ul>
                ${this.appList.map(
                    (item) => html`<li>
                        <button @click=${() => this.addView(item.printName)}>${item.printName}</button>
                    </li>`
                )}
            </ul>
            <span>Windows</span>
            <ul>
                <li><button @click=${() => this.layoutWindow().catch(console.error)}>Platform Window</button></li>
                <li><button @click=${() => this.nonLayoutWindow().catch(console.error)}>OF Window</button></li>
            </ul>
            <span>Layouts</span>
            <ul>
                <li><button @click=${() => this.toGrid().catch(console.error)}>Grid</button></li>
                <li><button @click=${() => this.toTabbed().catch(console.error)}>Tab</button></li>
                ${layoutTemplates.map(
                    (item) => html`<li>
                        <button @click=${() => this.replaceLayoutFromTemplate(item.name)}>${item.name}</button>
                    </li>`
                )}
            </ul>
        `;
        return render(menuItems, this);
    };

    applySnapshotFromTemplate = async (templateName) => {
        const template = getTemplateByName(SNAPSHOT_STORE_KEY, templateName);
        return fin.Platform.getCurrentSync().applySnapshot(template.snapshot, {
            closeExistingWindows: template.close,
        });
    };

    replaceLayoutFromTemplate = async (templateName) => {
        const templates = getTemplates(LAYOUT_STORE_KEY);
        const templateToUse = templates.find((i) => i.name === templateName);
        fin.Platform.Layout.getCurrentSync().replace(templateToUse.layout);
    };

    addView = async (printName) => {
        const app = this.appList.find((i) => i.printName === printName);
        if (!app) {
            return;
        }

        let counter = this.appInstanceCounter.get(app.printName) ?? 0;
        counter++;
        this.appInstanceCounter.set(app.printName, counter);

        const options = app.processAffinity
            ? {
                  url: app.url,
                  processAffinity: `app.processAffinity-${counter}`,
                  name: `${app.printName}-${counter}`,
                  target: fin.me.identity,
              }
            : {
                  url: app.url,
                  name: `${app.printName}-${counter}`,
                  target: fin.me.identity,
              };

        return fin.Platform.getCurrentSync().createView(options, fin.me.identity);
    };

    toGrid = async () => {
        await fin.Platform.Layout.getCurrentSync().applyPreset({
            presetType: 'grid',
        });
    };

    toTabbed = async () => {
        await fin.Platform.Layout.getCurrentSync().applyPreset({
            presetType: 'tabs',
        });
    };
    toRows = async () => {
        await fin.Platform.Layout.getCurrentSync().applyPreset({
            presetType: 'rows',
        });
    };

    // cloneWindow = async () => {
    //     const bounds = await fin.Window.getCurrentSync()?.getBounds();
    //     const layout = await fin.Platform.Layout.getCurrentSync().getConfig();
    //     const customContext = await fin.Platform.getCurrentSync().getWindowContext();
    //     const snapshot: OpenFin.Snapshot = {
    //         windows: [
    //             {
    //                 name: fin.Window.getCurrentSync?.name,
    //                 defaultWidth: bounds.width,
    //                 defaultHeight: bounds.height,
    //                 layout,
    //                 //getWindowContext actually returns the customContext option.
    //                 customContext,
    //             },
    //         ],
    //     };

    //     return fin.Platform.getCurrentSync().applySnapshot(snapshot);
    // };

    nonLayoutWindow = async () => {
        return fin.Platform.getCurrentSync().applySnapshot({
            windows: [
                {
                    name: 'some-name',
                    defaultWidth: 600,
                    defaultHeight: 600,
                    defaultLeft: 200,
                    defaultTop: 200,
                    saveWindowState: false,
                    url: CHART_URL,
                    contextMenu: true,
                },
            ],
        });
    };

    layoutWindow = async () => {
        const viewOptions = {
            url: CHART_URL,
            target: fin.me.identity,
            name: 'some-name',
        };
        return fin.Platform.getCurrentSync().createView(viewOptions);
    };

    // share = async () => {
    //     const { windows } = await fin.Platform.getCurrentSync().getSnapshot();
    //     const contentConfig = { snapshot: { windows } };
    //     const res = await fetch('https://jsonblob.com/api/jsonBlob', {
    //         method: 'POST', // or 'PUT'
    //         body: JSON.stringify(contentConfig), // data can be `string` or {object}!
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //     });
    //     const contentUrl = res.headers.get('Location');
    //     const { manifestUrl } = await fin.Application.getCurrentSync().getInfo();

    //     const startUrl = `https://openfin.github.io/start/?manifest=${encodeURIComponent(
    //         `${manifestUrl}?$$appManifestUrl=${contentUrl}`
    //     )}`;

    //     fin.System.openUrlWithBrowser(startUrl);
    // };
}
customElements.define('left-menu', LeftMenu);
