import { cancelRefund, getRefund } from '../../../services/api';
import { fen2yuan2 } from '../../../utils/money';
import { toast } from '../../../utils/nav';
import type { Refund } from '../../../models/index';

/** 40 · 退款进度：状态时间轴 + 金额与流水号 */
Page({
  data: {
    refund: null as Refund | null,
    amountText: '0.00',
    canCancel: false,
    loading: true,
  },

  refundId: '',

  onLoad(options: Record<string, string | undefined>) {
    this.refundId = options.id || '';
  },

  onShow() {
    this.load();
  },

  async load() {
    const refund = await getRefund(this.refundId);
    if (!refund) {
      toast('退款单不存在');
      return;
    }
    this.setData({
      refund,
      loading: false,
      amountText: fen2yuan2(refund.amount),
      canCancel: refund.status === 'reviewing',
    });
  },

  onContactShop() {
    toast('在线客服（41）在后续步骤实现');
  },

  onCancel() {
    wx.showModal({
      title: '撤销退款申请？',
      content: '撤销后本单将恢复为正常订单',
      confirmColor: '#FF4A17',
      success: async (res) => {
        if (!res.confirm) return;
        await cancelRefund(this.refundId);
        toast('已撤销申请');
        this.load();
      },
    });
  },
});
