import { chrome } from '../../utils/chrome';
import { back } from '../../utils/nav';

/**
 * 自定义标题栏：高 44px，标题 17px/800 居中，左侧返回圆钮 32×32。
 * theme=dark 用于渐变 / 大图头部（白字 + 半透明底钮）。
 */
Component({
  properties: {
    title: { type: String, value: '' },
    /** 右侧文字按钮 */
    right: { type: String, value: '' },
    theme: { type: String, value: 'light' },
    /** 背景色；transparent 时叠在页面头部之上 */
    bg: { type: String, value: 'transparent' },
    showBack: { type: Boolean, value: true },
    /** 是否浮在内容上层（不占位） */
    fixed: { type: Boolean, value: false },
  },

  data: {
    statusBarHeight: 44,
    navBarHeight: 44,
  },

  lifetimes: {
    attached() {
      const { statusBarHeight, navBarHeight } = chrome();
      this.setData({ statusBarHeight, navBarHeight });
    },
  },

  methods: {
    onBack() {
      back();
    },
    onRight() {
      this.triggerEvent('righttap');
    },
  },
});
