import { getDashboard } from '../../../services/api';
import { chrome } from '../../../utils/chrome';
import { relaunch, toast } from '../../../utils/nav';
import type { Dashboard } from '../../../models/index';

const RANK_COLORS = ['#FF3800', '#FF7B1C', '#FFB08F'];

/** 08 · 工作台：今日概览、待处理、近 7 天趋势、热销榜 */
Page({
  data: {
    topPad: 96,
    dash: null as Dashboard | null,
    hotRows: [] as { rank: number; name: string; countText: string; color: string }[],
    loading: true,
  },

  onLoad() {
    this.setData({ topPad: chrome().capsuleBottom + 16 });
  },

  onShow() {
    this.load();
  },

  async load() {
    const dash = await getDashboard();
    this.setData({
      dash,
      loading: false,
      hotRows: dash.hot.map((h) => ({ ...h, color: RANK_COLORS[h.rank - 1] || '#FFB08F' })),
    });
  },

  /** 待处理事项置顶直达订单管理 */
  onGoOrders() {
    relaunch('/pages/merchant/orders/index');
  },

  onTapRange() {
    toast('营业数据（46）在后续步骤实现');
  },

  onTapHot() {
    toast('商品销售排行（87）在后续步骤实现');
  },
});
