import { getAftersaleOptions, trialRefund } from '../../../services/api';
import { aftersaleStore } from '../../../store/aftersale';
import { fen2yuan2 } from '../../../utils/money';
import { back, toast } from '../../../utils/nav';
import type { AftersaleItem } from '../../../models/index';

interface ItemVM extends AftersaleItem {
  amountText: string;
}

/** 56 · 选择退款商品：勾选部分商品，实时算退款额 */
Page({
  data: {
    partialTip: '',
    items: [] as ItemVM[],
    itemsAmountText: '0.00',
    couponShareText: '0.00',
    refundText: '0.00',
    loading: true,
  },

  orderId: '',

  onLoad(options: Record<string, string | undefined>) {
    this.orderId = options.id || '';
  },

  async onShow() {
    if (!aftersaleStore.isFor(this.orderId)) {
      const opts = await getAftersaleOptions(this.orderId);
      if (!opts) {
        toast('订单不存在');
        return;
      }
      aftersaleStore.start(this.orderId, opts.items);
      this.setData({ partialTip: opts.partialTip });
    } else {
      const opts = await getAftersaleOptions(this.orderId);
      if (opts) this.setData({ partialTip: opts.partialTip });
    }
    this.render();
  },

  render() {
    this.setData(
      {
        loading: false,
        items: aftersaleStore.get().items.map((i) => ({ ...i, amountText: fen2yuan2(i.amount) })),
      },
      () => this.refreshTrial()
    );
  },

  async refreshTrial() {
    const trial = await trialRefund(this.orderId, aftersaleStore.get().items);
    this.setData({
      itemsAmountText: fen2yuan2(trial.itemsAmount),
      couponShareText: fen2yuan2(trial.couponShare),
      refundText: fen2yuan2(trial.refundAmount),
    });
  },

  onToggle(e: WechatMiniprogram.TouchEvent) {
    const { key } = e.currentTarget.dataset as { key: string };
    aftersaleStore.toggleItem(key);
    this.render();
  },

  onNext() {
    if (!aftersaleStore.checkedItems.length) {
      toast('请至少选择一件商品');
      return;
    }
    back();
  },
});
