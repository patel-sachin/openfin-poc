const webpack = require('webpack')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

module.exports = {
    mode: 'development',

    // recommended by React for development env
    devtool: 'cheap-module-source-map', 

    devServer: {
        // required for webpack's hot-module-replacement and also for 
        // ReactRefreshWebpackPlugin
        hot: true,

        // do not automatically open any page in browser after build
        open: false,

        // use this port for development
        port: 3000,
    },

    plugins: [
        // this plugin maintains the state of a component during hot-reload - meaning
        // if there are two components on a page and if modify one of them, only that
        // component will lose its state while the other will maintain its state 
        // during hot-reload. It also works for scss and css files.
        new ReactRefreshWebpackPlugin(),

        // - this is just an example! DefinePlugin allows to expose variables
        //   that can then be used in source code - e.g. in tsx/jsx render we
        //   could use <h2>{process.env.name}</h2>
        // - alternatively, there are other plugins in webpack (env-webpack) 
        //   that allows to define such variables in a separate .env file
        new webpack.DefinePlugin({
            'process.env.name': JSON.stringify('define-plugin-development'),
        }),
    ],
};