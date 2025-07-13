module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'eqeqeq': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'node/no-unpublished-require': 'off',
    'node/no-missing-require': 'off',
    'node/no-extraneous-require': 'off',
  },
  ignorePatterns: ['node_modules/', 'dist/', 'coverage/'],
}; 