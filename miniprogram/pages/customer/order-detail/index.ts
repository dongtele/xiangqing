import { getOrder } from '../../../services/api';
import { chrome } from '../../../utils/chrome';
import { fen2yuan } from '../../../utils/money';
import { toast } from '../../../utils/nav';
import type { Order, OrderGoods } from '../../../models/index';

interface GoodsVM extends OrderGoods {
  amountText: string;
}

/** 06 · 订单详情：状态时间轴、骑手、商品、金额、操作 */
Page({
  data: {
    headPad: 100,
    order: null as Order | null,
    goods: [] as GoodsVM[],
    feeText: '0',
    couponText: '0',
    payableText: '0',
    loading: true,
  },

  orderId: '',

  onLoad(options: Record<string, string | undefined>) {
    this.orderId = options.id || '';
    this.setData({ headPad: chrome().capsuleBottom + 20 });
  },

  onShow() {
    this.load();
  },

  async load() {
    const order = await getOrder(this.orderId);
    if (!order) {
      toast('订单不存在');
      return;
    }
    this.setData({
      order,
      loading: false,
      goods: order.items.map((i) => ({ ...i, amountText: fen2yuan(i.amount) })),
      feeText: fen2yuan(order.packFee + order.deliveryFee),
      couponText: fen2yuan(order.couponDiscount),
      payableText: fen2yuan(order.payable),
    });
  },

  onCopyNo() {
    const order = this.data.order;
    if (!order) return;
    wx.setClipboardData({ data: order.orderNo });
  },

  onCallRider() {
    const order = this.data.order;
    if (!order || !order.rider) return;
    // 真实场景走虚拟号，避免暴露真实号码（84 联系骑手）
    wx.makePhoneCall({ phoneNumber: order.rider.phone, fail: () => toast('拨号已取消') });
  },

  onTrack() {
    toast('配送实时追踪（53）在后续步骤实现');
  },

  onContactShop() {
    toast('在线客服（41）在后续步骤实现');
  },

  onAftersale() {
    toast('申请售后（20）在后续步骤实现');
  },
});
