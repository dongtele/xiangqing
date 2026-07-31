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

  await tap('.co__pay');
  await shot('85-支付方式选择');

  await tap('.pm__body .btn--primary');
  await shot('43-收银台-支付失败');

  await tap('.pay__dialog .btn--primary');
  await shot('04-支付成功');

  await tap('.pr__btn--primary');
  await shot('06-订单详情');

  /* ---------- 顾客端 TabBar：05 / 07 ---------- */

  await go('/pages/customer/orders/index');
  await shot('05-我的订单');

  await go('/pages/customer/profile/index');
  await shot('07-我的');

  /* ---------- 商家端 TabBar：08 / 09 / 10 / 12 ---------- */

  await tap('.profile__merchant');
  await shot('08-工作台');

  await go('/pages/merchant/orders/index');
  await shot('09-订单管理');

  await go('/pages/merchant/goods/index');
  await shot('10-商品管理');

  await go('/pages/merchant/shop/index');
  await shot('12-店铺中心');

  await browser.close();
  server.close();
  console.log(`\n截图已输出到 ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
