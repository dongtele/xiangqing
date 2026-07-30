import { Store } from './base';
import type { CartItem, CartState, DeliveryType, Goods, SpecOption } from '../models/index';

const STORAGE_KEY = 'wwf_cart';

function specKey(goodsId: string, specIds: string[]): string {
  return `${goodsId}#${[...specIds].sort().join(',')}`;
}

class CartStore extends Store<CartState> {
  constructor() {
    super({ shopId: '', items: [], remark: '', deliveryType: 'delivery' });
    const cached = wx.getStorageSync(STORAGE_KEY) as CartState | '';
    if (cached && cached.items) this.setState(cached);
  }

  protected notify(): void {
    wx.setStorageSync(STORAGE_KEY, this.get());
    super.notify();
  }

  get count(): number {
    return this.get().items.reduce((n, i) => n + i.qty, 0);
  }

  /** 商品小计（分）；优惠一律由服务端试算，此处只算原价合计 */
  get itemsTotal(): number {
    return this.get().items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
  }

  /** 某商品在购物车中的总份数，用于菜单页显示步进器 */
  qtyOfGoods(goodsId: string): number {
    return this.get()
      .items.filter((i) => i.goodsId === goodsId)
      .reduce((n, i) => n + i.qty, 0);
  }

  add(shopId: string, goods: Goods, options: SpecOption[], qty = 1): void {
    if (this.get().shopId && this.get().shopId !== shopId) {
      // 切店铺清空购物车（真实场景需二次确认，见交付文档 State Management）
      this.setState({ shopId, items: [] });
    }
    const specIds = options.map((o) => o.id);
    const key = specKey(goods.id, specIds);
    const unitPrice = goods.price + options.reduce((n, o) => n + o.priceDelta, 0);
    const items = [...this.get().items];
    const hit = items.find((i) => i.key === key);
    if (hit) {
      hit.qty += qty;
    } else {
      items.push({
        key,
        goodsId: goods.id,
        name: goods.name,
        image: goods.image,
        unitPrice,
        qty,
        specText: options.map((o) => o.name).join(' / '),
        specIds,
        unit: goods.unit,
      });
    }
    this.setState({ shopId, items });
  }

  /** 菜单页「－」：从该商品最后一条规格里减 */
  decreaseByGoods(goodsId: string): void {
    const items = [...this.get().items];
    for (let i = items.length - 1; i >= 0; i -= 1) {
      if (items[i].goodsId === goodsId) {
        items[i].qty -= 1;
        if (items[i].qty <= 0) items.splice(i, 1);
        break;
      }
    }
    this.setState({ items });
  }

  changeQty(key: string, delta: number): void {
    const items = [...this.get().items];
    const idx = items.findIndex((i) => i.key === key);
    if (idx < 0) return;
    items[idx].qty += delta;
    if (items[idx].qty <= 0) items.splice(idx, 1);
    this.setState({ items });
  }

  setDeliveryType(deliveryType: DeliveryType): void {
    this.setState({ deliveryType });
  }

  setRemark(remark: string): void {
    this.setState({ remark });
  }

  clear(): void {
    this.setState({ items: [], remark: '' });
  }

  snapshot(): CartItem[] {
    return this.get().items.map((i) => ({ ...i }));
  }
}

export const cartStore = new CartStore();
