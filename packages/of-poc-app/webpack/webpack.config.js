const { merge } = require('webpack-merge')
const commonConfig = require('./webpack.common.js')

// envVars are variables that we pass on scripts from package.json
module.exports = (envVars) => {
    const { env } = envVars; // env = dev or prod
    const envConfig = require(`./webpack.config.${env}.js`);
    const config = merge(commonConfig, envConfig);
    return config;
};