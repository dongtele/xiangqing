import { fen2yuan } from '../../utils/money';
import type { CartItem } from '../../models/index';

/**
 * 购物车明细半屏浮层（设计稿 30）。
 * 遮罩淡入 200ms，内容 translateY(100%)→0，cubic-bezier(.32,.72,0,1) 280ms。
 */
Component({
  properties: {
    show: { type: Boolean, value: false },
    items: { type: Array, value: [] as CartItem[] },
    count: { type: Number, value: 0 },
    /** 商品合计，分 */
    total: { type: Number, value: 0 },
    /** 顶部满减进度文案 */
    promoText: { type: String, value: '' },
    promoNote: { type: String, value: '' },
    /** 底部实付预估文案 */
    footerNote: { type: String, value: '' },
  },

  data: {
    totalText: '0',
    rows: [] as (CartItem & { lineText: string })[],
  },

  observers: {
    total: function onTotal(total: number) {
      this.setData({ totalText: fen2yuan(total) });
    },
    items: function onItems(items: CartItem[]) {
      this.setData({
        rows: items.map((i) => ({ ...i, lineText: fen2yuan(i.unitPrice) })),
      });
    },
  },

  methods: {
    onClose() {
      this.triggerEvent('close');
    },
    onClear() {
      this.triggerEvent('clear');
    },
    onPlus(e: WechatMiniprogram.CustomEvent) {
      this.triggerEvent('plus', { key: (e.currentTarget.dataset as { key: string }).key });
    },
    onMinus(e: WechatMiniprogram.CustomEvent) {
      this.triggerEvent('minus', { key: (e.currentTarget.dataset as { key: string }).key });
    },
    onCheckout() {
      this.triggerEvent('checkout');
    },
    noop() {
      /* 吞掉浮层内的滑动，避免穿透 */
    },
  },
});
