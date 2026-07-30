/** WXSS → 作用域化 CSS（预览用）。逐屏加前缀，避免多屏样式互相污染。 */
'use strict';

const fs = require('fs');
const path = require('path');
const { rpx, safeArea } = require('./wxml');

/** 内联 @import */
function readWxss(file) {
  if (!fs.existsSync(file)) return '';
  const dir = path.dirname(file);
  return fs.readFileSync(file, 'utf8').replace(/@import\s+['"]([^'"]+)['"];?/g, (_, rel) => {
    return readWxss(path.resolve(dir, rel));
  });
}

/** 按顶层块切分，保留 at-rule 结构 */
function splitBlocks(css) {
  const out = [];
  let i = 0;
  while (i < css.length) {
    while (i < css.length && /\s/.test(css[i])) i += 1;
    if (i >= css.length) break;
    if (css.startsWith('/*', i)) {
      const end = css.indexOf('*/', i);
      i = end < 0 ? css.length : end + 2;
      continue;
    }
    let j = i;
    while (j < css.length && css[j] !== '{' && css[j] !== ';') j += 1;
    if (j >= css.length) break;
    if (css[j] === ';') {
      out.push({ prelude: css.slice(i, j).trim(), body: null });
      i = j + 1;
      continue;
    }
    const prelude = css.slice(i, j).trim();
    let depth = 0;
    let k = j;
    for (; k < css.length; k += 1) {
      if (css[k] === '{') depth += 1;
      else if (css[k] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    out.push({ prelude, body: css.slice(j + 1, k) });
    i = k + 1;
  }
  return out;
}

function prefixSelector(sel, scope, hostTag) {
  const s = sel.trim();
  if (!s) return '';
  if (s === 'page') return scope;
  if (s.startsWith('page ')) return `${scope} ${s.slice(5)}`;
  if (s.startsWith(':host')) {
    const rest = s.slice(5).trim();
    return `${scope} ${hostTag || '*'}${rest ? ` ${rest}` : ''}`;
  }
  return `${scope} ${s}`;
}

/**
 * @param css      原始 wxss
 * @param scope    形如 "#s01"
 * @param hostTag  组件宿主标签（:host 用）
 * @param keyframes 收集容器（全局只输出一次）
 */
function scopeCss(css, scope, hostTag, keyframes) {
  let out = '';
  splitBlocks(safeArea(rpx(css))).forEach(({ prelude, body }) => {
    if (body === null) return; // @import / 其它单行 at-rule，已内联或忽略
    if (/^@keyframes/i.test(prelude)) {
      keyframes.set(prelude, body);
      return;
    }
    if (/^@(media|supports)/i.test(prelude)) {
      out += `${prelude}{${scopeCss(body, scope, hostTag, keyframes)}}\n`;
      return;
    }
    const selectors = prelude
      .split(',')
      .map((s) => prefixSelector(s, scope, hostTag))
      .filter(Boolean)
      .join(', ');
    out += `${selectors}{${body.trim()}}\n`;
  });
  return out;
}

module.exports = { readWxss, scopeCss };
