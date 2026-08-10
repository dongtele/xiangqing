import js from '@eslint/js';
import ts from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';

/**
 * ESLint flat config。
 * 格式类规则一律交给 Prettier（`eslint-config-prettier` 关掉冲突项），
 * 未使用变量交给 tsconfig 的 `noUnusedLocals`，这里只管真正的代码问题。
 */
export default ts.config(
  {
    ignores: ['dist/**', 'shots/**', 'node_modules/**', 'src/**/*.d.ts'],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        parser: ts.parser,
        extraFileExtensions: ['.vue'],
      },
      globals: {
        // uni-app 注入的全局对象与类型命名空间
        uni: 'readonly',
        wx: 'readonly',
        UniApp: 'readonly',
        getCurrentPages: 'readonly',
        getApp: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      // 未使用变量由 tsconfig 的 noUnusedLocals 报，避免两处重复告警
      '@typescript-eslint/no-unused-vars': 'off',
      // uni-app 的事件对象类型与 DOM Event 对不上，页面里靠断言取 detail
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      // 小票文案里用全角空格（U+3000）做分栏对齐，是有意的排版
      'no-irregular-whitespace': ['error', { skipTemplates: true }],
      // 页面组件是单文件、按屏号命名，不强制多词组件名
      'vue/multi-word-component-names': 'off',
      // 属性换行交给 Prettier
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/attributes-order': 'off',
    },
  },
  {
    // App.vue 在 uni-app 里没有根节点（页面由 pages.json 驱动），这条规则不适用
    files: ['src/App.vue'],
    rules: { 'vue/valid-template-root': 'off' },
  },
  {
    files: ['test/**/*.ts', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: { process: 'readonly', __dirname: 'readonly' },
    },
    rules: {
      'no-console': 'off',
    },
  },
  prettier
);
