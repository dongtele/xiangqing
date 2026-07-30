import { getGoods } from '../../../services/api';
import { CURRENT_SHOP_ID } from '../../../config';
import { cartStore } from '../../../store/cart';
import { back, toast } from '../../../utils/nav';
import type { Goods, SpecOption } from '../../../models/index';

interface OptionVM extends SpecOption {
  selected: boolean;
  /** 展示用：卤蛋 +¥3 / 标准 ¥38 */
  label: string;
}

interface GroupVM {
  id: string;
  name: string;
  multiple: boolean;
  required: boolean;
  options: OptionVM[];
}

/** 02 · 商品详情：规格 / 加料选择 → 加入购物车 */
Page({
  data: {
    goods: null as Goods | null,
    groups: [] as GroupVM[],
    /** 已选规格文案：标准 / 微辣 */
    selectedText: '',
    unitPrice: 0,
    qty: 1,
    loading: true,
  },

  /** groupId → 选中的 optionId 集合 */
  selection: {} as Record<string, string[]>,

  async onLoad(options: Record<string, string | undefined>) {
    const goods = await getGoods(options.id || '');
    if (!goods) {
      toast('商品不存在');
      back();
      return;
    }
    // 必选组预选：优先取 defaultOptionId，否则第一项（设计稿：标准 / 微辣）
    this.selection = {};
    goods.specGroups.forEach((g) => {
      if (!g.required || !g.options.length) {
        this.selection[g.id] = [];
        return;
      }
      const preset = g.defaultOptionId
        ? g.options.find((o) => o.id === g.defaultOptionId)
        : undefined;
      this.selection[g.id] = [(preset || g.options[0]).id];
    });
    this.setData({ goods, loading: false }, () => this.refresh());
  },

  refresh() {
    const goods = this.data.goods;
    if (!goods) return;
    const groups: GroupVM[] = goods.specGroups.map((g) => ({
      id: g.id,
      name: g.name,
      multiple: g.multiple,
      required: g.required,
      options: g.options.map((o) => ({
        ...o,
        selected: (this.selection[g.id] || []).indexOf(o.id) >= 0,
        label: o.priceDelta > 0 ? `${o.name} +¥${o.priceDelta / 100}` : o.name,
      })),
    }));
    const picked = this.pickedOptions();
    this.setData({
      groups,
      selectedText: picked.map((o) => o.name).join(' / '),
      unitPrice: goods.price + picked.reduce((n, o) => n + o.priceDelta, 0),
    });
  },

  pickedOptions(): SpecOption[] {
    const goods = this.data.goods;
    if (!goods) return [];
    const out: SpecOption[] = [];
    goods.specGroups.forEach((g) => {
      (this.selection[g.id] || []).forEach((id) => {
        const hit = g.options.find((o) => o.id === id);
        if (hit) out.push(hit);
      });
    });
    return out;
  },

  onTapOption(e: WechatMiniprogram.TouchEvent) {
    const { gid, oid, multiple } = e.currentTarget.dataset as {
      gid: string;
      oid: string;
      multiple: boolean;
    };
    const current = this.selection[gid] || [];
    if (multiple) {
      this.selection[gid] =
        current.indexOf(oid) >= 0 ? current.filter((x) => x !== oid) : [...current, oid];
    } else {
      this.selection[gid] = [oid];
    }
    this.refresh();
  },

  onPlus() {
    this.setData({ qty: this.data.qty + 1 });
  },

  onMinus() {
    if (this.data.qty <= 1) return;
    this.setData({ qty: this.data.qty - 1 });
  },

  onAddToCart() {
    const goods = this.data.goods;
    if (!goods) return;
    const missing = goods.specGroups.find(
      (g) => g.required && !(this.selection[g.id] || []).length
    );
    if (missing) {
      toast(`请选择${missing.name}`);
      return;
    }
    cartStore.add(CURRENT_SHOP_ID, goods, this.pickedOptions(), this.data.qty);
    wx.vibrateShort({ type: 'light' });
    back();
  },

  onPreview() {
    toast('菜品大图预览（54）在后续步骤实现');
  },
});
