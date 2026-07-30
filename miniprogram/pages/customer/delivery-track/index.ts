import { getDeliveryTrack } from '../../../services/api';
import { chrome } from '../../../utils/chrome';
import { push, toast } from '../../../utils/nav';
import type { DeliveryTrack } from '../../../models/index';

/** 53 · 配送实时追踪：地图 + 骑手位置 + ETA + 进度 */
Page({
  data: {
    backTop: 92,
    track: null as DeliveryTrack | null,
    /** 骑手轨迹：虚线折线，用 SVG data URI 画（小程序不支持内联 SVG 标签） */
    routeBg: '',
    loading: true,
  },

  orderId: '',
  poll: 0 as unknown as ReturnType<typeof setInterval>,

  onLoad(options: Record<string, string | undefined>) {
    this.orderId = options.id || '';
    this.setData({ backTop: chrome().capsuleBottom + 12 });
  },

  onShow() {
    this.load();
    // 追踪页开启 8s 轮询，离开页面必须停止
    this.poll = setInterval(() => this.load(), 8000);
  },

  onHide() {
    this.stopPoll();
  },

  onUnload() {
    this.stopPoll();
  },

  stopPoll() {
    if (this.poll) clearInterval(this.poll);
  },

  async load() {
    const track = await getDeliveryTrack(this.orderId);
    if (!track) {
      toast('该订单暂无配送信息');
      return;
    }
    this.setData({ track, loading: false, routeBg: this.buildRoute(track.routePath) });
  },

  buildRoute(path: string): string {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 300" fill="none">' +
      `<path d="${path}" stroke="#FF4A17" stroke-width="4" stroke-linecap="round" ` +
      'stroke-dasharray="1 9"/></svg>';
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  },

  onCall() {
    push(`/pages/customer/rider-chat/index?id=${this.orderId}`);
  },

  onBack() {
    wx.navigateBack();
  },
});
