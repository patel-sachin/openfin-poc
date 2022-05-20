// following plugins are installed:
//  - prettier: core prettier library (make sure to install vscode or ide plugin)
//  - eslint-config-prettier: disables eslint config rules that might conflict with prettier
//  - eslint-plugin-prettier: runs prettier as eslint rule
module.exports = {
    semi: true,
    trailingComma: 'esnext',
    singleQuote: true,
    printWidth: 120,
    tabWidth: 4,
    endOfLine: 'auto',
};
