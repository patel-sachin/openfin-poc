// following eslint plugins are installed as dev dependencies
//  - elsint-plugin-react: contains rules for working with react
//  - eslint-plugin-react-hooks: contains rules for working with react-hooks
//  - @typescript-eslint/parser: to lint typescript code
//  - @typescript-eslint/eslint-plugin: contains rules specific to typescript
//  - eslint-plugin-import: linting es6+ import/export syntax + mis-spelling in file paths
//  - eslint-jsx-a11y: adds accessebility standards to app in real-time
module.exports = {
    // eslint should use this parser
    parser: '@typescript-eslint/parser',

    parserOptions: {
        ecmaVersion: 2021, // use modern ecmascript
        sourceType: 'module', // allow to use import statements
    },

    settings: {
        react: {
            version: 'detect',
        },
    },
    
    // use recommended rules from the following plugins
    extends: [
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:jsx-a11y/recommended',
        'plugin:eslint-comments/recommended',
        'prettier',
        'prettier/@typescript-eslint',
        'plugin:prettier/recommended',
    ],

    rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error'],
        '@typescript-eslint/no-var-requires': 'off',
        'react/prop-types': 'off',
        'react/jsx-uses-react': 'off',
        'react/react-in-jsx-scope': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
};
