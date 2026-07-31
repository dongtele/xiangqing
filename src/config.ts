/**
 * 当前小程序是单店形态（美味坊中心店），店铺 id 走常量。
 * 若扩展为多店 / 平台形态，改为从进入参数（scene / query）解析并写入 cart store。
 */
export const CURRENT_SHOP_ID = 'shop_1';

/** 待支付超时（秒）——设计稿 85：15 分钟后订单自动取消 */
export const PAY_TIMEOUT_SECONDS = 15 * 60;
