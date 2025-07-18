import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.js', '*.d.ts'],
  },
]; 