const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

console.log(`__dirname: ${__dirname}`);

const components = [
    {
        entryName: 'cpu-hogger',
        path: path.resolve(__dirname, '..', './src/cpuhogger/index.tsx'),
    },
    {
        entryName: 'pubsub-publisher',
        path: path.resolve(__dirname, '..', './src/pubsub/publisher.tsx'),
    },
    {
        entryName: 'pubsub-receiver',
        path: path.resolve(__dirname, '..', './src/pubsub/receiver.tsx'),
    },
    {
        entryName: 'chart-loader',
        path: path.resolve(__dirname, '..', './src/chart/ChartLoader.tsx'),
    },
    {
        entryName: 'chart-renderer',
        path: path.resolve(__dirname, '..', './src/chart/ChartRenderer.tsx')
    },
];

const entries = components.reduce((acc, current) => {
    acc[current.entryName] = current.path;
    return acc;
}, {});

const htmlGenerators = components.reduce((acc, current) => {
    acc.push(
        new HtmlWebpackPlugin({
        inject: true,
        chunks: [current.entryName],
        filename: `${current.entryName}.html`,
        template: path.resolve(__dirname, '..', './src/template.html'),
        minify: false,
        title: `${current.entryName}`,
        showErrors: true,
        })
    );
    return acc;
}, []);

module.exports = {
    entry: entries,
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, '..', './dist/'),
        clean: true,
        assetModuleFilename: 'assets/[name][ext]',
    },
    plugins: [
        ...htmlGenerators,
        new CleanWebpackPlugin({
            protectWebpackAssets: false,
            cleanAfterEveryBuildPatterns: ['*.js.LICENSE.txt'],
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: './../../node_modules/scichart/_wasm/scichart2d.data',
                    to: './scichart2d.data',
                },
                {
                    from: './../../node_modules/scichart/_wasm/scichart2d.wasm',
                    to: './scichart2d.wasm',
                },
            ],
        }),
    ],
    resolve: {
        extensions: ['.tsx', 'jsx', '.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)x?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                    },
                ],
            },
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                // for webpack v5+ we don't need separate loaders for these as
                // they are supported out of the box
                test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
                type: 'asset/resource',
            },
            {
                // for webpack v5+ we don't need separate loaders for these as
                // they are supported out of the box - according to the docs, we
                // have to use 'assent/inline' for svg and fonts.
                test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
                type: 'asset/inline',
            },
        ],
    },
    stats: {
        preset: 'minimal',
        env: true,
        entrypoints: true,
        warnings: true,
        errors: true,
        errorDetails: true,
        errorStack: true,
    },
};