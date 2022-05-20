import { fin } from 'openfin-adapter/src/mock';
import { html, render } from 'lit-html';

class TitleBar extends HTMLElement {
    LIGHT_THEME: string;
    DARK_THEME: string;
    constructor() {
        super();
        this.LIGHT_THEME = 'light-theme';
        this.DARK_THEME = 'dark';

        this.render();
        fin.Platform.getCurrentSync()
            .getWindowContext()
            .then((initialContext) => {
                if (initialContext && initialContext.theme) {
                    this.setTheme(initialContext.theme);
                }
            });

        fin.Platform.getCurrentSync().on('window-context-changed', async (evt) => {
            const context = await fin.Platform.getCurrentSync().getWindowContext();
            //we only want to react to events that include themes
            if (evt.context.theme && evt.context.theme !== context.theme) {
                this.setTheme(evt.context.theme);
            }
        });

        fin.me.on('layout-ready', async () => {
            // Whenever a new layout is ready on this window (on init, replace, or applyPreset)
            const { settings } = await fin.Platform.Layout.getCurrentSync().getConfig();
            // determine whether it is locked and update the icon
            if (settings.hasHeaders && settings.reorderEnabled) {
                document.getElementById('lock-button')?.classList.remove('layout-locked');
            } else {
                document.getElementById('lock-button')?.classList.add('layout-locked');
            }
        });
    }

    render = async () => {
        const titleBar = html` <div class="title-bar-draggable">
                <div id="title"></div>
            </div>
            <div id="buttons-wrapper">
                <div class="button" title="Toggle Theme" id="theme-button" @click=${this.toggleTheme}></div>
                <div class="button" title="Toggle Sidebar" id="menu-button" @click=${this.toggleMenu}></div>
                <div class="button" title="Toggle Layout Lock" id="lock-button" @click=${this.toggleLockedLayout}></div>
                <div
                    class="button"
                    title="Minimize Window"
                    id="minimize-button"
                    @click=${() => this.minimizeWindow().catch(console.error)}
                ></div>
                <div
                    class="button"
                    title="Maximize Window"
                    id="expand-button"
                    @click=${() => this.maxOrRestore().catch(console.error)}
                ></div>
                <div
                    class="button"
                    title="Close Window"
                    id="close-button"
                    @click=${() => this.closeWindow().catch(console.error)}
                ></div>
            </div>`;
        return render(titleBar, this);
    };

    minimizeWindow = async () => {
        const window = await fin.Window.getCurrent();
        if (!window) {
            return;
        }

        window.minimize();
    };

    closeWindow = async () => {
        const window = await fin.Window.getCurrent();
        if (!window) {
            return;
        }

        window.close();
    };

    maxOrRestore = async () => {
        const window = await fin.Window.getCurrent();
        if (!window) {
            return;
        }

        const windowState = await window.getState();
        if (!windowState) {
            return;
        }

        if (windowState === 'normal') {
            window.maximize();
        }

        window.restore();
    };

    toggleLockedLayout = async () => {
        const oldLayout = await fin.Platform.Layout.getCurrentSync().getConfig();
        const { settings, dimensions } = oldLayout;
        if (settings.hasHeaders && settings.reorderEnabled) {
            fin.Platform.Layout.getCurrentSync().replace({
                ...oldLayout,
                settings: {
                    ...settings,
                    hasHeaders: false,
                    reorderEnabled: false,
                },
            });
        } else {
            fin.Platform.Layout.getCurrentSync().replace({
                ...oldLayout,
                settings: {
                    ...settings,
                    hasHeaders: true,
                    reorderEnabled: true,
                },
                dimensions: {
                    ...dimensions,
                    headerHeight: 25,
                },
            });
        }
    };

    toggleTheme = async () => {
        let themeName = this.DARK_THEME;
        if (!document.documentElement.classList.contains(this.LIGHT_THEME)) {
            themeName = this.LIGHT_THEME;
        }
        this.setTheme(themeName);
    };

    setTheme = async (theme: string) => {
        const root = document.documentElement;

        if (theme === this.LIGHT_THEME) {
            root.classList.add(this.LIGHT_THEME);
        } else {
            root.classList.remove(this.LIGHT_THEME);
        }

        const context = (await fin.Platform.getCurrentSync().getWindowContext()) || {};
        if (context.theme !== theme) {
            fin.Platform.getCurrentSync().setWindowContext({ theme });
        }
    };

    toggleMenu = () => {
        document.querySelector('left-menu')?.classList.toggle('hidden');
    };
}

customElements.define('title-bar', TitleBar);
