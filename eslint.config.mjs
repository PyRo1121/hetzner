/**
 * Enterprise-Grade ESLint Configuration for Next.js 15
 * Using ESLint 9 Flat Config
 * 
 * Features:
 * - Next.js 15 + React 19 support
 * - TypeScript strict mode
 * - Import organization
 * - Accessibility (WCAG 2.1 AA)
 * - Security & performance rules
 */

import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,

  // Main configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        NodeJS: 'readonly',
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        localStorage: 'readonly',
        require: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'import': importPlugin,
      '@next/next': nextPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // ==========================================
      // TYPESCRIPT RULES (STRICT MODE)
      // ==========================================
      ...typescript.configs.recommended.rules,
      ...typescript.configs['recommended-type-checked'].rules,
      
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any for external API responses
      '@typescript-eslint/no-non-null-assertion': 'off', // Allow non-null assertions when we know better
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
      }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'off', // External APIs return any
      '@typescript-eslint/no-unsafe-member-access': 'off', // External APIs return any
      '@typescript-eslint/no-unsafe-call': 'off', // External APIs return any
      '@typescript-eslint/no-unsafe-return': 'off', // External APIs return any
      '@typescript-eslint/no-unsafe-argument': 'off', // External APIs return any

      // ==========================================
      // REACT & NEXT.JS RULES
      // ==========================================
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      'react/jsx-curly-brace-presence': ['error', {
        props: 'never',
        children: 'never',
      }],
      'react/self-closing-comp': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-no-leaked-render': ['error', {
        validStrategies: ['ternary', 'coerce'],
      }],
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-pascal-case': 'error',
      'react/no-unused-prop-types': 'warn',
      'react/no-unused-state': 'warn',
      'react/jsx-no-bind': ['error', {
        ignoreRefs: true,
        allowArrowFunctions: true,
        allowFunctions: false,
        allowBind: false,
      }],
      'react/no-danger': 'warn',
      'react/no-deprecated': 'error',

      // ==========================================
      // NEXT.JS RULES
      // ==========================================
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'error',
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-page-custom-font': 'warn',

      // ==========================================
      // IMPORT/EXPORT RULES
      // ==========================================
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,

      'import/order': ['error', {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
          'object',
          'type',
        ],
        pathGroups: [
          {
            pattern: 'react',
            group: 'builtin',
            position: 'before',
          },
          {
            pattern: 'next/**',
            group: 'builtin',
            position: 'before',
          },
          {
            pattern: '@/**',
            group: 'internal',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      }],
      'import/no-duplicates': 'error',
      'import/no-self-import': 'error',
      'import/no-cycle': 'error',
      'import/no-useless-path-segments': 'error',
      'import/no-mutable-exports': 'error',

      // ==========================================
      // ACCESSIBILITY RULES (WCAG 2.1 AA)
      // ==========================================
      ...jsxA11y.configs.recommended.rules,

      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/label-has-associated-control': 'error',

      // ==========================================
      // GENERAL CODE QUALITY
      // ==========================================
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-var': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'curly': ['error', 'all'],
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'no-nested-ternary': 'off', // Allow nested ternaries for concise conditional rendering
      'no-unneeded-ternary': 'error',
      'no-useless-return': 'error',
      'no-useless-rename': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-object-spread': 'error',
      'no-param-reassign': ['warn', { props: false }],
      'no-shadow': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },

  // ==========================================
  // IGNORE PATTERNS
  // ==========================================
  {
    ignores: [
      // Dependencies
      'node_modules/**',
      'bower_components/**',

      // Build outputs
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',

      // Config files
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      'next.config.js',
      'tailwind.config.ts',
      'postcss.config.js',
      'vitest.config.ts',
      'playwright.config.ts',

      // Coverage
      'coverage/**',
      '.nyc_output/**',

      // Cache
      '.cache/**',
      '.turbo/**',

      // TypeScript
      '*.tsbuildinfo',
      'next-env.d.ts',

      // Environment
      '.env*',
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',

      // Lock files
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'bun.lock',

      // Vercel
      '.vercel/**',

      // Database
      'prisma/**',

      // Scripts - EXCLUDED FROM LINTING
      'scripts/**',

      // Supabase
      'supabase/**',

      // Tests - EXCLUDED FROM LINTING
      'tests/**',
      'test/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      'src/tests/**',

      // Storybook
      '.storybook/**',
      'storybook-static/**',

      // Public
      'public/**',

      // Sentry
      'sentry.*.config.ts',
      'sentry.*.config.js',

      // Instrumentation
      'instrumentation.ts',
      'instrumentation.client.ts',

      // IDE
      '.vscode/**',
      '.idea/**',
      '.windsurf/**',

      // Rust WASM
      'rust-wasm/**',

      // Docs
      'Docs/**',
    ],
  },
];
