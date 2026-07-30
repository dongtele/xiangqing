import { Store } from './base';
import type { AftersaleItem, AftersaleType } from '../models/index';

/**
 * 售后申请的跨页草稿（20 申请售后 ⇄ 56 选择退款商品）。
 * 不做持久化：离开流程即失效。
 */
interface AftersaleDraft {
  orderId: string;
  type: AftersaleType;
  reason: string;
  desc: string;
  photos: string[];
  items: AftersaleItem[];
}

class AftersaleStore extends Store<AftersaleDraft> {
  constructor() {
    super({ orderId: '', type: 'refundOnly', reason: '', desc: '', photos: [], items: [] });
  }

  start(orderId: string, items: AftersaleItem[]): void {
    this.setState({ orderId, items, type: 'refundOnly', reason: '', desc: '', photos: [] });
  }

  /** 只在同一订单内复用草稿 */
  isFor(orderId: string): boolean {
    return this.get().orderId === orderId && this.get().items.length > 0;
  }

  setItems(items: AftersaleItem[]): void {
    this.setState({ items });
  }

  toggleItem(key: string): void {
    this.setState({
      items: this.get().items.map((i) => (i.key === key ? { ...i, checked: !i.checked } : i)),
    });
  }

  patch(patch: Partial<AftersaleDraft>): void {
    this.setState(patch);
  }

  get checkedItems(): AftersaleItem[] {
    return this.get().items.filter((i) => i.checked);
  }

  reset(): void {
    this.setState({ orderId: '', items: [], reason: '', desc: '', photos: [] });
  }
}

export const aftersaleStore = new AftersaleStore();
