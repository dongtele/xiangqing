import { getMenu, getShop, trialCheckout } from '../../../services/api';
import { CURRENT_SHOP_ID } from '../../../config';
import { cartStore } from '../../../store/cart';
import { chrome } from '../../../utils/chrome';
import { fen2yuan } from '../../../utils/money';
import { push, toast } from '../../../utils/nav';
import type { CartItem, CheckoutTrial, Goods, MenuGroup, Shop } from '../../../models/index';

interface GoodsVM extends Goods {
  qty: number;
  hasSpec: boolean;
  priceFrom: boolean;
}

interface GroupVM {
  id: string;
  name: string;
  goods: GoodsVM[];
}

/** 01 · 点餐菜单（首页）：左侧分类锚点 + 右侧商品列表 + 底部购物车条 */
Page({
  data: {
    headPad: 92,
    shop: null as Shop | null,
    groups: [] as GroupVM[],
    activeCatId: '',
    scrollIntoId: '',
    loading: true,

    cartCount: 0,
    cartTotal: 0,
    cartRows: [] as CartItem[],
    barPromo: '',
    sheetPromo: '',
    sheetPromoNote: '',
    sheetFooterNote: '',
    sheetShow: false,
  },

  /** 各分组在右侧列表中的 top 偏移，用于滚动联动高亮 */
  groupTops: [] as { id: string; top: number }[],
  rawGroups: [] as MenuGroup[],
  unsubscribe: null as null | (() => void),
  trialTimer: 0 as unknown as ReturnType<typeof setTimeout>,

  onLoad() {
    this.setData({ headPad: chrome().capsuleBottom + 12 });
    this.loadData();
    this.unsubscribe = cartStore.subscribe(() => this.syncCart());
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe();
  },

  async loadData() {
    const [shop, menu] = await Promise.all([getShop(), getMenu()]);
    this.rawGroups = menu.groups;
    this.setData(
      {
        shop,
        groups: this.buildGroups(),
        activeCatId: menu.groups.length ? menu.groups[0].category.id : '',
        loading: false,
      },
      () => this.measureGroups()
    );
  },

  buildGroups(): GroupVM[] {
    return this.rawGroups.map((g) => ({
      id: g.category.id,
      name: g.category.name,
      goods: g.goods.map((gd) => ({
        ...gd,
        qty: cartStore.qtyOfGoods(gd.id),
        hasSpec: gd.specGroups.length > 0,
        priceFrom: gd.specGroups.some((sg) => sg.options.some((o) => o.priceDelta > 0)),
      })),
    }));
  },

  measureGroups() {
    const query = wx.createSelectorQuery().in(this);
    query.selectAll('.js-group').boundingClientRect();
    query.select('.menu__list').boundingClientRect();
    query.exec((res) => {
      const rects = (res[0] || []) as WechatMiniprogram.BoundingClientRectCallbackResult[];
      const list = res[1] as WechatMiniprogram.BoundingClientRectCallbackResult;
      if (!list || !rects.length) return;
      this.groupTops = rects.map((r, i) => ({
        id: this.rawGroups[i] ? this.rawGroups[i].category.id : '',
        top: r.top - list.top,
      }));
    });
  },

  syncCart() {
    this.setData({
      groups: this.buildGroups(),
      cartCount: cartStore.count,
      cartTotal: cartStore.itemsTotal,
      cartRows: cartStore.snapshot(),
    });
    if (cartStore.count === 0) {
      this.setData({ sheetShow: false, barPromo: '', sheetPromo: '', sheetFooterNote: '' });
      return;
    }
    // 金额与优惠一律由服务端试算，前端只做展示
    clearTimeout(this.trialTimer);
    this.trialTimer = setTimeout(() => {
      trialCheckout(cartStore.snapshot(), cartStore.get().deliveryType).then((t) =>
        this.applyTrial(t)
      );
    }, 120);
  },

  applyTrial(t: CheckoutTrial) {
    const gap = 5000 - t.itemsTotal;
    const hit = t.couponDiscount > 0;
    this.setData({
      barPromo: hit
        ? `已享满50减10 · 结算再省 ¥${fen2yuan(t.couponDiscount)}`
        : `再买 ¥${fen2yuan(gap)} 可减 ¥10`,
      sheetPromo: hit
        ? `已满 ¥50，结算立减 ¥${fen2yuan(t.couponDiscount)}`
        : `再买 ¥${fen2yuan(gap)} 可减 ¥10`,
      sheetPromoNote: hit ? '已是最优惠 ✓' : '',
      sheetFooterNote: hit
        ? `结算再减 ¥${fen2yuan(t.couponDiscount)}，实付约 ¥${fen2yuan(t.payable)}`
        : '',
    });
  },

  /* ---------- 分类联动 ---------- */

  onTapCategory(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id: string };
    this.setData({ activeCatId: id, scrollIntoId: `g-${id}` });
  },

  onListScroll(e: WechatMiniprogram.ScrollViewScroll) {
    const top = e.detail.scrollTop + 10;
    let active = this.groupTops.length ? this.groupTops[0].id : '';
    this.groupTops.forEach((g) => {
      if (top >= g.top) active = g.id;
    });
    if (active && active !== this.data.activeCatId) this.setData({ activeCatId: active });
  },

  /* ---------- 选餐 ---------- */

  goodsById(id: string): Goods | undefined {
    for (const g of this.rawGroups) {
      const hit = g.goods.find((x) => x.id === id);
      if (hit) return hit;
    }
    return undefined;
  },

  onTapGoods(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id: string };
    push(`/pages/customer/goods/index?id=${id}`);
  },

  onPlus(e: WechatMiniprogram.CustomEvent) {
    const { id } = e.currentTarget.dataset as { id: string };
    const goods = this.goodsById(id);
    if (!goods) return;
    if (goods.specGroups.length) {
      // 多规格必须先选规格（设计稿：显示「选规格」）
      push(`/pages/customer/goods/index?id=${id}`);
      return;
    }
    cartStore.add(CURRENT_SHOP_ID, goods, []);
  },

  onMinus(e: WechatMiniprogram.CustomEvent) {
    const { id } = e.currentTarget.dataset as { id: string };
    cartStore.decreaseByGoods(id);
  },

  /* ---------- 购物车浮层 ---------- */

  onOpenCart() {
    if (!cartStore.count) return;
    this.setData({ sheetShow: true });
  },

  onCloseCart() {
    this.setData({ sheetShow: false });
  },

  onClearCart() {
    wx.showModal({
      title: '清空购物车？',
      content: '已选商品将全部移除',
      confirmColor: '#FF4A17',
      success: (res) => {
        if (res.confirm) cartStore.clear();
      },
    });
  },

  onSheetPlus(e: WechatMiniprogram.CustomEvent) {
    cartStore.changeQty((e.detail as { key: string }).key, 1);
  },

  onSheetMinus(e: WechatMiniprogram.CustomEvent) {
    cartStore.changeQty((e.detail as { key: string }).key, -1);
  },

  onCheckout() {
    if (!cartStore.count) return;
    this.setData({ sheetShow: false });
    push('/pages/customer/checkout/index');
  },

  /* ---------- 其它入口（后续步骤补齐页面） ---------- */

  onSearch() {
    toast('店内搜索（18）在后续步骤实现');
  },

  onShopHome() {
    toast('店铺主页（32）在后续步骤实现');
  },
});
