/**
 * 极简 WXML → HTML 渲染器（仅用于本地静态预览，不参与小程序构建）。
 * 支持本工程实际用到的子集：{{}} 插值、wx:if/elif/else、wx:for、block、自定义组件。
 */
'use strict';

const VOID_TAGS = new Set(['image', 'input', 'img', 'br', 'hr']);

const TAG_MAP = {
  view: 'div',
  text: 'span',
  image: 'img',
  'scroll-view': 'div',
  block: null, // fragment
  button: 'button',
  input: 'input',
  textarea: 'div',
  navigator: 'a',
};

/* ------------------------------------------------------------------ 解析 */

/** 找标签结束的 `>`，跳过属性值里的 `>`（如 wx:if="{{qty > 0}}"） */
function findTagEnd(src, start) {
  let quote = null;
  for (let i = start + 1; i < src.length; i += 1) {
    const ch = src[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '>') return i;
  }
  return -1;
}

function parse(src) {
  const root = { type: 'root', children: [] };
  const stack = [root];
  let i = 0;

  const push = (node) => stack[stack.length - 1].children.push(node);

  while (i < src.length) {
    if (src.startsWith('<!--', i)) {
      i = src.indexOf('-->', i);
      i = i < 0 ? src.length : i + 3;
      continue;
    }
    if (src[i] === '<') {
      const close = src[i + 1] === '/';
      const end = findTagEnd(src, i);
      if (end < 0) break;
      const raw = src.slice(i + 1, end);
      if (close) {
        stack.pop();
        i = end + 1;
        continue;
      }
      const selfClose = raw.endsWith('/');
      const body = selfClose ? raw.slice(0, -1) : raw;
      const m = body.match(/^([\w-]+)/);
      const tag = m ? m[1] : 'view';
      const node = { type: 'element', tag, attrs: parseAttrs(body.slice(tag.length)), children: [] };
      push(node);
      if (!selfClose && !VOID_TAGS.has(tag)) stack.push(node);
      i = end + 1;
      continue;
    }
    const next = src.indexOf('<', i);
    const text = src.slice(i, next < 0 ? src.length : next);
    if (text.trim()) push({ type: 'text', text: text.replace(/\s+/g, ' ') });
    i = next < 0 ? src.length : next;
  }
  return root.children;
}

function parseAttrs(str) {
  const attrs = {};
  const re = /([\w:.-]+)(?:\s*=\s*"([^"]*)")?/g;
  let m;
  while ((m = re.exec(str))) {
    attrs[m[1]] = m[2] === undefined ? true : m[2];
  }
  return attrs;
}

/* ------------------------------------------------------ 表达式 / 插值求值 */

const evalCache = new Map();

function evaluate(expr, scope) {
  const keys = Object.keys(scope);
  const cacheKey = `${expr}::${keys.join(',')}`;
  let fn = evalCache.get(cacheKey);
  if (!fn) {
    try {
      // eslint-disable-next-line no-new-func
      fn = new Function(...keys, `"use strict";return (${expr});`);
    } catch (err) {
      fn = () => '';
    }
    evalCache.set(cacheKey, fn);
  }
  try {
    const out = fn(...keys.map((k) => scope[k]));
    return out === undefined || out === null ? '' : out;
  } catch (err) {
    // WXML 对空值是宽容的，这里同样静默降级为空
    return '';
  }
}

/** 整个值就是一个 {{}} 时保留原始类型，否则做字符串插值 */
function resolveValue(value, scope) {
  if (typeof value !== 'string') return value;
  // 只有「整串就是一个 {{}}」时才保留类型；注意不能贪婪地吞掉中间的 }}{{
  const single = value.match(/^\{\{((?:(?!\}\})[\s\S])+)\}\}$/);
  if (single) return evaluate(single[1], scope);
  if (value.indexOf('{{') < 0) return value;
  return value.replace(/\{\{([\s\S]+?)\}\}/g, (_, e) => String(evaluate(e, scope)));
}

/* ------------------------------------------------------------------ 渲染 */

const rpx = (css) => css.replace(/(-?[\d.]+)rpx/g, (_, n) => `${parseFloat(n) * 0.5}px`);
const safeArea = (css) => css.replace(/env\(safe-area-inset-bottom\)/g, 'var(--sab)');
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const MODE_FIT = {
  aspectFill: 'cover',
  aspectFit: 'contain',
  scaleToFill: 'fill',
};

/**
 * 预览环境取不到外部图床（也没必要），按交付文档的做法用 #F0EAE3 灰块 + 图片字形占位。
 * 小程序源码里仍然是真实的 CDN 地址。
 */
const PLACEHOLDER_GLYPH = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">' +
    '<g fill="none" stroke="#D8CFC5" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="8" y="11" width="32" height="26" rx="4"/><path d="M8 30l9-8 7 6 5-5 11 10"/>' +
    '<circle cx="18" cy="20" r="2.6"/></g></svg>'
)}")`;

const TRANSPARENT_PX =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function isSkipAttr(name) {
  return (
    name.startsWith('wx:') ||
    name.startsWith('bind') ||
    name.startsWith('catch') ||
    name.startsWith('data-') ||
    name.startsWith('aria-') ||
    ['mode', 'lazy-load', 'scroll-y', 'scroll-x', 'enhanced', 'show-scrollbar', 'scroll-into-view',
      'scroll-with-animation', 'hover-class', 'open-type', 'loading', 'placeholder-class',
      'placeholder', 'value'].includes(name)
  );
}

function renderNodes(nodes, scope, ctx) {
  let out = '';
  let lastCond = null; // 上一个 wx:if 链的命中情况
  for (const node of nodes) {
    if (node.type === 'text') {
      out += escapeHtml(resolveValue(node.text, scope));
      continue;
    }
    const attrs = node.attrs;

    if ('wx:if' in attrs) {
      lastCond = !!resolveValue(attrs['wx:if'], scope);
      if (!lastCond) continue;
    } else if ('wx:elif' in attrs) {
      if (lastCond) continue;
      lastCond = !!resolveValue(attrs['wx:elif'], scope);
      if (!lastCond) continue;
    } else if ('wx:else' in attrs) {
      if (lastCond) continue;
      lastCond = true;
    } else {
      lastCond = null;
    }

    if ('wx:for' in attrs) {
      const list = resolveValue(attrs['wx:for'], scope) || [];
      const itemName = attrs['wx:for-item'] || 'item';
      const indexName = attrs['wx:for-index'] || 'index';
      const arr = Array.isArray(list) ? list : [];
      arr.forEach((item, index) => {
        const childScope = { ...scope, [itemName]: item, [indexName]: index };
        out += renderElement(node, childScope, ctx);
      });
      continue;
    }

    out += renderElement(node, scope, ctx);
  }
  return out;
}

function renderElement(node, scope, ctx) {
  const { tag, attrs } = node;

  // 自定义组件
  const compPath = ctx.components[tag];
  if (compPath) {
    const props = {};
    Object.keys(attrs).forEach((name) => {
      if (name.startsWith('wx:') || name.startsWith('bind') || name.startsWith('catch')) return;
      if (['class', 'style', 'id'].includes(name) || name.startsWith('data-')) return;
      const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      props[camel] = resolveValue(attrs[name], scope);
    });
    const hostClass = attrs.class ? resolveValue(attrs.class, scope) : '';
    const hostStyle = attrs.style ? resolveValue(attrs.style, scope) : '';
    return ctx.renderComponent(compPath, tag, props, hostClass, hostStyle);
  }

  const htmlTag = tag in TAG_MAP ? TAG_MAP[tag] : 'div';
  const inner = renderNodes(node.children, scope, ctx);
  if (htmlTag === null) return inner; // block

  let html = `<${htmlTag}`;
  let style = attrs.style ? rpx(safeArea(String(resolveValue(attrs.style, scope)))) : '';

  if (tag === 'image') {
    const src = String(resolveValue(attrs.src, scope) || '');
    if (src.startsWith('data:')) {
      html += ` src="${escapeHtml(src)}" alt=""`;
      style = `object-fit:${MODE_FIT[attrs.mode] || 'cover'};${style}`;
    } else {
      // 占位灰块：图形固定 40px 居中，任意尺寸都不会被拉伸变形
      html += ` src="${escapeHtml(TRANSPARENT_PX)}" alt=""`;
      if (src) html += ` data-src="${escapeHtml(src)}"`;
      style = `background:#F0EAE3 center/40px 40px no-repeat ${PLACEHOLDER_GLYPH};${style}`;
    }
  }
  if (tag === 'textarea') {
    // 预览里用 div 呈现，空值时显示 placeholder
    const val = String(resolveValue(attrs.value, scope) || '');
    const ph = String(resolveValue(attrs.placeholder, scope) || '');
    const body = val || ph;
    const phClass = val ? '' : ' data-empty="1"';
    return `<div class="${escapeHtml(String(resolveValue(attrs.class, scope) || ''))}"${phClass} style="${escapeHtml(
      rpx(safeArea(String(resolveValue(attrs.style, scope) || '')))
    )}">${escapeHtml(body)}</div>`;
  }
  if (tag === 'input') {
    const val = resolveValue(attrs.value, scope);
    const ph = resolveValue(attrs.placeholder, scope);
    html += ` value="${escapeHtml(val || '')}" placeholder="${escapeHtml(ph || '')}"`;
    if (attrs['placeholder-class']) html += ` data-ph-class="${attrs['placeholder-class']}"`;
  }
  if (tag === 'scroll-view') {
    style = `${'scroll-y' in attrs ? 'overflow-y:auto;' : ''}${'scroll-x' in attrs ? 'overflow-x:auto;white-space:nowrap;' : ''}${style}`;
  }

  Object.keys(attrs).forEach((name) => {
    if (isSkipAttr(name) || name === 'style' || name === 'src') return;
    const value = resolveValue(attrs[name], scope);
    if (value === true) return;
    if (value === '' || value === false) return;
    html += ` ${name}="${escapeHtml(value)}"`;
  });

  if (style) html += ` style="${escapeHtml(style)}"`;
  html += '>';
  if (VOID_TAGS.has(tag)) return html;
  return `${html}${inner}</${htmlTag}>`;
}

module.exports = { parse, renderNodes, rpx, safeArea };
