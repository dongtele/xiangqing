/**
 * 生成静态预览页：编译 miniprogram 下的 TS，用替身运行时跑一遍页面逻辑，
 * 再用真实 WXML + WXSS 渲染成一页可视化的 HTML。
 *
 * 用法：node tools/preview/build.js [输出路径]
 *
 * 预览专用的等价替换（不影响小程序源码）：
 *   rpx → px(×0.5)   env(safe-area-inset-bottom) → var(--sab)
 *   100vh → 100%     position:fixed → position:absolute（约束在手机画框内）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { parse, renderNodes } = require('./wxml');
const { readWxss, scopeCss } = require('./css');
const { Runtime } = require('./runtime');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'miniprogram');
const BUILD = path.join(ROOT, '.preview-build');

/* --------------------------------------------------------------- 场景定义 */

const SCENES = [
  {
    id: '13',
    name: '微信授权登录',
    note: '入口：小程序冷启动 / 未登录状态下点「去支付」',
    page: 'pages/login/index',
    seed: 'guest',
    dark: false,
    step: 1,
  },
  {
    id: '01',
    name: '点餐菜单',
    note: '首页：左侧分类锚点 + 右侧商品列表 + 底部购物车条',
    page: 'pages/customer/menu/index',
    seed: 'cart',
    dark: true,
    step: 1,
  },
  {
    id: '05',
    name: '我的订单',
    note: '顾客端 TabBar 第 2 项：状态 Tab + 订单卡片',
    page: 'pages/customer/orders/index',
    seed: 'user',
    dark: false,
    step: 1,
  },
  {
    id: '07',
    name: '我的（个人中心）',
    note: '顾客端 TabBar 第 3 项：角色分流入口在「商家管理」卡片',
    page: 'pages/customer/profile/index',
    seed: 'user',
    dark: true,
    step: 1,
  },
  {
    id: '08',
    name: '工作台',
    note: '商家端 TabBar 第 1 项：待处理直达订单管理',
    page: 'pages/merchant/dashboard/index',
    seed: 'merchant',
    dark: false,
    step: 1,
  },
  {
    id: '09',
    name: '订单管理',
    note: '商家端 TabBar 第 2 项：待接单高亮 + 倒计时（每秒刷新）',
    page: 'pages/merchant/orders/index',
    seed: 'merchant',
    dark: false,
    step: 1,
  },
  {
    id: '10',
    name: '商品管理',
    note: '商家端 TabBar 第 3 项：上下架开关、低库存预警、售罄补货',
    page: 'pages/merchant/goods/index',
    seed: 'merchant',
    dark: false,
    step: 1,
  },
  {
    id: '12',
    name: '店铺中心',
    note: '商家端 TabBar 第 4 项：底部「切换到顾客视角」完成角色闭环',
    page: 'pages/merchant/shop/index',
    seed: 'merchant',
    dark: true,
    step: 1,
  },
  {
    id: '62',
    name: '商家订单详情',
    note: '09 点订单卡片进入：菜品明细、备注、顾客信息、接单并打印',
    page: 'pages/merchant/order-detail/index',
    query: { id: 'm_1024' },
    seed: 'merchant',
    dark: false,
    step: 3,
  },
  {
    id: '62b',
    name: '商家订单详情 · 备餐中',
    note: '接单后同一页面的状态：底部操作变为补打小票 / 出餐完成',
    page: 'pages/merchant/order-detail/index',
    query: { id: 'm_1023' },
    seed: 'merchant',
    dark: false,
    step: 3,
  },
  {
    id: '51',
    name: '小票打印',
    note: '62 右上「打印」进入：设备状态、打印设置、后厨联 / 顾客联预览与补打',
    page: 'pages/merchant/print/index',
    query: { orderId: 'm_1024' },
    seed: 'merchant',
    dark: false,
    step: 3,
  },
  {
    id: '51b',
    name: '小票打印 · 顾客联',
    note: '同一页切到「顾客联」：小票带金额与页脚，联数按设置一次性补打',
    page: 'pages/merchant/print/index',
    query: { orderId: 'm_1024' },
    seed: 'merchant',
    dark: false,
    step: 3,
    after: (inst) => inst.onSwitchTab({ currentTarget: { dataset: { key: 'customer' } } }),
    settle: 500,
  },
  {
    id: '53',
    name: '配送实时追踪',
    note: '06 →「查看配送」：轨迹示意图 + 进度条 + 骑手信息（8s 轮询，离开页面停止）',
    page: 'pages/customer/delivery-track/index',
    query: { id: 'ord_1024' },
    seed: 'user',
    dark: false,
    step: 4,
  },
  {
    id: '84',
    name: '联系骑手',
    note: '53 点电话按钮：虚拟号提示 + 会话 + 快捷短语',
    page: 'pages/customer/rider-chat/index',
    query: { id: 'ord_1024' },
    seed: 'user',
    dark: false,
    step: 4,
  },
  {
    id: '20',
    name: '申请售后',
    note: '06 →「申请售后」：类型 / 原因 / 说明 / 凭证，退款金额由服务端试算',
    page: 'pages/customer/aftersale/index',
    query: { id: 'ord_1024' },
    seed: 'user',
    dark: false,
    step: 4,
  },
  {
    id: '56',
    name: '选择退款商品',
    note: '20 →「退款商品」：勾选部分商品，按实付比例分摊优惠实时算退款额',
    page: 'pages/customer/refund-items/index',
    query: { id: 'ord_1024' },
    seed: 'user',
    dark: false,
    step: 4,
  },
  {
    id: '40',
    name: '退款进度',
    note: '20 提交后进入：状态时间轴 + 金额与流水，可撤销申请',
    page: 'pages/customer/refund-detail/index',
    query: { id: 'rf_2001' },
    seed: 'user',
    dark: false,
    step: 4,
  },
  {
    id: '48',
    name: '退款审核',
    note: '09 售后 Tab →「处理退款申请」：凭证、退款商品、同意 / 拒绝（超时自动同意）',
    page: 'pages/merchant/refund-review/index',
    query: { id: 'rf_2001' },
    seed: 'merchant',
    dark: false,
    step: 4,
  },
  {
    id: '09b',
    name: '订单管理 · 售后 Tab',
    note: '售后单卡片：退款金额与原因 + 处理入口',
    page: 'pages/merchant/orders/index',
    seed: 'merchant',
    dark: false,
    step: 4,
    after: (inst) => inst.onSwitchTab({ currentTarget: { dataset: { key: 'aftersale' } } }),
    settle: 500,
  },
  {
    id: '02',
    name: '商品详情',
    note: '01 →「选规格」进入：份量 / 辣度 / 加料，实时算价',
    page: 'pages/customer/goods/index',
    query: { id: 'g1' },
    seed: 'user',
    dark: true,
    step: 2,
  },
  {
    id: '30',
    name: '购物车明细',
    note: '01 点购物车条上滑：改数量 / 清空 / 满减进度',
    page: 'pages/customer/menu/index',
    seed: 'cart',
    dark: true,
    step: 2,
    after: (inst) => inst.setData({ sheetShow: true }),
  },
  {
    id: '03',
    name: '确认订单',
    note: '30 →「去结算」：配送方式、地址、金额明细（服务端试算）',
    page: 'pages/customer/checkout/index',
    seed: 'cart',
    dark: false,
    step: 2,
  },
  {
    id: '85',
    name: '支付方式选择',
    note: '03 →「微信支付」：多支付方式 + 15 分钟倒计时',
    page: 'pages/customer/pay-method/index',
    seed: 'order-unpaid',
    dark: false,
    step: 2,
  },
  {
    id: '43',
    name: '收银台 · 支付失败',
    note: '85 →「确认支付」：唤起支付失败后的兜底弹窗与重试',
    page: 'pages/customer/pay/index',
    seed: 'order-unpaid',
    dark: false,
    step: 2,
  },
  {
    id: '04',
    name: '支付成功',
    note: '43 重新支付成功：结果页 + 后续引导',
    page: 'pages/customer/pay-result/index',
    seed: 'order-paid',
    dark: false,
    step: 2,
  },
  {
    id: '06',
    name: '订单详情',
    note: '04 →「查看订单详情」/ 05 →「查看进度」：四段状态轴 + 骑手',
    page: 'pages/customer/order-detail/index',
    query: { id: 'ord_1024' },
    seed: 'user',
    dark: true,
    step: 2,
  },
];

/* ------------------------------------------------------------------- 工具 */

function compileTs() {
  execFileSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['tsc', '-p', path.join('tools', 'preview', 'tsconfig.build.json')],
    { cwd: ROOT, stdio: 'inherit' }
  );
}

function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ---------------------------------------------------------- 组件渲染上下文 */

const componentCache = new Map();

function componentMeta(absBase) {
  if (componentCache.has(absBase)) return componentCache.get(absBase);
  const json = readJson(`${absBase}.json`);
  const meta = {
    dir: path.dirname(absBase),
    nodes: parse(fs.readFileSync(`${absBase}.wxml`, 'utf8')),
    wxss: readWxss(`${absBase}.wxss`),
    using: resolveUsing(json.usingComponents, path.dirname(absBase)),
    options: null,
  };
  componentCache.set(absBase, meta);
  return meta;
}

function resolveUsing(using, baseDir) {
  const out = {};
  Object.keys(using || {}).forEach((name) => {
    out[name] = path.resolve(baseDir, using[name]);
  });
  return out;
}

function castProp(def, raw) {
  if (raw === undefined) return typeof def.value === 'undefined' ? '' : def.value;
  if (def.type === Boolean) return raw === true || raw === 'true' || !!raw;
  if (def.type === Number) return Number(raw);
  if (def.type === String) return raw === true ? '' : String(raw);
  return raw;
}

function makeRenderComponent(runtime, usedComponents) {
  return function renderComponent(absBase, tag, props, hostClass, hostStyle) {
    const meta = componentMeta(absBase);
    usedComponents.set(absBase, tag);

    if (!meta.options) {
      const rel = path.relative(SRC, `${absBase}.js`);
      meta.options = runtime.loadComponent(rel);
    }
    const def = meta.options;
    const inst = runtime.createInstance(def, true);

    const properties = {};
    Object.keys(def.properties || {}).forEach((name) => {
      properties[name] = castProp(def.properties[name], props[name]);
    });
    inst.properties = properties;
    Object.assign(inst.data, properties);

    Object.keys(def.observers || {}).forEach((keyList) => {
      const keys = keyList.split(',').map((k) => k.trim());
      try {
        def.observers[keyList].apply(
          inst,
          keys.map((k) => inst.data[k])
        );
      } catch (err) {
        /* 观察器依赖运行时环境时忽略 */
      }
    });
    if (def.lifetimes && typeof def.lifetimes.attached === 'function') {
      def.lifetimes.attached.call(inst);
    }

    const ctx = {
      components: meta.using,
      renderComponent,
    };
    const inner = renderNodes(meta.nodes, inst.data, ctx);
    if (def.options && def.options.virtualHost) return inner;

    const cls = ['wxcomp', `wxcomp--${tag}`, hostClass].filter(Boolean).join(' ');
    const style = hostStyle ? ` style="${hostStyle}"` : '';
    return `<div class="${cls}"${style}>${inner}</div>`;
  };
}

/* ----------------------------------------------------------------- 数据种子 */

function seedCart(runtime) {
  const { cartStore } = runtime.require('store/cart.js');
  const db = runtime.require('services/mock/db.js');
  const { CURRENT_SHOP_ID } = runtime.require('config.js');
  const pork = db.goodsList.find((g) => g.id === 'g1');
  const juice = db.goodsList.find((g) => g.id === 'g5');
  cartStore.add(CURRENT_SHOP_ID, pork, [
    pork.specGroups[0].options[1], // 大份
    pork.specGroups[1].options[1], // 微辣
  ]);
  cartStore.add(CURRENT_SHOP_ID, juice, [juice.specGroups[0].options[0]], 2); // 常温 x2
  return cartStore;
}

function seedUser(runtime, role) {
  const { userStore } = runtime.require('store/user.js');
  const db = runtime.require('services/mock/db.js');
  userStore.login(db.user, role || 'customer');
  return userStore;
}

async function applySeed(runtime, seed) {
  const query = {};
  if (seed === 'guest') return query;

  if (seed === 'merchant') {
    seedUser(runtime, 'merchant');
    return query;
  }
  seedUser(runtime, 'customer');
  if (seed === 'user') return query;

  const cartStore = seedCart(runtime);
  if (seed === 'cart') return query;

  const api = runtime.require('services/api.js');
  const { orderId } = await api.createOrder(cartStore.snapshot(), 'delivery', '不要辣，餐具 1 份');
  query.id = orderId;
  if (seed === 'order-unpaid') return query;

  // 首次故意失败（mock 配置），重试成功 —— 走通 43 → 04
  await api.payOrder(orderId, 'wechat');
  await api.payOrder(orderId, 'wechat');
  return query;
}

/* ------------------------------------------------------------------ 渲染屏 */

async function renderScene(scene, keyframes) {
  const runtime = new Runtime(BUILD);
  runtime.reset();
  runtime.bootApp();

  const seededQuery = await applySeed(runtime, scene.seed);
  const query = { ...seededQuery, ...(scene.query || {}) };

  const pageBase = path.join(SRC, scene.page);
  const options = runtime.loadPage(`${scene.page}.js`);
  const inst = runtime.createInstance(options, false);

  if (typeof inst.onLoad === 'function') inst.onLoad(query);
  await wait(700);
  if (typeof inst.onShow === 'function') inst.onShow();
  await wait(700);
  if (typeof inst.onReady === 'function') inst.onReady();
  await wait(200);
  if (scene.after) {
    scene.after(inst);
    await wait(scene.settle || 0);
  }

  const json = readJson(`${pageBase}.json`);
  const usedComponents = new Map();
  const ctx = {
    components: resolveUsing(json.usingComponents, path.dirname(pageBase)),
    renderComponent: makeRenderComponent(runtime, usedComponents),
  };
  const nodes = parse(fs.readFileSync(`${pageBase}.wxml`, 'utf8'));
  const body = renderNodes(nodes, inst.data, ctx);

  const scope = `#s${scene.id}`;
  let css = scopeCss(readWxss(path.join(SRC, 'app.wxss')), scope, null, keyframes);
  css += scopeCss(readWxss(`${pageBase}.wxss`), scope, null, keyframes);
  usedComponents.forEach((tag, absBase) => {
    css += scopeCss(componentMeta(absBase).wxss, scope, `.wxcomp--${tag}`, keyframes);
  });

  // 预览专属：把整屏约束进画框
  css = css.replace(/(\d+)vh/g, '$1%').replace(/position:\s*fixed/g, 'position:absolute');

  return { scene, body, css, timers: runtime.navigations };
}

/* -------------------------------------------------------------------- 输出 */

function chromeDeco(dark) {
  const fg = dark ? '#FFFFFF' : '#20160F';
  const bars = [4, 6, 8, 10]
    .map((h) => `<i style="height:${h}px;background:${fg}"></i>`)
    .join('');
  return `
  <div class="pv-chrome">
    <div class="pv-chrome__status">
      <span style="color:${fg}">9:41</span>
      <div class="pv-chrome__right">
        <div class="pv-chrome__signal">${bars}</div>
        <div class="pv-chrome__battery" style="border-color:${dark ? 'rgba(255,255,255,.8)' : 'rgba(32,22,15,.7)'}">
          <i style="background:${fg}"></i>
        </div>
      </div>
    </div>
    <div class="pv-chrome__capsule" style="background:${dark ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.92)'};border-color:${dark ? 'rgba(255,255,255,.28)' : '#ECE5DD'}">
      <div class="pv-chrome__dots"><i style="background:${fg}"></i><i style="background:${fg}"></i><i style="background:${fg}"></i></div>
      <div class="pv-chrome__sep" style="background:${dark ? 'rgba(255,255,255,.3)' : '#E8E1D9'}"></div>
      <div class="pv-chrome__target" style="border-color:${fg}"><i style="background:${fg}"></i></div>
    </div>
  </div>`;
}

function frameDeco(result) {
  const { scene, body } = result;
  return `
  <figure class="pv-card">
    <figcaption class="pv-card__head">
      <span class="pv-card__num">${scene.id}</span>
      <span class="pv-card__name">${scene.name}</span>
      <span class="pv-card__step">第 ${scene.step} 步</span>
    </figcaption>
    <div class="pv-frame">
      <div class="pv-frame__inner" id="s${scene.id}">${body}</div>
      ${chromeDeco(scene.dark)}
      <div class="pv-frame__indicator"></div>
    </div>
    <p class="pv-card__note">${scene.note}</p>
  </figure>`;
}

const BASE_CSS = `
*{box-sizing:border-box}
html,body{margin:0;background:#EFECE6;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Noto Sans SC','Microsoft YaHei',sans-serif;color:#20160F;-webkit-font-smoothing:antialiased}
.pv-head{padding:48px 56px 8px;display:flex;flex-direction:column;gap:12px}
.pv-head h1{margin:0;font-size:32px;font-weight:800;letter-spacing:-.5px}
.pv-head .pv-kicker{font-size:12px;font-weight:800;letter-spacing:3px;color:#FF4A17}
.pv-head p{margin:0;max-width:820px;font-size:14px;line-height:1.75;color:#8A8078}
.pv-head code{background:#F7F4EF;border:1px solid #E9E2D9;border-radius:6px;padding:1px 6px;font-size:12.5px;color:#5C5248}
.pv-section{padding:32px 56px}
.pv-section__title{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:22px}
.pv-section__title h2{margin:0;font-size:21px;font-weight:800}
.pv-section__title .pv-tag{background:#FF4A17;color:#fff;font-size:12px;font-weight:800;padding:4px 10px;border-radius:8px}
.pv-section__title span.pv-sub{font-size:13px;color:#8A8078}
.pv-grid{display:flex;flex-wrap:wrap;gap:34px 28px;align-items:flex-start}
.pv-card{margin:0;width:375px;display:flex;flex-direction:column;gap:12px}
.pv-card__head{display:flex;align-items:center;gap:8px}
.pv-card__num{background:#FF4A17;color:#fff;font-size:11px;font-weight:800;padding:3px 7px;border-radius:7px}
.pv-card__name{font-size:14px;font-weight:800}
.pv-card__step{font-size:10px;font-weight:800;color:#8A8078;background:#F1ECE5;padding:2px 6px;border-radius:5px}
.pv-card__note{margin:0;font-size:12px;line-height:1.65;color:#6B6157;background:#F7F4EF;border-radius:12px;padding:10px 14px}
.pv-frame{position:relative;width:375px;height:812px;border-radius:36px;overflow:hidden;background:#F6F5F2;box-shadow:0 18px 50px rgba(32,22,15,.16);flex-shrink:0}
.pv-frame__inner{position:absolute;inset:0;height:812px;overflow:hidden;--sab:34px;font-size:13px}
.pv-frame__inner img{display:block;background:#F0EAE3}
.pv-frame__inner input{border:none;background:transparent;outline:none;font-family:inherit;color:inherit;padding:0}
.pv-frame__inner button{border:none;background:none;font-family:inherit;color:inherit;padding:0;text-align:inherit;font-size:inherit}
.pv-frame__indicator{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:120px;height:4px;border-radius:2px;background:#20160F;opacity:.85;z-index:50;pointer-events:none}
.pv-chrome{position:absolute;top:0;left:0;right:0;z-index:45;pointer-events:none;display:flex;flex-direction:column}
.pv-chrome__status{height:40px;display:flex;align-items:center;justify-content:space-between;padding:16px 22px 0 28px;font-size:14px;font-weight:700;letter-spacing:.3px}
.pv-chrome__right{display:flex;align-items:center;gap:6px}
.pv-chrome__signal{display:flex;align-items:flex-end;gap:2px}
.pv-chrome__signal i{width:3px;border-radius:1px;display:block}
.pv-chrome__battery{width:23px;height:12px;border:1px solid;border-radius:3.5px;padding:1.5px}
.pv-chrome__battery i{display:block;width:72%;height:100%;border-radius:1.5px}
.pv-chrome__capsule{margin:8px 12px 0 auto;width:88px;height:32px;border-radius:16px;border:1px solid;display:flex;align-items:center}
.pv-chrome__dots{flex:1;display:flex;justify-content:center;gap:3px}
.pv-chrome__dots i{width:4px;height:4px;border-radius:50%;display:block}
.pv-chrome__sep{width:1px;height:18px}
.pv-chrome__target{flex:0 0 auto;margin:0 14px 0 0;width:14px;height:14px;border:1.5px solid;border-radius:50%;display:flex;align-items:center;justify-content:center}
.pv-chrome__target i{width:5px;height:5px;border-radius:50%;display:block}
.pv-foot{padding:24px 56px 64px;font-size:12px;color:#B0A69D}
`;

async function main() {
  const out = process.argv[2] || path.join(ROOT, 'preview.html');
  compileTs();

  const keyframes = new Map();
  const results = [];
  for (const scene of SCENES) {
    // 顺序执行：每屏都要独立的 store / storage 状态
    // eslint-disable-next-line no-await-in-loop
    results.push(await renderScene(scene, keyframes));
    process.stdout.write(`  ✓ ${scene.id} ${scene.name}\n`);
  }

  const kf = [...keyframes.entries()].map(([k, v]) => `${k}{${v}}`).join('\n');
  const css = results.map((r) => r.css).join('\n');

  const step1 = results.filter((r) => r.scene.step === 1);
  const step2 = results.filter((r) => r.scene.step === 2);
  const step3 = results.filter((r) => r.scene.step === 3);
  const step4 = results.filter((r) => r.scene.step === 4);

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>美味坊小程序 · 第 1–4 步实现预览</title>
<style>${BASE_CSS}\n${kf}\n${css}</style>
</head>
<body>
<div class="pv-head">
  <span class="pv-kicker">WEIWEIFANG · MINIPROGRAM PREVIEW</span>
  <h1>美味坊点餐小程序 · 第 1–4 步实现效果</h1>
  <p>下面每一屏都由<strong>工程里真实的 WXML + WXSS + TypeScript 逻辑</strong>渲染：先编译 <code>miniprogram/**/*.ts</code>，用替身运行时跑一遍页面的 <code>onLoad / onShow</code>（含 mock 接口请求、购物车 store、服务端试算），再拿页面最终的 <code>data</code> 渲染真实模板。所以这里看到的价格、状态、倒计时都是代码算出来的，不是另画一遍的静态图。</p>
  <p>预览环境与真机的差异仅在于：<code>rpx</code> 按 375px 折算成 px、<code>position:fixed</code> 改为相对画框定位、<code>env(safe-area-inset-bottom)</code> 取 iPhone X 的 34px。顶部状态栏与胶囊按钮、底部小白条是画框装饰，真机由微信绘制。</p>
</div>

<div class="pv-section">
  <div class="pv-section__title">
    <span class="pv-tag">第 1 步</span>
    <h2>骨架：登录分流 + 顾客端 3 个 Tab + 商家端 4 个 Tab</h2>
    <span class="pv-sub">13 / 01 / 05 / 07 / 08 / 09 / 10 / 12</span>
  </div>
  <div class="pv-grid">${step1.map(frameDeco).join('')}</div>
</div>

<div class="pv-section">
  <div class="pv-section__title">
    <span class="pv-tag">第 2 步</span>
    <h2>顾客主链路：01 → 02 → 30 → 03 → 85 → 43 → 04 → 06</h2>
    <span class="pv-sub">下单闭环已打通</span>
  </div>
  <div class="pv-grid">${step2.map(frameDeco).join('')}</div>
</div>

<div class="pv-section">
  <div class="pv-section__title">
    <span class="pv-tag">第 3 步</span>
    <h2>商家履约链路：08 → 09 → 62 → 51</h2>
    <span class="pv-sub">接单出餐已打通</span>
  </div>
  <div class="pv-grid">${step3.map(frameDeco).join('')}</div>
</div>

<div class="pv-section">
  <div class="pv-section__title">
    <span class="pv-tag">第 4 步</span>
    <h2>配送与售后：53 / 84 / 20 / 56 / 40 / 48</h2>
    <span class="pv-sub">退款闭环（顾客申请 → 商家审核）已打通</span>
  </div>
  <div class="pv-grid">${step4.map(frameDeco).join('')}</div>
</div>

<div class="pv-foot">由 tools/preview/build.js 生成 · ${new Date().toISOString().slice(0, 10)}</div>
</body>
</html>`;

  fs.writeFileSync(out, html);
  process.stdout.write(`\n预览已生成：${out}\n`);
  // 页面里的倒计时 / 轮询定时器仍挂在事件循环上，渲染完直接收工
  process.exit(0);
}

main().catch((err) => {
  process.stderr.write(`${err.stack}\n`);
  process.exit(1);
});
