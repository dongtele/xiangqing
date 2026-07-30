# 美味坊点餐小程序（顾客端 + 商家端）

按 `design_handoff_weiweifang_miniprogram` 交付包的「实现建议顺序」，用**微信原生小程序 + TypeScript**（WXML / WXSS / TS）重新实现设计稿。HTML 设计稿只作为视觉与交互参考，DOM 结构没有照搬。

当前进度：**第 1 步（骨架）+ 第 2 步（顾客主链路）+ 第 3 步（商家履约链路）已完成**，
共 17 个页面 / 8 个组件。

| 步骤 | 内容 | 屏号 | 状态 |
|---|---|---|---|
| 1 | 登录分流 + 顾客端 TabBar + 商家端 TabBar | 13 / 01 05 07 / 08 09 10 12 | ✅ |
| 2 | 顾客下单闭环 | 01 → 02 → 30 → 03 → 85 → 43 → 04 → 06 | ✅ |
| 3 | 商家履约链路（接单出餐） | 08 → 09 → 62 → 51 | ✅ |
| 4 | 配送与售后 | 53 / 84 / 20 / 56 / 40 / 48 | 待做 |
| 5 | 商品与菜单 | 10 / 11 / 36 / 64 / 22 / 49 / 93 | 待做 |
| 6 | 营销、数据、结算、设置、入驻 | — | 待做 |

## 快速开始

```bash
npm install                 # 只装 TS 与类型定义，运行时零依赖
npm run type-check          # tsc --noEmit 全量类型检查
npm run preview             # 生成 preview.html（浏览器直接打开看效果）
```

微信开发者工具：导入本目录即可（`miniprogramRoot: miniprogram/`）。TS 由工具内置的
`useCompilerPlugins: ["typescript"]` 编译，无需额外构建步骤；生成的 `.js` 已在 `.gitignore` 中忽略。
`appid` 目前是 `touristappid`（测试号），换成真实 AppID 即可预览真机。

## 目录结构

```
miniprogram/
├── app.ts / app.json / app.wxss     # 入口、路由表、全局样式
├── styles/tokens.wxss               # Design Tokens（颜色/阴影/圆角），全部来自交付文档
├── config.ts                        # 店铺 id、支付超时等常量
├── models/index.ts                  # 领域模型（金额统一「分」）
├── store/                           # base（极简 observable）+ user + cart（本地持久化）
├── services/
│   ├── request.ts                   # 统一请求层：登录态注入、401 重授权、loading/错误收口
│   ├── api.ts                       # 按域分组的接口函数（唯一对外出口）
│   └── mock/                        # 本地假后端：db / 路由表 / 开关
├── components/                      # icon · nav-bar · tab-bar · price · qty-stepper
│                                    # toggle · cart-bar · cart-sheet
├── pages/
│   ├── login/                       # 13 授权登录与角色分流
│   ├── customer/                    # menu(01) orders(05) profile(07) goods(02)
│   │                                # checkout(03) pay-method(85) pay(43)
│   │                                # pay-result(04) order-detail(06)
│   └── merchant/                    # dashboard(08) orders(09) order-detail(62)
│                                    # print(51) goods(10) shop(12)
└── ...
tools/preview/                       # 静态预览生成器（不参与小程序构建）
```

## 关键实现决策

**双角色 TabBar 不用原生 tabBar。**
顾客端 3 项 + 商家端 4 项 = 7 个 tab 页，超过 `app.json` `tabBar.list` 的 5 项上限，
自定义 tabBar 也绕不过这个限制。因此每个 tab 页自行挂载 `components/tab-bar`，
切换用 `wx.reLaunch` 清栈。角色存在 `userStore` 里并持久化，`app.gotoRoleHome()` 负责分流：
`我的(07) →「商家管理」` 进商家端，`店铺中心(12) →「切换到顾客视角」` 回顾客端。

**全局自定义导航栏。** 设计稿的头部大量使用渐变沉浸式布局与圆形返回钮，所以
`app.json` 里 `navigationStyle: "custom"`；`utils/chrome.ts` 从 `wx.getWindowInfo()` 与
胶囊按钮位置算出 `statusBarHeight / capsuleBottom`，页面用它做顶部占位，
在任何机型上都对齐胶囊按钮，而不是写死设计稿的 96px。

`nav-bar` 的纵向位置按设计稿分两种：常规（占位）标题栏落在**胶囊按钮下方**，
整行宽度可用，右侧文字按钮（如 62 的「打印」、51 的「测试打印」）不会被胶囊压住；
`fixed`（浮在大图 / 渐变头部上，只有返回钮，如 02 / 06）时与胶囊按钮同一水平线。

**图标用内联 SVG，不引位图。** `components/icon` 把设计稿的线性 SVG 路径按 `color`
烘焙成 `background-image: url("data:image/svg+xml,...")`，任意尺寸清晰，也不用维护图片资源。
新增图标写进 `components/icon/icons.ts` 即可，保持 `stroke-width 1.9–2.4` 的线性风格。

**金额一律用「分」，优惠一律服务端试算。** `models` 里所有金额字段都是分，
展示走 `utils/money`；`确认订单(03)`、`购物车条(01)`、`购物车明细(30)` 的满减文案与实付金额
全部来自 `POST /checkout/trial` 的返回，前端不自己算优惠（交付文档 State Management 的要求）。

**样式尺寸用 rpx。** 设计稿 375px 画框，换算关系是 1 设计 px = 2rpx，
所有 12.5px / 13.5px 这类半像素字号折算后都是整数 rpx。

**mock 后端可一键切换。** `services/mock/config.ts` 里 `USE_MOCK = true` 时，
`request()` 走本地路由表；接真实后端只需把它置 false 并填 `BASE_URL`，`api.ts` 与页面代码不用改。
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
4. **超时倒计时的文案在设计稿里不一致，两处按各自的稿实现。** 订单管理（09）写的是
   「剩 3:42 未接自动提醒」，商家订单详情（62）写的是「剩 2:38 自动拒单」——
   同一个倒计时，一处是提醒、一处是自动拒单。目前两屏各自照稿实现，
   **超时到底是提醒还是自动拒单需要确认**，确认后统一为一处文案即可（只改 mock 的 `detailCountdownText` 拼装）。
5. **小票打印（51）合并了设计稿与交付文档的两种描述。** 设计稿画的是「打印设置 + 后厨联预览」，
   交付文档写的是「顾客单 / 厨房单预览与补打」。实现保留设计稿的版式，
   预览区加了「后厨联 / 顾客联」切换，底部加了「补打小票（N 联）」——顾客联带金额与页脚，
   后厨联不带价格（后厨不需要），并受「打印菜品备注」开关控制。
6. **未做的页面给出明确提示。** 设计稿里指向后续步骤的入口（店内搜索 18、地址 15/16、
   优惠券 17、配送追踪 53、核销取餐码 21、打印机与设备 97 等）会 toast 说明所属屏号，
   不做无声失效。

## 预览

`npm run preview` 会：编译 `miniprogram/**/*.ts` → 用替身运行时（`tools/preview/runtime.js`）
真实执行每个页面的 `onLoad / onShow`（含 mock 请求、store、服务端试算）→ 拿页面最终的 `data`
渲染真实 WXML + WXSS → 输出 `preview.html`。

也就是说预览里的价格、状态、倒计时都是代码算出来的。与真机的差异只有三处等价替换：
`rpx` 按 375px 折成 px、`position:fixed` 改为相对画框定位、`env(safe-area-inset-bottom)` 取 34px；
图片按交付文档用 `#F0EAE3` 灰块占位（等业务方提供真实图源）。

## 待补齐的工程项

- 真实接口联调（`USE_MOCK=false` + `BASE_URL`）与 `wx.requestPayment` 接入
- 商品图 / 店铺头图接 CDN（1:1 与 16:9，WebP + 懒加载）
- 地图相关页面（52 / 53 / 70 / 83）接腾讯位置服务
- 进行中订单轮询与订阅消息、商家新单语音播报
- 单元测试与 ESLint 配置
