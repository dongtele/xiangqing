import { fen2yuan } from '../../utils/money';

/** 菜单页底部购物车条（设计稿 01）。空车时不展示。 */
Component({
  properties: {
    count: { type: Number, value: 0 },
    /** 商品合计，分 */
    total: { type: Number, value: 0 },
    /** 凑单 / 已享优惠提示 */
    promoText: { type: String, value: '' },
    /** 距底部距离，rpx（默认让位给 TabBar） */
    bottom: { type: Number, value: 128 },
  },

  data: {
    totalText: '0',
    bump: false,
  },

  observers: {
    total: function onTotal(total: number) {
      this.setData({ totalText: fen2yuan(total) });
    },
    count: function onCount() {
      // 角标数字切换：160ms 上移淡入
      this.setData({ bump: true });
      setTimeout(() => this.setData({ bump: false }), 160);
    },
  },

  methods: {
    onOpen() {
      this.triggerEvent('opencart');
    },
    onCheckout() {
      this.triggerEvent('checkout');
    },
  },
});
