/**
 * 当前小程序是单店形态（美味坊中心店），店铺 id 走常量。
 * 若扩展为多店 / 平台形态，改为从进入参数（scene / query）解析并写入 cart store。
 */
export const CURRENT_SHOP_ID = 'shop_1';

/** 待支付超时（秒）——设计稿 85：15 分钟后订单自动取消 */
export const PAY_TIMEOUT_SECONDS = 15 * 60;

/**
 * 腾讯位置服务 key。
 * 填上之后 53 / 52 / 70 / 83 会渲染真实地图（`<map>` 组件 + 逆地址解析）；
 * 留空时这些页面自动降级为设计稿那套 CSS 示意底图，功能与数据结构不变。
 */
export const MAP_KEY = '';

/** 是否具备真实地图能力 */
export const HAS_MAP = !!MAP_KEY;
