const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const distDir = path.resolve(__dirname, 'dist');

module.exports = {
    entry: {
        provider: './src/provider.ts',
    },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(zip)/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath: 'assets/',
                },
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(distDir, 'js'),
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: 'static', to: distDir }],
        }),
    ],
};
