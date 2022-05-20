import { defineConfig } from 'vite';
import { resolve } from 'path';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist');

// https://vitejs.dev/config/
export default defineConfig({
    root,
    server: {
        port: 3100,
    },
    publicDir: resolve(root, '..', 'static'),
    assetsInclude: ['**/*.zip'],
    build: {
        outDir,
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                provider: resolve(root, 'provider.ts'),
            },
            output: {
                entryFileNames: 'js/[name].bundle.js',
                chunkFileNames: 'js/[name].js',
                assetFileNames: '[name].[ext]',
            },
        },
    },
});
