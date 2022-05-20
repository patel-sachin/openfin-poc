const webpack = require('webpack')

module.exports = {
    mode: 'production',

     // recommended by CRA for production env
    devtool: 'source-map',

    plugins: [
        new webpack.DefinePlugin({
            'process.env.name': JSON.stringify('define-plugin-production'),
        }),
    ],
};