# 美味坊点餐小程序（顾客端 + 商家端）

按 `design_handoff_weiweifang_miniprogram` 交付包的「实现建议顺序」，用 **uni-app（Vue 3 + Vite + TypeScript + Pinia）**
重新实现设计稿。HTML 设计稿只作为视觉与交互参考，DOM 结构没有照搬——交付文档里那套 375×812 固定画框、
`dc-import` 手机状态栏、内联样式都是展示脚手架，不是产品结构。

当前进度：**第 1–2 步已完成**，15 个页面 + 1 个半屏浮层 / 9 个组件。

| 步骤 | 内容 | 屏号 | 状态 |
|---|---|---|---|
| 1 | 登录分流 + 顾客端 TabBar + 商家端 TabBar | 13 / 01 05 07 / 08 09 10 12 | ✅ |
| 2 | 顾客下单闭环 | 01 → 02 → 30 → 03 → 85 → 43 → 04 → 06 | ✅ |
| 3 | 商家履约链路（接单出餐） | 08 → 09 → 62 → 51 | 待做 |
| 4 | 配送与售后（退款闭环） | 53 / 84 / 20 / 56 / 40 / 48 | 待做 |
| 5 | 商品与菜单 | 10 / 11 / 36 / 64 / 22 / 49 / 93 | 待做 |
| 6 | 营销、数据、结算、设置、入驻 | — | 待做 |

## 快速开始

```bash
npm install
npm run type-check          # vue-tsc --noEmit 全量类型检查
npm run dev:mp-weixin       # 产出 dist/dev/mp-weixin，用微信开发者工具导入
npm run build:mp-weixin     # 产出 dist/build/mp-weixin（上传用）
npm run dev:h5 / build:h5   # H5，浏览器里就能走完整链路
```

微信开发者工具：导入 `dist/dev/mp-weixin`（或 `dist/build/mp-weixin`）。`manifest.json` 里的 appid
目前是 `touristappid`（测试号），换成真实 AppID 即可真机预览。

### 逐屏截图

```bash
npm i -D playwright         # 仅截图用，没写进 devDependencies，避免每次装依赖都拉浏览器
npm run build:h5 && npm run shots
```

`scripts/shots.mjs` 会起一个本地静态服务托管 H5 产物，用无头 Chromium 按 375×812 真实点完
「登录 → 加购 → 选规格 → 购物车 → 确认订单 → 支付方式 → 收银台失败 → 重试 → 支付成功 → 订单详情」
和两端 TabBar，逐屏输出到 `shots/`。截图里的价格、状态、倒计时都是代码算出来的，不是静态图。

## 版本锁定

uni-app 的 Vue3 分支对 vite / vue 版本敏感，以下版本是按 peerDependencies 对齐后锁死的，升级前先确认：

| 包 | 版本 | 原因 |
|---|---|---|
| `@dcloudio/*` | `3.0.0-5010520260709002` | vue3 线最新稳定版，各包必须同版本 |
| `vite` | `5.2.8` | `@dcloudio/vite-plugin-uni` 的 peer 是精确版本 |
| `vue` | `3.4.21` | 与 uni-app 内置的 `@vue/shared` 对齐 |
| `pinia` | `2.1.7` | peer `vue ^3.3.0`；2.2+ 起 peer 抬到 `^3.5.11`，与 vue 3.4 冲突 |

## 目录结构

```
src/
├── main.ts / App.vue / pages.json / manifest.json   # 入口、路由表、平台配置
├── styles/tokens.scss                # Design Tokens（颜色/阴影/圆角），全部来自交付文档
├── styles/common.scss                # 卡片 / 主按钮 / 列表行 / 标签 / 骨架屏等复用类
├── config.ts                         # 店铺 id、支付超时等常量
├── models/index.ts                   # 领域模型（金额统一「分」）
├── stores/                           # Pinia：user（角色持久化）+ cart（本地持久化）
├── services/
│   ├── request.ts                    # 统一请求层：登录态注入、401 重授权、loading/错误收口
│   ├── api.ts                        # 按域分组的接口函数（页面访问数据的唯一出口）
│   └── mock/                         # 本地假后端：db / 路由表 / 开关
├── components/                       # wf-icon · wf-nav-bar · wf-tab-bar · wf-price · wf-qty-stepper
│                                     # wf-toggle · wf-thumb · wf-cart-bar · wf-cart-sheet · wf-timeline
└── pages/
    ├── login/                        # 13 授权登录与角色分流
    ├── customer/                     # menu(01) orders(05) profile(07) goods(02)
    │                                 # checkout(03) pay-method(85) pay(43)
    │                                 # pay-result(04) order-detail(06)
    └── merchant/                     # dashboard(08) orders(09) goods(10) shop(12)
scripts/shots.mjs                     # H5 逐屏截图（不参与小程序构建）
```

组件走 uni-app 的 easycom 自动注册（`src/components/wf-x/wf-x.vue`），模板里直接写 `<wf-x />`，不用 import。

## 关键实现决策

**双角色 TabBar 不用原生 tabBar。**
顾客端 3 项 + 商家端 4 项 = 7 个 tab 页，超过 `pages.json` `tabBar.list` 的 5 项上限，自定义 tabBar 也绕不过。
因此每个 tab 页自行挂载 `wf-tab-bar`，切换用 `uni.reLaunch` 清栈。角色存在 Pinia 的 `user` store 里并持久化，
`utils/nav.ts` 的 `gotoRoleHome()` 负责分流：`我的(07) →「商家管理」` 进商家端，
`店铺中心(12) →「切换到顾客视角」` 回顾客端。

**全局自定义导航栏。** 设计稿的头部大量使用渐变沉浸式布局与圆形返回钮，所以 `pages.json` 里
`globalStyle.navigationStyle: "custom"`；`utils/chrome.ts` 用 `uni.getWindowInfo()` 拿状态栏高度，
再在 `#ifdef MP-WEIXIN` 分支里用 `uni.getMenuButtonBoundingClientRect()` 算出 `capsuleBottom`，
页面用它做顶部占位，在任何机型上都对齐胶囊按钮，而不是写死设计稿的 96px（H5 用固定回退值）。

`wf-nav-bar` 的纵向位置按设计稿分两种：常规（占位）标题栏落在**胶囊按钮下方**，整行宽度可用，
右侧文字按钮不会被胶囊压住；`fixed`（浮在大图 / 渐变头部上，只有返回钮，如 02 / 06）时与胶囊按钮同一水平线。

**图标用内联 SVG，不引位图。** `wf-icon` 把设计稿的线性 SVG 路径按 `color` 烘焙成
`background-image: url("data:image/svg+xml,...")`，任意尺寸清晰，也不用维护图片资源。
新增图标写进 `components/wf-icon/icons.ts` 即可，保持 `stroke-width 1.9–2.4` 的线性风格。

**图片位一律灰块占位。** 交付文档 Assets 写明设计稿没有任何位图素材，商品图 / 店铺头图都是 `#F0EAE3` 占位，
真实图源待业务方提供。所以 `services/mock/images.ts` 里全是空串，`wf-thumb` 遇到空串渲染灰块、
有值才渲染 `<image>`——拿到 CDN 地址（商品图 1:1、店铺头图 16:9，WebP + 懒加载）后只改这一个文件。

**金额一律用「分」，优惠一律服务端试算。** `models` 里所有金额字段都是分，展示走 `utils/money`；
`确认订单(03)`、`购物车条(01)`、`购物车明细(30)` 的满减文案与实付金额全部来自 `POST /checkout/trial`
的返回，前端不自己算优惠（交付文档 State Management 的要求）。菜单页用一个
`watch(() => [cart.count, cart.itemsTotal])` 收口所有触发路径——本页加减、02 详情页加购返回、
浮层里改数量都会重新试算。

**样式尺寸用 rpx。** 设计稿 375px 画框，换算关系是 1 设计 px = 2rpx，
所有 12.5px / 13.5px 这类半像素字号折算后都是整数 rpx。

**H5 与小程序双端可跑。** 页面不使用只有微信端才有的能力：`13` 的
`<button open-type="getPhoneNumber">` 用 `#ifdef MP-WEIXIN` 包裹，非微信端走同一个 `login()`，
所以 H5 里能完整走通下单链路（也是截图验收的基础）。

**mock 后端可一键切换。** `services/mock/config.ts` 里 `USE_MOCK = true` 时，`request()` 走本地路由表；
接真实后端只需把它置 false 并填 `BASE_URL`，`api.ts` 与页面代码不用改。
`PAY_FAIL_FIRST_ATTEMPT = true` 是演示开关：首次支付故意失败一次，用来走通
`收银台失败态(43) → 重新支付 → 支付成功(04)`；接真实支付时删掉。

## 与设计稿的偏差（有意为之）

1. **顾客端 TabBar 是 3 项，不是 4 项。** 交付文档「通用布局规范」写的是 4 项（点餐/订单/消息/我的），
   但 `MiniTabBar.dc.html` 的实现和 98 屏原型里所有顾客端页面都是 3 项，且 `消息通知(37)` 的入口说明
   写的是「红点从『我的』入口进入」。这里按设计稿实现为 3 项。
2. **示例金额随真实数据流变化。** 设计稿 85/43 画的是 ￥68.00 的样例订单，实际链路里
   金额由购物车与试算接口决定（红烧肉大份 ¥45 + 酸梅汤 ¥12×2 − 满减 ¥10 + 打包 ¥2 + 配送 ¥3 = **¥64**，
   与设计稿 03 / 06 的数值一致）。
3. **商品详情的「起」按规格判定。** 只有存在加价选项的商品才显示「起」，
   所以 `农家小炒肉拌饭`（单规格）不再显示「起」，与「多规格才显示选规格」的设计意图保持一致。
4. **暂未落 `checkout` / `orders` store。** 交付文档 State Management 建议按域拆 store，但第 1–2 步里
   结算试算结果每次都由服务端返回、订单详情每次进页面都按 id 拉取，落 store 只会引入一份会过期的副本；
   订单轮询与配送追踪属第 3–4 步，到时再补 `orders` / `delivery` store。
5. **未做的页面给出明确提示。** 设计稿里指向后续步骤的入口（店内搜索 18、店铺主页 32、地址 15/16、
   优惠券 17、备注 31、商家订单详情 62、小票打印 51、退款审核 48 等）会 toast 说明所属屏号，
   不做无声失效。

## 待补齐的工程项

- 真实接口联调（`USE_MOCK=false` + `BASE_URL`）与 `uni.requestPayment` 接入
- 商品图 / 店铺头图接 CDN（1:1 与 16:9，WebP + 懒加载）
- 地图相关页面（52 / 53 / 70 / 83）接腾讯位置服务
- 进行中订单轮询与订阅消息、商家新单语音播报
- 单元测试与 ESLint 配置
