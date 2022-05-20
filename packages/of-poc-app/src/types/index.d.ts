// import { fin, inOpenFin } from '@openfin/core';
// import { Fin } from '@openfin/core/fin';
import { fin } from 'openfin-adapter/src/mock';

export {};

declare global {
    interface Window {
        fin: Fin;
        // inOpenFin: boolean | unknown;
        // fin: {
        //     Application: {
        //         isOpenFinEnvironment(): boolean;
        //     };
        // };
    }
}
