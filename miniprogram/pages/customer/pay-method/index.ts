import { getOrder } from '../../../services/api';
import { PAY_TIMEOUT_SECONDS } from '../../../config';
import { fen2yuan2 } from '../../../utils/money';
import { countdown, mmss } from '../../../utils/time';
import { push, toast } from '../../../utils/nav';
import type { Order, PayMethod, PayMethodId } from '../../../models/index';

const METHODS: PayMethod[] = [
  {
    id: 'wechat',
    name: '微信支付',
    desc: '立减 ¥1.00 · 推荐',
    icon: 'pay-wechat',
    iconColor: '#07C160',
    iconBg: '#E8F8EF',
    disabled: false,
  },
  {
    id: 'balance',
    name: '储值余额',
    desc: '可用 ¥36.50 · 余额不足需补差',
    icon: 'pay-balance',
    iconColor: '#FF4A17',
    iconBg: '#FFF1E9',
    disabled: false,
  },
  {
    id: 'friend',
    name: '找人代付',
    desc: '分享给微信好友，30 分钟内有效',
    icon: 'pay-friend',
    iconColor: '#7A7168',
    iconBg: '#F1ECE5',
    disabled: false,
  },
];

/** 85 · 支付方式选择：多支付方式 + 15 分钟倒计时 */
Page({
  data: {
    order: null as Order | null,
    methods: METHODS,
    selected: 'wechat' as PayMethodId,
    payableText: '0.00',
    itemsTotalText: '0.00',
    couponText: '0.00',
    feeText: '0.00',
    leftText: '15:00',
    expired: false,
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
      payableText: fen2yuan2(order.payable),
      itemsTotalText: fen2yuan2(order.itemsTotal),
      couponText: fen2yuan2(order.couponDiscount),
      feeText: fen2yuan2(order.packFee + order.deliveryFee),
    });
    // 倒计时以服务端时间为准，此处用创建后剩余时长演示
    this.stop = countdown(
      PAY_TIMEOUT_SECONDS,
      (left) => this.setData({ leftText: mmss(left) }),
      () => this.setData({ expired: true })
    );
  },

  onUnload() {
    this.stop && this.stop();
  },

  onSelect(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id: PayMethodId };
    this.setData({ selected: id });
  },

  onConfirm() {
    if (this.data.expired) {
      toast('订单已超时取消');
      return;
    }
    const order = this.data.order;
    if (!order) return;
    if (this.data.selected === 'friend') {
      toast('找人代付：分享卡片能力在后续步骤实现');
      return;
    }
    push(`/pages/customer/pay/index?id=${order.id}&method=${this.data.selected}`);
  },
});
