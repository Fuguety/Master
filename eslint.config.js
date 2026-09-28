import eslint from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist', 'coverage'] },
    {
        extends: [eslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
            parserOptions: {
                project: ['./tsconfig.app.json', './tsconfig.node.json'],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            ...reactRefresh.configs.vite.rules,
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            'brace-style': ['error', 'allman', { allowSingleLine: false }],
            'curly': ['error', 'all'],
            'eqeqeq': ['error', 'always'],
        },
    },
);
