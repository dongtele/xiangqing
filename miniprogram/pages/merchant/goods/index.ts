import { getMerchantGoods, setGoodsOnSale } from '../../../services/api';
import { chrome } from '../../../utils/chrome';
import { toast } from '../../../utils/nav';
import type { MerchantGoods } from '../../../models/index';

/** 10 · 商品管理：分类筛选 + 上下架直达 + 库存预警 */
Page({
  data: {
    headPad: 96,
    categories: [] as string[],
    activeCategory: '全部',
    list: [] as MerchantGoods[],
    keyword: '',
    loading: true,
  },

  onLoad() {
    this.setData({ headPad: chrome().capsuleBottom + 16 });
  },

  onShow() {
    this.load();
  },

  async load() {
    const res = await getMerchantGoods(this.data.activeCategory);
    const kw = this.data.keyword.trim();
    this.setData({
      loading: false,
      categories: res.categories,
      list: kw ? res.list.filter((g) => g.name.indexOf(kw) >= 0) : res.list,
    });
  },

  onSwitchCategory(e: WechatMiniprogram.TouchEvent) {
    const { name } = e.currentTarget.dataset as { name: string };
    if (name === this.data.activeCategory) return;
    this.setData({ activeCategory: name }, () => this.load());
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ keyword: e.detail.value }, () => this.load());
  },

  async onToggleSale(e: WechatMiniprogram.CustomEvent) {
    const { id } = e.currentTarget.dataset as { id: string };
    const { on } = e.detail as { on: boolean };
    await setGoodsOnSale(id, on);
    toast(on ? '已上架' : '已下架');
    this.load();
  },

  onRestock(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id: string };
    toast(`沽清与库存（49）在后续步骤实现 · ${id}`);
  },

  onEdit(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id: string };
    toast(`编辑商品（11）在后续步骤实现 · ${id}`);
  },

  onCreate() {
    toast('发布商品（11）在后续步骤实现');
  },

  onCategoryManage() {
    toast('分类管理（22）在后续步骤实现');
  },
});
