/** Mock 层开关。接真实后端时把 USE_MOCK 置 false 即可，api.ts 与页面代码都不用改。 */
export const USE_MOCK = true;

/** 模拟网络延迟（ms），用于验证 loading / 骨架屏 */
export const MOCK_LATENCY = 180;

/**
 * 演示用：首次支付故意失败一次，用来走通「收银台失败态 → 重新支付」链路（设计稿 43）。
 * 接真实支付（wx.requestPayment）时删除。
 */
export const PAY_FAIL_FIRST_ATTEMPT = true;
