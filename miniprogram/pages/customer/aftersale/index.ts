import { applyAftersale, getAftersaleOptions, trialRefund } from '../../../services/api';
import { aftersaleStore } from '../../../store/aftersale';
import { fen2yuan2 } from '../../../utils/money';
import { back, push, replace, toast } from '../../../utils/nav';
import type { AftersaleOptions, AftersaleType } from '../../../models/index';

/** 20 · 申请售后：类型 + 原因 + 说明 + 凭证图，退款金额透明 */
Page({
  data: {
    options: null as AftersaleOptions | null,
    type: 'refundOnly' as AftersaleType,
    reason: '',
    desc: '',
    photos: [] as string[],
    itemsText: '全部商品',
    refundText: '0.00',
    submitting: false,
    loading: true,
  },

  orderId: '',
  unsubscribe: null as null | (() => void),

  onLoad(options: Record<string, string | undefined>) {
    this.orderId = options.id || '';
  },

  onShow() {
    this.load();
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe();
  },

  async load() {
    const options = await getAftersaleOptions(this.orderId);
    if (!options) {
      toast('订单不存在');
      return;
    }
    if (!aftersaleStore.isFor(this.orderId)) {
      aftersaleStore.start(this.orderId, options.items);
    }
    const draft = aftersaleStore.get();
    this.setData(
      {
        options,
        loading: false,
        type: draft.type,
        reason: draft.reason || options.reasons[0],
        desc: draft.desc,
        photos: draft.photos,
      },
      () => this.refreshTrial()
    );
    aftersaleStore.patch({ reason: this.data.reason });
  },

  /** 退款金额由服务端按实付比例分摊后返回 */
  async refreshTrial() {
    const checked = aftersaleStore.checkedItems;
    const all = aftersaleStore.get().items;
    const trial = await trialRefund(this.orderId, checked.length ? checked : all);
    this.setData({
      refundText: fen2yuan2(trial.refundAmount),
      itemsText:
        checked.length === all.length || !checked.length
          ? '全部商品'
          : `${checked.length} 件商品`,
    });
  },

  onPickType(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id: AftersaleType };
    this.setData({ type: id });
    aftersaleStore.patch({ type: id });
  },

  onPickReason(e: WechatMiniprogram.TouchEvent) {
    const { name } = e.currentTarget.dataset as { name: string };
    this.setData({ reason: name });
    aftersaleStore.patch({ reason: name });
  },

  onDesc(e: WechatMiniprogram.Input) {
    this.setData({ desc: e.detail.value });
    aftersaleStore.patch({ desc: e.detail.value });
  },

  /** 相机 / 相册权限在触发点申请，拒绝后给手动开启引导 */
  onAddPhoto() {
    if (this.data.photos.length >= 3) {
      toast('最多上传 3 张凭证');
      return;
    }
    wx.chooseMedia({
      count: 3 - this.data.photos.length,
      mediaType: ['image'],
      success: (res) => {
        const photos = [...this.data.photos, ...res.tempFiles.map((f) => f.tempFilePath)];
        this.setData({ photos });
        aftersaleStore.patch({ photos });
      },
      fail: () => toast('已取消，也可在设置里开启相册权限'),
    });
  },

  onRemovePhoto(e: WechatMiniprogram.TouchEvent) {
    const { index } = e.currentTarget.dataset as { index: number };
    const photos = this.data.photos.filter((_, i) => i !== index);
    this.setData({ photos });
    aftersaleStore.patch({ photos });
  },

  /** 去挑选部分退款的商品（56） */
  onPickItems() {
    push(`/pages/customer/refund-items/index?id=${this.orderId}`);
  },

  async onSubmit() {
    if (this.data.submitting) return;
    if (!this.data.reason) {
      toast('请选择售后原因');
      return;
    }
    this.setData({ submitting: true });
    try {
      const checked = aftersaleStore.checkedItems;
      const { refundId } = await applyAftersale({
        orderId: this.orderId,
        type: this.data.type,
        reason: this.data.reason,
        desc: this.data.desc,
        photos: this.data.photos,
        items: checked.length ? checked : aftersaleStore.get().items,
      });
      aftersaleStore.reset();
      if (!refundId) {
        back();
        return;
      }
      replace(`/pages/customer/refund-detail/index?id=${refundId}`);
    } finally {
      this.setData({ submitting: false });
    }
  },
});
