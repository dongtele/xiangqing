import { getOrder, payOrder } from '../../../services/api';
import { PAY_TIMEOUT_SECONDS } from '../../../config';
import { cartStore } from '../../../store/cart';
import { fen2yuan2 } from '../../../utils/money';
import { countdown, mmss } from '../../../utils/time';
import { relaunch, toast } from '../../../utils/nav';
import type { Order } from '../../../models/index';

/** 43 · 收银台 / 支付失败：唤起支付、失败兜底与重试 */
Page({
  data: {
    order: null as Order | null,
    payableText: '0.00',
    leftText: '15:00',
    paying: false,
    failed: false,
    method: 'wechat',
  },

  stop: null as null | (() => void),

  async onLoad(options: Record<string, string | undefined>) {
    const order = await getOrder(options.id || '');
    if (!order) {
      toast('订单不存在');
      return;
    }
    this.setData({
      order,
      method: options.method || 'wechat',
      payableText: fen2yuan2(order.payable),
    });
    this.stop = countdown(
      PAY_TIMEOUT_SECONDS,
      (left) => this.setData({ leftText: mmss(left) }),
      () => this.setData({ failed: true })
    );
    this.invokePay();
  },

  onUnload() {
    this.stop && this.stop();
  },

  /** 真机上此处调用 wx.requestPayment；mock 走服务端支付结果 */
  async invokePay() {
    const order = this.data.order;
    if (!order || this.data.paying) return;
    this.setData({ paying: true, failed: false });
    const res = await payOrder(order.id, this.data.method);
    this.setData({ paying: false });
    if (res.success) {
      cartStore.clear();
      relaunch(`/pages/customer/pay-result/index?id=${order.id}`);
      return;
    }
    this.setData({ failed: true });
  },

  onRetry() {
    this.invokePay();
  },

  onAbandon() {
    this.setData({ failed: false });
    toast('订单已保留在「进行中」，可稍后支付');
    relaunch('/pages/customer/orders/index?tab=ongoing');
  },
});
