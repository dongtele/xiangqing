import { fen2yuan } from '../../utils/money';

/** 价格排版：¥ 小、数字大、后缀弱化（设计稿统一写法） */
Component({
  options: { virtualHost: true },

  properties: {
    /** 分 */
    fen: { type: Number, value: 0 },
    /** 主数字字号，rpx */
    size: { type: Number, value: 38 },
    color: { type: String, value: '#FF3800' },
    /** 是否展示「起」 */
    from: { type: Boolean, value: false },
    /** 后缀，如 /杯 */
    unit: { type: String, value: '' },
  },

  data: {
    text: '0',
    symSize: 22,
    suffixSize: 20,
  },

  observers: {
    'fen, size': function build() {
      const { fen, size } = this.properties;
      this.setData({
        text: fen2yuan(fen),
        symSize: Math.round(size * 0.58),
        suffixSize: Math.round(size * 0.53),
      });
    },
  },
});
