import { getOrder } from '../../../services/api';
import { chrome } from '../../../utils/chrome';
import { fen2yuan } from '../../../utils/money';
import { push, relaunch, toast } from '../../../utils/nav';
import type { Order } from '../../../models/index';

/** 04 · 支付成功：结果页 + 后续引导 */
Page({
  data: {
    topPad: 170,
    order: null as Order | null,
    payableText: '0',
  },

  async onLoad(options: Record<string, string | undefined>) {
    this.setData({ topPad: chrome().capsuleBottom + 90 });
    const order = await getOrder(options.id || '');
    if (!order) return;
    this.setData({ order, payableText: fen2yuan(order.payable) });
  },

  onCopyNo() {
    const order = this.data.order;
    if (!order) return;
    wx.setClipboardData({ data: order.orderNo });
  },

  onHome() {
    relaunch('/pages/customer/menu/index');
  },

  onDetail() {
    const order = this.data.order;
    if (!order) return;
    push(`/pages/customer/order-detail/index?id=${order.id}`);
  },

  onNavigate() {
    toast('门店导航在后续步骤接入腾讯位置服务');
  },
});
