import {
  acceptOrder,
  finishOrder,
  getMerchantOrder,
  printReceipt,
  rejectOrder,
} from '../../../services/api';
import { fen2yuan2 } from '../../../utils/money';
import { mmss } from '../../../utils/time';
import { back, push, toast } from '../../../utils/nav';
import type { MerchantOrder, MerchantOrderLine } from '../../../models/index';

interface LineVM extends MerchantOrderLine {
  amountText: string;
}

interface ActionVM {
  key: 'reject' | 'accept' | 'print' | 'finish';
  text: string;
  /** flex 权重，主操作更宽（设计稿 1 : 1.4） */
  weight: number;
  primary: boolean;
}

/** 按订单状态给出底部操作 */
function actionsOf(status: MerchantOrder['status']): ActionVM[] {
  if (status === 'pending') {
    return [
      { key: 'reject', text: '拒单', weight: 1, primary: false },
      { key: 'accept', text: '接单并打印', weight: 1.4, primary: true },
    ];
  }
  if (status === 'ongoing') {
    return [
      { key: 'print', text: '补打小票', weight: 1, primary: false },
      { key: 'finish', text: '出餐完成', weight: 1.4, primary: true },
    ];
  }
  return [{ key: 'print', text: '补打小票', weight: 1, primary: false }];
}

/** 62 · 商家订单详情：明细、顾客信息、操作、打印 */
Page({
  data: {
    order: null as MerchantOrder | null,
    lines: [] as LineVM[],
    totalText: '0.00',
    statusMeta: '',
    actions: [] as ActionVM[],
    loading: true,
  },

  orderId: '',
  timer: 0 as unknown as ReturnType<typeof setInterval>,

  onLoad(options: Record<string, string | undefined>) {
    this.orderId = options.id || '';
  },

  onShow() {
    this.load();
  },

  onHide() {
    this.stopTick();
  },

  onUnload() {
    this.stopTick();
  },

  async load() {
    const res = await getMerchantOrder(this.orderId);
    if (!res) {
      toast('订单不存在');
      return;
    }
    const { order } = res;
    this.setData({
      order,
      loading: false,
      lines: order.lines.map((l) => ({ ...l, amountText: fen2yuan2(l.amount) })),
      totalText: fen2yuan2(order.total),
      statusMeta: res.countdownText,
      actions: actionsOf(order.status),
    });
    if (order.countdown) this.startTick(order.countdown, order.placedAtText);
    else this.stopTick();
  },

  /** 待接单倒计时每秒刷新，超时提示自动拒单 */
  startTick(seconds: number, placedAtText: string) {
    this.stopTick();
    let left = seconds;
    this.timer = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        this.stopTick();
        this.setData({ statusMeta: `${placedAtText} · 已超时自动拒单` });
        return;
      }
      this.setData({ statusMeta: `${placedAtText} · 剩 ${mmss(left)} 自动拒单` });
    }, 1000);
  },

  stopTick() {
    if (this.timer) clearInterval(this.timer);
  },

  onAction(e: WechatMiniprogram.TouchEvent) {
    const { key } = e.currentTarget.dataset as { key: ActionVM['key'] };
    switch (key) {
      case 'accept':
        this.accept();
        break;
      case 'reject':
        this.reject();
        break;
      case 'finish':
        this.finish();
        break;
      default:
        this.print();
        break;
    }
  },

  async accept() {
    const res = await acceptOrder(this.orderId);
    toast(res.autoPrinted ? '已接单，后厨联已自动打印' : '已接单，请手动打印后厨联', 'success');
    this.load();
  },

  reject() {
    wx.showModal({
      title: '确认拒单？',
      content: '拒单后顾客将收到通知并自动退款',
      confirmText: '拒单',
      confirmColor: '#D14343',
      success: async (res) => {
        if (!res.confirm) return;
        await rejectOrder(this.orderId);
        toast('已拒单');
        back();
      },
    });
  },

  async finish() {
    await finishOrder(this.orderId);
    toast('已出餐', 'success');
    this.load();
  },

  async print() {
    const res = await printReceipt(this.orderId);
    toast(res.message || (res.ok ? '已发送到打印机' : '打印失败'), res.ok ? 'success' : 'none');
  },

  /** 右上角「打印」进小票打印页（51） */
  onPrintSetting() {
    push(`/pages/merchant/print/index?orderId=${this.orderId}`);
  },

  onCall() {
    const order = this.data.order;
    if (!order) return;
    toast(`虚拟号拨号：${order.customerPhone}`);
  },
});
