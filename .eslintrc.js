module.exports = {
    env: {
        es6: true,
        node: true,
        jest: true
    },
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/eslint-recommended'
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      }
    },
    rules: {
      '@typescript-eslint/indent': [2, 4],
      '@typescript-eslint/explicit-function-return-type': 'off',
    }
  };