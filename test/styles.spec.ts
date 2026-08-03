import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 样式回归：禁止跨「会包一层内容容器的内置组件」写子选择器。
 *
 * uni-app 的 scroll-view / swiper / picker-view / movable-area 在 H5 与小程序端
 * 都会在自身与插槽内容之间再插一层容器，H5 的 scroll-view 更是插了两层：
 *
 *   <uni-scroll-view class="x__body">      ← 类名挂在这里
 *     <div class="uni-scroll-view">
 *       <div class="uni-scroll-view-content">
 *         <view class="card">              ← 内容其实在这里
 *
 * 所以 `.x__body > .card { margin-bottom: 20rpx }` 一条都匹配不上：规则照样编进产物，
 * 但选不中任何元素。这个坑曾让 45 个页面的卡片全部贴在一起，肉眼只能看出「没有分隔」，
 * 排查成本很高，因此固化成用例。
 *
 * 正确写法是把间距挂在块自身（scoped 样式已经限定在本页）：`.card { margin-bottom: 20rpx }`。
 */

const SRC = fileURLToPath(new URL('../src', import.meta.url));

/** 这些内置组件会在自身与插槽内容之间插入包裹层，`>` 选不到内容 */
const WRAPPING_TAGS = ['scroll-view', 'swiper', 'picker-view', 'movable-area'];

function vueFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...vueFiles(full));
    else if (entry.name.endsWith('.vue')) out.push(full);
  }
  return out;
}

/** 取出挂在包裹型内置组件上的静态 class */
function wrappingClasses(template: string): Set<string> {
  const found = new Set<string>();
  const tags = WRAPPING_TAGS.join('|');
  const re = new RegExp(`<(?:${tags})\\b[^>]*?\\sclass="([^"]+)"`, 'gs');
  for (const m of template.matchAll(re)) {
    for (const cls of m[1].split(/\s+/)) {
      if (cls && !cls.startsWith('{')) found.add(cls);
    }
  }
  return found;
}

describe('样式：不跨 scroll-view 等包裹型组件写子选择器', () => {
  it('src 下没有 `.挂在包裹型组件上的类 > 子元素` 这种选不中的规则', () => {
    const offenders: string[] = [];

    for (const file of vueFiles(SRC)) {
      const source = readFileSync(file, 'utf-8');
      const styleAt = source.indexOf('<style');
      if (styleAt < 0) continue;

      const template = source.slice(0, styleAt);
      const style = source.slice(styleAt);

      for (const cls of wrappingClasses(template)) {
        const re = new RegExp(`\\.${cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*>`, 'g');
        for (const m of style.matchAll(re)) {
          const rest = style
            .slice(m.index, m.index + 60)
            .split('\n')[0]
            .trim();
          offenders.push(`${file.slice(SRC.length + 1)}: ${rest}`);
        }
      }
    }

    expect(offenders, `改成把间距挂在块自身，例如 .card { margin-bottom: 20rpx }`).toEqual([]);
  });
});
