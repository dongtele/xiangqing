/**
 * H5 产物逐屏截图（视觉自查用，不参与小程序构建）。
 *
 * 用法：
 *   npm run build:h5 && npm run shots
 *
 * 依赖 playwright（项目不把它写进 devDependencies，避免每次 npm i 都下载浏览器）：
 *   npm i -D playwright        # 或全局 npm i -g playwright
 * 已有 Chromium 时可用 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 跳过下载。
 *
 * 产物：shots/<屏号>-<页面>.png，画框 375×812（设计稿画框），2 倍图。
 */
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dist = path.join(root, 'dist/build/h5');
const outDir = path.join(root, 'shots');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim();
    return require(path.join(globalRoot, 'playwright'));
  }
}

/**
 * 不需要交互前置的屏：`[截图名, 路由]`，逐条 goto + 截图。
 * 需要真实点击才能到达的（下单闭环、角色分流）写在 main() 的流程段里。
 */
const ROUTES = [
  // 顾客端 TabBar
  ['05-我的订单', '/pages/customer/orders/index'],
  ['07-我的', '/pages/customer/profile/index'],
  // 商家端 TabBar
  ['09-订单管理', '/pages/merchant/orders/index'],
  ['10-商品管理', '/pages/merchant/goods/index'],
  ['12-店铺中心', '/pages/merchant/shop/index'],
  // 商家履约
  ['62-商家订单详情', '/pages/merchant/order-detail/index?id=m_1024'],
  ['51-小票打印', '/pages/merchant/print/index?orderId=m_1024'],
  // 配送与售后
  ['53-配送实时追踪', '/pages/customer/delivery-track/index?id=ord_1024'],
  ['84-联系骑手', '/pages/customer/rider-chat/index?id=ord_1024'],
  ['20-申请售后', '/pages/customer/aftersale/index?id=ord_1024'],
  ['56-选择退款商品', '/pages/customer/refund-items/index?id=ord_1024'],
  ['40-退款进度', '/pages/customer/refund-detail/index?id=rf_2001'],
  ['48-退款审核', '/pages/merchant/refund-review/index?id=rf_2001'],
  // 商品与菜单
  ['11-编辑商品', '/pages/merchant/goods-edit/index?id=g1'],
  ['36-规格与价格', '/pages/merchant/spec-edit/index?id=g1'],
  ['64-选项库', '/pages/merchant/option-lib/index'],
  ['63-图片裁剪', '/pages/merchant/image-crop/index?id=g1'],
  ['22-分类管理', '/pages/merchant/categories/index'],
  ['93-批量管理', '/pages/merchant/goods-bulk/index'],
  ['49-沽清管理', '/pages/merchant/stock/index'],
  // 顾客端二级页
  ['18-店内搜索', '/pages/customer/search/index'],
  ['32-店铺主页', '/pages/customer/shop/index'],
  ['54-菜品大图预览', '/pages/customer/photo-view/index?id=g1'],
  ['82-店铺全部评价', '/pages/customer/reviews/index'],
  ['61-资质公示', '/pages/customer/license/index'],
  ['38-地址管理', '/pages/customer/addresses/index'],
  ['16-编辑地址', '/pages/customer/address-edit/index?id=addr_1'],
  ['52-地图选点', '/pages/customer/map-picker/index'],
  ['83-选择自提门店', '/pages/customer/pickup-stores/index'],
  // 订单尾部：取餐 / 评价 / 发票
  ['25-取餐码', '/pages/customer/pickup-code/index?id=ord_1019'],
  ['19-评价订单', '/pages/customer/comment/index?id=ord_1019'],
  ['55-评价晒单', '/pages/customer/comment-publish/index?id=ord_1019'],
  ['60-我的评价', '/pages/customer/my-reviews/index'],
  ['57-申请发票', '/pages/customer/invoice/index?id=ord_1019'],
  ['58-发票抬头', '/pages/customer/invoice-titles/index'],
  // 客服与帮助
  ['41-在线客服', '/pages/customer/support/index'],
  ['77-帮助中心', '/pages/customer/help/index'],
  ['76-意见反馈', '/pages/customer/feedback/index'],
  // 资料与消息
  ['73-个人资料', '/pages/customer/profile-edit/index'],
  ['37-消息通知', '/pages/customer/messages/index'],
  ['86-通知详情', '/pages/customer/message-detail/index?id=msg_3'],
  // 卡券与会员（17 与 39 是同一页，合并实现）
  ['17_39-我的优惠券', '/pages/customer/coupons/index'],
  ['79-领券中心', '/pages/customer/coupon-center/index'],
  ['80-会员积分中心', '/pages/customer/points/index'],
  ['81-积分兑换', '/pages/customer/points-mall/index'],
  // 设置与账号
  ['44-设置与关于', '/pages/customer/settings/index'],
  ['74-账号与安全', '/pages/customer/account/index'],
  ['75-通知设置', '/pages/customer/notify-settings/index'],
  ['78-关于美味坊', '/pages/customer/about/index'],
  // 商家端 接单扩展（21 要先输码才出订单预览，放在下面的交互段）
  ['45-商家消息中心', '/pages/merchant/messages/index'],
  ['91-历史订单查询', '/pages/merchant/order-history/index'],
  ['92-异常与取消订单', '/pages/merchant/order-exception/index'],
  ['96-核销记录', '/pages/merchant/verify-log/index'],
  ['97-打印机与设备', '/pages/merchant/devices/index'],
  // 商家端 营销与评价
  ['23-优惠活动设置', '/pages/merchant/promotions/index'],
  ['65-新建满减活动', '/pages/merchant/promotion-edit/index'],
  ['66-选择适用商品', '/pages/merchant/promotion-goods/index'],
  ['94-营销中心', '/pages/merchant/marketing/index'],
  ['95-创建店铺优惠券', '/pages/merchant/coupon-edit/index'],
  ['47-评价管理', '/pages/merchant/reviews/index'],
  ['90-评价回复', '/pages/merchant/review-reply/index?id=mr_3'],
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function serve(dir) {
  const server = createServer(async (req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(dir, url === '/' ? 'index.html' : url);
    if (!existsSync(file) || file.endsWith('/')) file = path.join(dir, 'index.html');
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function main() {
  if (!existsSync(dist)) {
    console.error('找不到 H5 产物，请先执行：npm run build:h5');
    process.exit(1);
  }
  const { chromium } = loadPlaywright();
  const { server, port } = await serve(dist);
  const base = `http://127.0.0.1:${port}/`;

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  const wait = (ms) => page.waitForTimeout(ms);
  const shot = async (name) => {
    await wait(450);
    await page.screenshot({ path: path.join(outDir, `${name}.png`) });
    console.log('✓', name);
  };
  const go = async (route) => {
    await page.goto(`${base}#${route}`, { waitUntil: 'networkidle' });
    await wait(500);
  };
  /** 按 class 定位，避免正文里的同名文字抢到点击 */
  const tap = async (selector, options) => {
    await page.locator(selector, options).first().click();
    await wait(650);
  };

  /* ---------- 顾客下单闭环：13 → 01 → 02 → 30 → 03 → 85 → 43 → 04 → 06 ---------- */

  await go('/pages/login/index');
  await shot('13-登录分流');

  await tap('.login__btn--wechat');
  await shot('01-点餐菜单-空车');

  // 招牌红烧肉套餐：多规格 → 选规格页，选「大份」再加购
  await tap('.menu__spec-btn');
  await tap('.gd__option', { hasText: '大份' });
  await shot('02-商品详情');
  await tap('.gd__add');

  // 冰镇酸梅汤 ×2（单规格但有温度选项，同样走详情页）
  await tap('.menu__row-top', { hasText: '冰镇酸梅汤' });
  await tap('.stepper__plus');
  await tap('.gd__add');
  await shot('01-点餐菜单-购物车条');

  await tap('.cartbar__icon');
  await shot('30-购物车明细');

  await tap('.sheet__btn');
  await wait(600);
  await shot('03-确认订单');

  // 15 / 31 是盖在 03 上的半屏浮层，只能从这里打开
  await tap('.co__addr');
  await shot('15-选择收货地址');
  await tap('.as__close');

  await tap('.co__remark');
  await shot('31-订单备注');
  await tap('.rs__close');

  await tap('.co__pay');
  await shot('85-支付方式选择');

  await tap('.pm__body .btn--primary');
  await shot('43-收银台-支付失败');

  await tap('.pay__dialog .btn--primary');
  await shot('04-支付成功');

  await tap('.pr__btn--primary');
  await shot('06-订单详情');

  /* ---------- 角色分流：07 →「商家管理」→ 08 ---------- */

  await go('/pages/customer/profile/index');
  await tap('.profile__merchant');
  await shot('08-工作台');

  /* ---------- 其余屏：直接进路由即可，不需要交互前置 ---------- */

  for (const [name, route] of ROUTES) {
    await go(route);
    await shot(name);
  }

  /* ----------
   * 59 券使用规则：盖在 coupons 上的半屏浮层，只能点开。
   * 必须排在路由表之后 —— go() 是改 hash，目标与当前路由相同时组件不会重挂载，
   * 浮层会残留到下一张图里。
   * ---------- */

  await go('/pages/customer/coupons/index');
  await tap('.cp__rule');
  await shot('59-优惠券使用规则');

  /* ---------- 21 核销取餐码：输满 4 位才拉出订单预览 ---------- */

  // uni-app H5 把 <input class="x"> 渲染成 <uni-input class="x"><input>，要填里层那个
  await go('/pages/merchant/verify/index');
  await page.locator('.vf__input input').fill('8823');
  await wait(700);
  await shot('21-核销取餐码');

  await browser.close();
  server.close();
  console.log(`\n截图已输出到 ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
