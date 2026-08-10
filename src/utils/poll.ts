/**
 * 轮询封装。
 *
 * 小程序页面 hide 之后定时器不会自动停，后台空跑会白耗电与请求配额，
 * 所以这里返回停止函数，页面必须在 `onHide` / `onUnload` 里调用。
 * 53 配送追踪、05 我的订单、06 订单详情、09 商家订单都走这一份。
 */
export function startPoll(fn: () => void, intervalMs: number): () => void {
  let timer: ReturnType<typeof setInterval> | null = setInterval(fn, intervalMs);
  return () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/**
 * 只在「还有进行中的单」时才值得轮询——终态订单再拉也不会变。
 * 05 / 06 用它决定要不要起轮询。
 */
const ACTIVE_STATUSES = ['unpaid', 'pending', 'cooking', 'delivering', 'pickupReady', 'refunding'];

export function hasActiveOrder(statuses: string[]): boolean {
  return statuses.some((s) => ACTIVE_STATUSES.includes(s));
}
