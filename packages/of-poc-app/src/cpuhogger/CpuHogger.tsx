import React, { useState } from 'react';
import './cpu-hogger-styles.scss';

type LoopState = {
    outerLoopIndex: number;
    innerLoopIndex: number;
    total: number;
};

export const CpuHogger = () => {
    const [state, setState] = useState<Partial<LoopState>>();

    function updateState(outerLoopIndex: number, innerLoopIndex: number, total: number) {
        setState(() => ({
            outerLoopIndex,
            innerLoopIndex,
            total,
        }));
    }

    function handleClick() {
        const startTime: number = Date.now();
        let total: number = 0;
        for (let i = 0; i < 1000000; i++) {
            for (let j = 0; j < 10000; j++) {
                total += i + j;
                if (Date.now() - startTime > 200) {
                    updateState(i, j, total);
                }
            }
        }
    }

    const content = !state ? undefined : (
        <>
            <p>
                OuterIndex:
                <span>{state.outerLoopIndex}</span>
            </p>
            <p>
                InnterIndex:
                <span>{state.innerLoopIndex}</span>
            </p>
            <p>
                Total:
                <span>{state.total}</span>
            </p>
        </>
    );

    return (
        <div className="loopInfo">
            <button className="btn" type="button" onClick={() => handleClick()}>
                Block Renderer!
            </button>
            {content}
        </div>
    );
};
