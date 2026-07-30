import { ICON_EXTRA, ICON_PATHS } from './icons';

/**
 * 线性图标。以 SVG data URI 作为 background-image，颜色随 color 属性烘焙进 SVG。
 * 不引位图，保证任意尺寸清晰。
 */
Component({
  options: { virtualHost: true },

  properties: {
    name: { type: String, value: '' },
    /** rpx */
    size: { type: Number, value: 40 },
    color: { type: String, value: '#20160F' },
    weight: { type: Number, value: 1.9 },
  },

  data: {
    bg: '',
  },

  observers: {
    'name, color, weight': function build() {
      this.setData({ bg: this.buildBg() });
    },
  },

  methods: {
    buildBg(): string {
      const { name, color, weight } = this.properties;
      const inner = (ICON_EXTRA[name] || ICON_PATHS[name] || '').replace(/CURRENT/g, color);
      if (!inner) return '';
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" ` +
        `stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    },
  },
});
