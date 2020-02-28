module.exports = {
    env: {
        es6: true,
        node: true,
        jest: true
    },
    extends: [
        'standard',
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
      semi: ['error','always'],
      indent: ['error', 4],
      'no-return-assign': ['error', 'except-parens'],
      'no-new': ['off'],
      'prefer-promise-reject-errors': ['off'],
      '@typescript-eslint/explicit-function-return-type': 'off',
    }
  };