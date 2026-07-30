import {
  acceptOrder,
  finishOrder,
  getMerchantOrders,
  printReceipt,
  rejectOrder,
} from '../../../services/api';
import { chrome } from '../../../utils/chrome';
import { fen2yuan2 } from '../../../utils/money';
import { mmss } from '../../../utils/time';
import { push, toast } from '../../../utils/nav';
import type { MerchantOrder, MerchantOrderTab } from '../../../models/index';

interface OrderVM extends MerchantOrder {
  totalText: string;
  refundAmountText: string;
  /** 列表里的紧凑行：名称带规格 */
  rows: { text: string; qty: number }[];
}

const TABS: { key: MerchantOrderTab; label: string }[] = [
  { key: 'pending', label: '待接单' },
  { key: 'ongoing', label: '进行中' },
  { key: 'done', label: '已完成' },
  { key: 'aftersale', label: '售后' },
];

/** 09 · 订单管理：按状态分流，新单高亮 + 超时倒计时 */
Page({
  data: {
    headPad: 96,
    tabs: TABS,
    counts: { pending: 0, ongoing: 0, done: 0, aftersale: 0 } as Record<MerchantOrderTab, number>,
    activeTab: 'pending' as MerchantOrderTab,
    orders: [] as OrderVM[],
    loading: true,
  },

  timer: 0 as unknown as ReturnType<typeof setInterval>,

  onLoad() {
    this.setData({ headPad: chrome().capsuleBottom + 16 });
  },

  onShow() {
    this.load();
    this.startTick();
  },

  onHide() {
    this.stopTick();
  },

  onUnload() {
    this.stopTick();
  },

  async load() {
    const res = await getMerchantOrders(this.data.activeTab);
    this.setData({
      loading: false,
      counts: res.counts,
      orders: res.list.map((o) => ({
        ...o,
        totalText: fen2yuan2(o.total),
        refundAmountText: fen2yuan2(o.refundAmount || 0),
        rows: o.lines.map((l) => ({
          text: l.specText ? `${l.name}（${l.specText}）` : l.name,
          qty: l.qty,
        })),
        countdownText: o.countdown ? `剩 ${mmss(o.countdown)} 未接自动提醒` : undefined,
      })),
    });
  },

  /** 倒计时每秒刷新；离开页面必须停止 */
  startTick() {
    this.stopTick();
    this.timer = setInterval(() => {
      const orders = this.data.orders.map((o) => {
        if (typeof o.countdown !== 'number' || o.countdown <= 0) return o;
        const left = o.countdown - 1;
        return {
          ...o,
          countdown: left,
          countdownText: left > 0 ? `剩 ${mmss(left)} 未接自动提醒` : '已超时未接单',
        };
      });
      this.setData({ orders });
    }, 1000);
  },

  stopTick() {
    if (this.timer) clearInterval(this.timer);
  },

  onSwitchTab(e: WechatMiniprogram.TouchEvent) {
    const { key } = e.currentTarget.dataset as { key: MerchantOrderTab };
    if (key === this.data.activeTab) return;
    this.setData({ activeTab: key, loading: true }, () => this.load());
  },

  async onAccept(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id: string };
    const res = await acceptOrder(id);
    toast(res.autoPrinted ? '已接单，后厨联已自动打印' : '已接单，进入备餐', 'success');
    this.load();
  },

  onReject(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id: string };
    wx.showModal({
      title: '确认拒单？',
      content: '拒单后顾客将收到通知并自动退款',
      confirmText: '拒单',
      confirmColor: '#D14343',
      success: async (res) => {
        if (!res.confirm) return;
        await rejectOrder(id);
        toast('已拒单');
        this.load();
      },
    });
  },

  async onFinish(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id: string };
    await finishOrder(id);
    toast('已出餐', 'success');
    this.load();
  },

  /** 售后单 → 退款审核（48） */
  onReview(e: WechatMiniprogram.TouchEvent) {
    const { refund } = e.currentTarget.dataset as { refund: string };
    push(`/pages/merchant/refund-review/index?id=${refund}`);
  },

  onDetail(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id: string };
    push(`/pages/merchant/order-detail/index?id=${id}`);
  },

  /** 列表内直接补打，不必进详情 */
  async onPrint(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id: string };
    const res = await printReceipt(id);
    toast(res.message || (res.ok ? '已发送到打印机' : '打印失败'), res.ok ? 'success' : 'none');
  },

  onScan() {
    toast('核销取餐码（21）在后续步骤实现');
  },
});
