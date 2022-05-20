import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist');

// https://vitejs.dev/config/
export default defineConfig({
    root,
    plugins: [react()],
    publicDir: 'static',
    mode: 'development',
    server: {
        port: 3200,
    },
    build: {
        outDir,
        minify: false,
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                platformprovider: resolve(root, 'provider.html'),
                platformwindow: resolve(root, 'platform.html'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].ext',
            },
        },
    },
});
