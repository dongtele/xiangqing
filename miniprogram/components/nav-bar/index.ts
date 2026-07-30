import { chrome } from '../../utils/chrome';
import { back } from '../../utils/nav';

/**
 * 自定义标题栏：高 44px，标题 17px/800 居中，左侧返回圆钮 32×32。
 * theme=dark 用于渐变 / 大图头部（白字 + 半透明底钮）。
 *
 * 纵向位置跟随设计稿的两种处理：
 * - 常规（占位）标题栏落在胶囊按钮**下方**，整行宽度可用，右侧文字按钮不会被胶囊压住；
 * - fixed（浮在大图 / 渐变上）时只有返回钮，与胶囊按钮同一水平线。
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
    /** 标题行之上的占位高度 */
    topSpacer: 44,
    navBarHeight: 44,
  },

  lifetimes: {
    attached() {
      const { statusBarHeight, navBarHeight, capsuleBottom } = chrome();
      this.setData({
        navBarHeight,
        topSpacer: this.properties.fixed ? statusBarHeight : capsuleBottom,
      });
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
