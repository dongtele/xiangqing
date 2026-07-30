/** 数量步进器。qty 为 0 时只露「＋」（菜单页），>0 时展开「－ n ＋」。 */
Component({
  options: { virtualHost: true },

  properties: {
    qty: { type: Number, value: 0 },
    /** ＋ 按钮直径，rpx */
    plusSize: { type: Number, value: 52 },
    /** － 按钮直径，rpx */
    minusSize: { type: Number, value: 48 },
    /** gradient：主渐变实心；soft：主色浅底 */
    tone: { type: String, value: 'gradient' },
    /** 数字字号，rpx */
    fontSize: { type: Number, value: 27 },
    /** 始终展示「－」（详情页 / 购物车明细） */
    alwaysMinus: { type: Boolean, value: false },
  },

  methods: {
    onPlus() {
      this.triggerEvent('plus');
    },
    onMinus() {
      this.triggerEvent('minus');
    },
  },
});
