import { getOrders } from '../../../services/api';
import { chrome } from '../../../utils/chrome';
import { fen2yuan } from '../../../utils/money';
import { push, relaunch, toast } from '../../../utils/nav';
import type { CustomerOrderTab, Order } from '../../../models/index';

interface OrderVM extends Order {
  payableText: string;
  thumbs: string[];
}

const TABS: { key: CustomerOrderTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'ongoing', label: '进行中' },
  { key: 'toComment', label: '待评价' },
  { key: 'aftersale', label: '售后' },
];

/** 05 · 我的订单（含 42 空状态） */
Page({
  data: {
    headPad: 96,
    tabs: TABS,
    activeTab: 'all' as CustomerOrderTab,
    orders: [] as OrderVM[],
    loading: true,
  },

  onLoad(options: Record<string, string | undefined>) {
    const tab = (options.tab || 'all') as CustomerOrderTab;
    const valid = TABS.some((t) => t.key === tab);
    this.setData({
      headPad: chrome().capsuleBottom + 16,
      activeTab: valid ? tab : 'all',
    });
  },

  onShow() {
    this.load();
  },

  async load() {
    this.setData({ loading: true });
    const list = await getOrders(this.data.activeTab);
    this.setData({
      loading: false,
      orders: list.map((o) => ({
        ...o,
        payableText: fen2yuan(o.payable),
        thumbs: o.items.map((i) => i.image),
      })),
    });
  },

  onSwitchTab(e: WechatMiniprogram.TouchEvent) {
    const { key } = e.currentTarget.dataset as { key: CustomerOrderTab };
    if (key === this.data.activeTab) return;
    this.setData({ activeTab: key }, () => this.load());
  },

  onTapOrder(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id: string };
    push(`/pages/customer/order-detail/index?id=${id}`);
  },

  onAction(e: WechatMiniprogram.TouchEvent) {
    const { key, id } = e.currentTarget.dataset as { key: string; id: string };
    switch (key) {
      case 'progress':
      case 'pay':
        push(`/pages/customer/order-detail/index?id=${id}`);
        break;
      case 'again':
        relaunch('/pages/customer/menu/index');
        break;
      case 'comment':
        toast('发布评价（55）在后续步骤实现');
        break;
      default:
        break;
    }
  },

  onGoMenu() {
    relaunch('/pages/customer/menu/index');
  },
});
