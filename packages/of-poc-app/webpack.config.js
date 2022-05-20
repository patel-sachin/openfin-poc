const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',

    entry: {
        cpuhogger: path.resolve(__dirname, 'src/cpuhogger/CpuHogger.tsx'),
        publisher: path.resolve(__dirname, 'src/pubsub/publisher.tsx'),
        receiver: path.resolve(__dirname, 'src/pubsub/receiver.tsx'),
        chartloader: path.resolve(__dirname, 'src/chart/ChartLoader.tsx'),
        chartrenderer: path.resolve(__dirname, 'src/chart/ChartRenderer.tsx'),
    },

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].js',
        clean: true,
        assetModuleFilename: '[name][ext]',
    },

    devtool: 'source-map',

    devServer: {
        static: {
            directory: path.resolve(__dirname, 'dist'),
        },
        port: 3000, // use port 3000 for development
        open: true, // automatically open the page
        hot: true, // hot-reload
        compress: true, // enable gzip compression
        historyApiFallback: true,
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                },
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
                loader: 'svg-inline-loader',
            },
        ],
    },

    plugins: [
        new HtmlWebpackPlugin({
            title: '[name]',
            filename: 'index.html',
            template: 'src/template.html',
        }),
    ],

    resolve: {
        extensions: ['.ts', 'tsx', '.js', 'jsx'],
    },
};
