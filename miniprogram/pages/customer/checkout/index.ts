import { createOrder, getShop, trialCheckout } from '../../../services/api';
import { cartStore } from '../../../store/cart';
import { fen2yuan } from '../../../utils/money';
import { back, push, toast } from '../../../utils/nav';
import type { CartItem, CheckoutTrial, DeliveryType, Shop } from '../../../models/index';

interface RowVM extends CartItem {
  amountText: string;
}

/** 03 · 确认订单：配送方式、地址、时间、优惠、金额明细 */
Page({
  data: {
    shop: null as Shop | null,
    deliveryType: 'delivery' as DeliveryType,
    rows: [] as RowVM[],
    trial: null as CheckoutTrial | null,
    address: {
      detail: '科技园南区A座15层1501室',
      receiver: '吃货小王',
      gender: '先生',
      phoneMask: '138****8000',
    },
    remark: '',
    packFeeText: '0',
    deliveryFeeText: '0',
    couponText: '0',
    itemsTotalText: '0',
    payableText: '0',
    discountText: '0',
    submitting: false,
  },

  async onLoad() {
    if (!cartStore.count) {
      toast('购物车是空的');
      back();
      return;
    }
    const shop = await getShop();
    this.setData(
      {
        shop,
        deliveryType: cartStore.get().deliveryType,
        remark: cartStore.get().remark,
        rows: cartStore.snapshot().map((i) => ({
          ...i,
          amountText: fen2yuan(i.unitPrice * i.qty),
        })),
      },
      () => this.refreshTrial()
    );
  },

  async refreshTrial() {
    const trial = await trialCheckout(cartStore.snapshot(), this.data.deliveryType);
    this.setData({
      trial,
      packFeeText: fen2yuan(trial.packFee),
      deliveryFeeText: fen2yuan(trial.deliveryFee),
      couponText: fen2yuan(trial.couponDiscount),
      itemsTotalText: fen2yuan(trial.itemsTotal),
      payableText: fen2yuan(trial.payable),
      discountText: fen2yuan(trial.discountTotal),
    });
  },

  onSwitchDelivery(e: WechatMiniprogram.TouchEvent) {
    const { type } = e.currentTarget.dataset as { type: DeliveryType };
    if (type === this.data.deliveryType) return;
    cartStore.setDeliveryType(type);
    this.setData({ deliveryType: type }, () => this.refreshTrial());
  },

  onTapAddress() {
    if (this.data.deliveryType === 'pickup') {
      toast('选择自提门店（83）在后续步骤实现');
      return;
    }
    toast('选择收货地址（15）在后续步骤实现');
  },

  onTapTime() {
    toast('期望送达时间选择在后续步骤实现');
  },

  onTapCoupon() {
    toast('我的优惠券（17）在后续步骤实现');
  },

  onTapRemark() {
    toast('订单备注（31）在后续步骤实现');
  },

  /** 提交订单 → 支付方式选择（85） */
  async onSubmit() {
    if (this.data.submitting || !this.data.trial) return;
    this.setData({ submitting: true });
    try {
      const { orderId } = await createOrder(
        cartStore.snapshot(),
        this.data.deliveryType,
        this.data.remark
      );
      push(`/pages/customer/pay-method/index?id=${orderId}`);
    } finally {
      this.setData({ submitting: false });
    }
  },
});
