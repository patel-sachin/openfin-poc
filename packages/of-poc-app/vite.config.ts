import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
// import { copy } from 'vite-plugin-copy';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist');

function getCopyArgs() {
    console.log('in getCopyArgs');
    const scichart2dDataSrcDir = resolve(
        root,
        '..',
        '..',
        '..',
        'node_modules',
        'scichart',
        '_wasm',
        'scichart2d.data'
    );
    const scichart2dWasmDir = resolve(root, '..', '..', '..', 'node_modules', 'scichart', '_wasm', 'scichart2d.wasm');
    console.log(`dataDir: ${scichart2dDataSrcDir}`);
    console.log(`wasmDir: ${scichart2dWasmDir}`);

    const rv = [
        {
            src: scichart2dDataSrcDir,
            dest: outDir,
        },
        {
            src: scichart2dWasmDir,
            dest: outDir,
        },
    ];

    console.log('getCopyArgs returning....');
    console.log(rv);
    return rv;
}

function getCopyArgs_0() {
    console.log('in getCopyArgs');
    const scichart2dDataSrcDir = resolve(
        root,
        '..',
        '..',
        '..',
        'node_modules',
        'scichart',
        '_wasm',
        'scichart2d.data'
    );
    const scichart2dWasmDir = resolve(root, '..', '..', '..', 'node_modules', 'scichart', '_wasm', 'scichart2d.wasm');
    console.log(`dataDir: ${scichart2dDataSrcDir}`);
    console.log(`wasmDir: ${scichart2dWasmDir}`);

    const rv = [
        {
            src: scichart2dDataSrcDir,
            dest: outDir,
        },
        {
            src: scichart2dWasmDir,
            dest: outDir,
        },
    ];

    return rv;
}

// https://vitejs.dev/config/
export default defineConfig({
    root,
    plugins: [
        react(),
        viteStaticCopy({
            targets: [...getCopyArgs()],
            flatten: false,
        }),
        // copy(getCopyArgs()),
        // copy([
        //     {
        //         src: resolve(root, '..', '..', '..', 'node_modules', 'scichart', '_wasm', 'scichart2d.data'),
        //         dest: outDir,
        //     },
        //     {
        //         src: resolve(root, '..', 'node_modules', 'scichart', '_wasm', 'scichart2d.wasm'),
        //         dest: outDir,
        //     },
        // ]),
    ],
    server: {
        port: 3000,
    },
    // assetsInclude: ['**/scichart2d.data', '**/scichart2d.wasm'],
    // publicDir: outDir,
    build: {
        outDir,
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            // plugins: [
            //     copy({
            //         targets: [
            //             {
            //                 src: resolve(root, '..', 'node_modules', 'scichart', '_wasm', 'scichart2d.data'),
            //                 dest: outDir,
            //             },
            //             {
            //                 src: resolve(root, '..', 'node_modules', 'scichart', '_wasm', 'scichart2d.wasm'),
            //                 dest: outDir,
            //             },
            //         ],
            //     }),
            // ],
            input: {
                cpuhogger: resolve(root, 'cpuhogger', 'index.html'),
                publisher: resolve(root, 'pubsub', 'publisher.html'),
                receiver: resolve(root, 'pubsub', 'receiver.html'),
                chartloader: resolve(root, 'chart', 'ChartLoader.html'),
                chartrenderer: resolve(root, 'chart', 'ChartRenderer.html'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]',
            },
        },
    },
});
