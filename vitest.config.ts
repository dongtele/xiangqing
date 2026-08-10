import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * 测试用独立配置——不能复用 vite.config.ts。
 * 那份挂着 uni() 插件，会去编译 pages.json 里的所有页面；
 * 单测只跑纯逻辑与假后端，不需要（也跑不动）uni 的编译链路。
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.spec.ts'],
  },
});
