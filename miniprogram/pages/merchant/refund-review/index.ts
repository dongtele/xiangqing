import { approveRefund, getMerchantRefund, rejectRefund } from '../../../services/api';
import { fen2yuan2 } from '../../../utils/money';
import { back, toast } from '../../../utils/nav';
import type { Refund } from '../../../models/index';

const REJECT_REASONS = [
  '餐品出餐时已核对，无质量问题',
  '已按订单备注制作，无漏送',
  '配送已按时完成，可提供配送轨迹',
  '其他（联系顾客协商）',
];

/** 48 · 退款审核：同意 / 驳回 + 凭证，超时自动同意 */
Page({
  data: {
    refund: null as Refund | null,
    amountText: '0.00',
    itemRows: [] as { key: string; name: string; specText: string; amountText: string; image: string }[],
    autoAgreeText: '',
    handled: false,
    loading: true,
  },

  refundId: '',
  timer: 0 as unknown as ReturnType<typeof setInterval>,

  onLoad(options: Record<string, string | undefined>) {
    this.refundId = options.id || '';
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

  stopTick() {
    if (this.timer) clearInterval(this.timer);
  },

  async load() {
    const refund = await getMerchantRefund(this.refundId);
    if (!refund) {
      toast('退款单不存在');
      return;
    }
    this.setData({
      refund,
      loading: false,
      amountText: fen2yuan2(refund.amount),
      handled: refund.status !== 'reviewing',
      itemRows: refund.items.map((i) => ({
        key: i.key,
        name: i.name,
        specText: `${i.specText}${i.specText ? ' ' : ''}×${i.qty}`,
        amountText: fen2yuan2(i.amount),
        image: i.image,
      })),
    });
    if (refund.status === 'reviewing') this.startTick(refund.autoAgreeIn);
    else this.stopTick();
  },

  /** 超时自动同意的倒计时，每秒刷新 */
  startTick(seconds: number) {
    this.stopTick();
    let left = seconds;
    const render = (): void => {
      const h = Math.floor(left / 3600);
      const m = Math.floor((left % 3600) / 60);
      this.setData({
        autoAgreeText:
          left <= 0
            ? '已超时，系统将自动同意退款'
            : `剩余 ${h > 0 ? `${h} 小时 ` : ''}${m} 分未处理将自动同意退款`,
      });
    };
    render();
    this.timer = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        this.stopTick();
      }
      render();
    }, 1000);
  },

  onApprove() {
    wx.showModal({
      title: '同意退款？',
      content: `将原路退回 ￥${this.data.amountText} 到顾客微信零钱`,
      confirmColor: '#FF4A17',
      success: async (res) => {
        if (!res.confirm) return;
        await approveRefund(this.refundId);
        toast('已同意退款', 'success');
        back();
      },
    });
  },

  /** 驳回必须给出说明，顾客侧可见 */
  onReject() {
    wx.showActionSheet({
      itemList: REJECT_REASONS,
      success: async (res) => {
        await rejectRefund(this.refundId, REJECT_REASONS[res.tapIndex]);
        toast('已驳回并通知顾客');
        back();
      },
    });
  },
});
