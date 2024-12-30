import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';


/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['dist/**/*', 'eslint.config.js'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
  },
  {
    languageOptions: { globals: globals.node },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      'comma-dangle': ['error', 'always-multiline'],
      'object-property-newline': ['error', { 'allowAllPropertiesOnSameLine': false }],
      'quotes': ['error', 'single', { 'avoidEscape': true }],
      'max-len': ['error', { 'code': 80, 'tabWidth': 4, 'ignoreUrls': true, 'ignoreStrings': true, 'ignoreTemplateLiterals': true, 'ignoreComments': true }],
    },
  },
];
