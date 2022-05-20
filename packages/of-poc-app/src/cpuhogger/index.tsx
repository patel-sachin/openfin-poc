import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './../index.css';
import { CpuHogger } from './CpuHogger';

type State = {
    isRunningInOpenFin: boolean;
};

const App = () => {
    const [state, setState] = useState<State>({ isRunningInOpenFin: false });

    useEffect(() => {
        setState({
            isRunningInOpenFin: window.fin?.Application?.isOpenFinEnvironment() ? true : false,
        });
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <h3>IsRunningInOpenFin: {state?.isRunningInOpenFin ? 'true' : 'false'}</h3>
            </header>
            <textarea className="textArea" title="Text" placeholder="Enter some text after clickeng the button" />
            <CpuHogger />
        </div>
    );
};

const container = document.getElementById('app');
const root = createRoot(container!);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);