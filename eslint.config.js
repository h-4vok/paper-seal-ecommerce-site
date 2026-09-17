import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import astro from 'eslint-plugin-astro';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', '.astro/**', 'coverage/**', 'storybook-static/**', 'storybook-build/**'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser: tsParser },
    plugins: { '@typescript-eslint': tseslint, react, 'react-hooks': hooks },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...hooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
    },
    settings: { react: { version: 'detect' } },
  },
  ...astro.configs['flat/recommended'],
];
