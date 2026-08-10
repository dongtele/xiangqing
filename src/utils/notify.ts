/**
 * 订阅消息与新单播报。
 *
 * 两件事都只在微信小程序端有真实能力，用条件编译隔开；
 * H5 走空实现或降级提示，保证截图与浏览器调试链路不被打断。
 */

/** 订单状态变更的订阅消息模板 id，接入时替换为微信后台申请到的真实 id */
const ORDER_TEMPLATE_IDS = ['TPL_ORDER_STATUS_PLACEHOLDER'];

let subscribeAsked = false;

/**
 * 下单前申请订阅消息授权。
 * 用户拒绝**不阻断下单**——只是收不到推送，业务照常；
 * 同一次会话只问一次，避免每单都弹窗骚扰。
 */
export function requestOrderSubscribe(): Promise<void> {
  if (subscribeAsked) return Promise.resolve();
  subscribeAsked = true;

  // #ifdef MP-WEIXIN
  return new Promise((resolve) => {
    uni.requestSubscribeMessage({
      tmplIds: ORDER_TEMPLATE_IDS,
      complete: () => resolve(),
    });
  });
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.resolve();
  // #endif
}

let audio: UniApp.InnerAudioContext | null = null;

/**
 * 商家新单播报。
 * 设计稿 97 的语音播报音箱走的是同一条提醒链路；
 * **没有音频资源时降级为震动 + toast**，不能因为缺 mp3 就静默失败、让商家漏单。
 */
export function announceNewOrder(count: number): void {
  const text = count > 1 ? `您有 ${count} 个新订单，请及时处理` : '您有新订单，请及时处理';

  // #ifdef MP-WEIXIN
  uni.vibrateLong({});
  // #endif

  try {
    if (!audio) {
      audio = uni.createInnerAudioContext();
      // 音频资源待业务方提供；src 为空时 play() 会走 onError 分支
      audio.src = '';
    }
    audio.onError(() => {
      uni.showToast({ title: text, icon: 'none', duration: 2000 });
    });
    audio.play();
  } catch {
    uni.showToast({ title: text, icon: 'none', duration: 2000 });
  }
}
