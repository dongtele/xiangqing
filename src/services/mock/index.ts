import * as db from './db';
import { HOT_CATEGORY_ID } from './db';
import { MOCK_LATENCY, PAY_FAIL_FIRST_ATTEMPT } from './config';
import type {
  CartItem,
  CheckoutTrial,
  CustomerOrderTab,
  DeliveryType,
  Goods,
  MenuGroup,
  MerchantOrder,
  MerchantOrderTab,
  Order,
  PrintSettings,
  ReceiptPreview,
  ReceiptType,
  Shop,
} from '@/models';

/**
 * 本地假后端。
 * 页面永远通过 services/api → services/request 访问数据；这里只是 request 在
 * USE_MOCK 时的另一条腿，接真实后端不影响任何页面代码。
 */

/** 运行期可变副本，模拟服务端状态（下单、上下架等会改数据） */
const state = {
  shop: { ...db.shop },
  orders: db.orders.map((o) => ({ ...o })),
  merchantOrders: db.merchantOrders.map((o) => ({ ...o })),
  merchantGoods: db.merchantGoods.map((g) => ({ ...g })),
  printSettings: { ...db.printSettings },
  payAttempts: {} as Record<string, number>,
  orderSeq: 1025,
  /** 打印任务流水，仅用于演示「已发送到打印机」 */
  printJobs: [] as { orderId: string; type: ReceiptType; at: number }[],
};

function delay<T>(payload: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(payload), MOCK_LATENCY));
}

function menuGroups(): MenuGroup[] {
  return db.categories.map((category) => {
    const goods =
      category.id === HOT_CATEGORY_ID
        ? db.goodsList
            .filter((g) => typeof g.hot === 'number')
            .sort((a, b) => (a.hot as number) - (b.hot as number))
        : db.goodsList.filter((g) => g.categoryId === category.id);
    return { category, goods };
  });
}

/** 服务端试算：优惠一律在这里算，前端只展示（交付文档 State Management） */
function trial(items: CartItem[], deliveryType: DeliveryType): CheckoutTrial {
  const itemsTotal = items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
  const count = items.reduce((n, i) => n + i.qty, 0);
  const packFee = items.length ? 200 : 0;
  const deliveryFee = deliveryType === 'delivery' && items.length ? 300 : 0;
  const hitCoupon = itemsTotal >= 5000;
  const couponDiscount = hitCoupon ? 1000 : 0;
  return {
    count,
    itemsTotal,
    packFee,
    deliveryFee,
    couponId: hitCoupon ? 'cp_50_10' : null,
    couponName: hitCoupon ? '满50减10（已自动选最优）' : '暂无可用优惠券',
    couponDiscount,
    payable: itemsTotal + packFee + deliveryFee - couponDiscount,
    discountTotal: couponDiscount,
    etaText: deliveryType === 'delivery' ? '预计 12:30 送达' : '预计 12:20 可取餐',
  };
}

function buildOrder(items: CartItem[], deliveryType: DeliveryType, remark: string): Order {
  const t = trial(items, deliveryType);
  const seq = state.orderSeq;
  state.orderSeq += 1;
  const pickupCode = String(8800 + (seq % 100));
  return {
    id: `ord_${seq}`,
    orderNo: `DD2026071700${seq - 1000}`,
    shopName: state.shop.name,
    status: 'unpaid',
    statusText: '待支付',
    statusTone: 'primary',
    deliveryType,
    items: items.map((i) => ({
      name: i.name,
      image: i.image,
      specText: i.specText,
      qty: i.qty,
      amount: i.unitPrice * i.qty,
    })),
    count: t.count,
    itemsTotal: t.itemsTotal,
    packFee: t.packFee,
    deliveryFee: t.deliveryFee,
    couponDiscount: t.couponDiscount,
    payable: t.payable,
    createdAt: '2026-07-17 12:02',
    createdAtText: '2026-07-17 12:02',
    metaText: `今天 12:02 · ${deliveryType === 'delivery' ? '外送' : '自取'} · ${t.etaText}`,
    etaText: t.etaText,
    etaTimeText: deliveryType === 'delivery' ? '今天 12:30' : '今天 12:20',
    pickupCode: deliveryType === 'pickup' ? pickupCode : undefined,
    address: deliveryType === 'delivery' ? db.defaultAddress : undefined,
    payMethodText: '微信支付',
    remark,
    timeline: [
      { label: '已接单', done: false, current: true },
      { label: '备餐完成', done: false, current: false },
      { label: deliveryType === 'delivery' ? '配送中' : '待取餐', done: false, current: false },
      { label: deliveryType === 'delivery' ? '已送达' : '已完成', done: false, current: false },
    ],
    actions: [{ key: 'pay', text: '去支付', style: 'primary' }],
  };
}

/** 支付成功后的状态推进：商家已接单，正在备餐（设计稿 04 的文案） */
function markPaid(order: Order): void {
  order.status = 'cooking';
  order.statusText = '商家备餐中';
  order.statusTone = 'primary';
  order.timeline = [
    { label: '已接单', done: true, current: false },
    { label: '备餐完成', done: false, current: true },
    { label: order.deliveryType === 'delivery' ? '配送中' : '待取餐', done: false, current: false },
    { label: order.deliveryType === 'delivery' ? '已送达' : '已完成', done: false, current: false },
  ];
  order.actions = [
    { key: 'again', text: '再来一单', style: 'outline' },
    { key: 'progress', text: '查看进度', style: 'primary' },
  ];
}

function customerOrders(tab: CustomerOrderTab): Order[] {
  const list = state.orders;
  switch (tab) {
    case 'ongoing':
      return list.filter((o) => ['unpaid', 'pending', 'cooking', 'delivering'].includes(o.status));
    case 'toComment':
      return list.filter((o) => o.status === 'done');
    case 'aftersale':
      return list.filter((o) => ['refunding', 'cancelled'].includes(o.status));
    default:
      return list;
  }
}

function merchantOrderList(tab: MerchantOrderTab): MerchantOrder[] {
  return state.merchantOrders.filter((o) => o.status === tab);
}

const yuan2 = (fen: number): string => `￥${(fen / 100).toFixed(2)}`;

/** 小票内容由服务端拼好下发，前端只负责渲染与送打 */
function receipt(order: MerchantOrder, type: ReceiptType): ReceiptPreview {
  const kitchen = type === 'kitchen';
  const base: ReceiptPreview = {
    type,
    title: `美味坊 · ${kitchen ? '后厨联' : '顾客联'}`,
    meta: `${order.seq}　${order.channel}　${order.placedAtText.replace('下单 ', '')}`,
    lines: order.lines.map((l) => ({
      text: l.specText ? `${l.name} ${l.specText}` : l.name,
      qty: `×${l.qty}`,
    })),
    amounts: [],
  };
  if (state.printSettings.printRemark && order.remark) base.remark = `备注：${order.remark}`;
  if (kitchen) return base;

  // 顾客联带金额与页脚；后厨联不带价格（后厨不需要）
  base.lines = order.lines.map((l) => ({
    text: l.specText ? `${l.name} ${l.specText}` : l.name,
    qty: `×${l.qty}　${yuan2(l.amount)}`,
  }));
  base.amounts = [
    { label: '合计', value: yuan2(order.lines.reduce((n, l) => n + l.amount, 0)) },
    { label: '顾客实付', value: yuan2(order.total) },
  ];
  base.footer = `${
    order.channel === '自提' ? `取餐码 ${order.pickupCode || '—'}` : order.addressText || ''
  }\n谢谢光临，欢迎再次下单`;
  return base;
}

/** 路由表：`METHOD /path` → handler。请求参数已由 request 层归一化。 */
type Payload = Record<string, unknown>;

const routes: Record<string, (p: Payload) => unknown> = {
  'POST /auth/login': () => db.user,

  'GET /shop': (): Shop => state.shop,

  'GET /menu': () => ({ categories: db.categories, groups: menuGroups() }),

  'GET /goods/detail': (p) => db.goodsList.find((g) => g.id === p.id) as Goods,

  'POST /checkout/trial': (p) =>
    trial(p.items as CartItem[], (p.deliveryType as DeliveryType) || 'delivery'),

  'POST /order/create': (p) => {
    const order = buildOrder(
      p.items as CartItem[],
      (p.deliveryType as DeliveryType) || 'delivery',
      (p.remark as string) || ''
    );
    state.orders = [order, ...state.orders];
    return { orderId: order.id };
  },

  'POST /order/pay': (p) => {
    const id = p.orderId as string;
    const order = state.orders.find((o) => o.id === id);
    if (!order) return { success: false, message: '订单不存在' };
    state.payAttempts[id] = (state.payAttempts[id] || 0) + 1;
    if (PAY_FAIL_FIRST_ATTEMPT && state.payAttempts[id] === 1) {
      return { success: false, message: '支付未完成' };
    }
    markPaid(order);
    return { success: true };
  },

  'GET /order/list': (p) => customerOrders((p.tab as CustomerOrderTab) || 'all'),

  'GET /order/detail': (p) => state.orders.find((o) => o.id === p.id),

  'GET /merchant/dashboard': () => ({
    ...db.dashboard,
    open: state.shop.open,
    todos: [
      { label: '待接单', value: merchantOrderList('pending').length, highlight: true },
      { label: '备餐中', value: merchantOrderList('ongoing').length, highlight: false },
      {
        label: '已售罄商品',
        value: state.merchantGoods.filter((g) => g.stock === 0).length,
        highlight: false,
      },
    ],
  }),

  'GET /merchant/orders': (p) => ({
    list: merchantOrderList((p.tab as MerchantOrderTab) || 'pending'),
    counts: {
      pending: merchantOrderList('pending').length,
      ongoing: merchantOrderList('ongoing').length,
      done: merchantOrderList('done').length,
      aftersale: merchantOrderList('aftersale').length,
    },
  }),

  'GET /merchant/order/detail': (p) => {
    const order = state.merchantOrders.find((o) => o.id === p.id);
    if (!order) return null;
    return {
      order,
      countdownText: order.countdown
        ? `${order.placedAtText} · 剩 ${Math.floor(order.countdown / 60)}:${String(
            order.countdown % 60
          ).padStart(2, '0')} 自动拒单`
        : order.placedAtText,
    };
  },

  'POST /merchant/order/accept': (p) => {
    const order = state.merchantOrders.find((o) => o.id === p.id);
    if (order) {
      order.status = 'ongoing';
      order.statusText = '备餐中';
      order.countdown = undefined;
      order.countdownText = undefined;
      // 自动打印后厨联，避免漏单（设计稿 51）
      if (state.printSettings.autoPrint) {
        state.printJobs.push({ orderId: order.id, type: 'kitchen', at: Date.now() });
      }
    }
    return { ok: true, autoPrinted: state.printSettings.autoPrint };
  },

  'POST /merchant/order/reject': (p) => {
    state.merchantOrders = state.merchantOrders.filter((o) => o.id !== p.id);
    return { ok: true };
  },

  'POST /merchant/order/finish': (p) => {
    const order = state.merchantOrders.find((o) => o.id === p.id);
    if (order) {
      order.status = 'done';
      order.statusText = '已完成';
    }
    return { ok: true };
  },

  'GET /merchant/print/settings': (): PrintSettings => state.printSettings,

  'POST /merchant/print/settings/update': (p) => {
    state.printSettings = { ...state.printSettings, ...(p as Partial<PrintSettings>) };
    state.printSettings.copiesText = `${state.printSettings.copies} 联`;
    return state.printSettings;
  },

  'GET /merchant/print/receipt': (p) => {
    const order = state.merchantOrders.find((o) => o.id === p.orderId);
    if (!order) return null;
    return receipt(order, (p.type as ReceiptType) || 'kitchen');
  },

  'POST /merchant/print': (p) => {
    const order = state.merchantOrders.find((o) => o.id === p.orderId);
    if (!order) return { ok: false, message: '订单不存在' };
    if (!state.printSettings.device.online) {
      return { ok: false, message: '打印机离线，请检查蓝牙连接' };
    }
    const types: ReceiptType[] = p.type
      ? [p.type as ReceiptType]
      : state.printSettings.copies >= 2
        ? ['kitchen', 'customer']
        : ['kitchen'];
    types.forEach((type) => state.printJobs.push({ orderId: order.id, type, at: Date.now() }));
    return {
      ok: true,
      message: `已发送到${state.printSettings.device.name}（${types.length} 联）`,
    };
  },

  'GET /merchant/goods': (p) => {
    const name = p.categoryName as string | undefined;
    const list =
      !name || name === '全部'
        ? state.merchantGoods
        : state.merchantGoods.filter((g) => g.categoryName === name);
    return {
      list,
      categories: [
        '全部',
        ...db.categories.filter((c) => c.id !== HOT_CATEGORY_ID).map((c) => c.name),
      ],
    };
  },

  'POST /merchant/goods/onsale': (p) => {
    const goods = state.merchantGoods.find((g) => g.id === p.id);
    if (goods) {
      goods.onSale = p.onSale as boolean;
      if (!goods.onSale) {
        goods.specCountText = '已下架';
      } else if (goods.stockLevel === 'low') {
        goods.specCountText = `库存偏低 ${goods.stock}`;
      } else if (goods.stockLevel === 'out') {
        goods.specCountText = '库存 0';
      } else {
        goods.specCountText = `库存 ${goods.stock}`;
      }
    }
    return { ok: true };
  },

  'GET /merchant/shop': (): Shop => state.shop,

  'POST /merchant/shop/update': (p) => {
    state.shop = { ...state.shop, ...(p as Partial<Shop>) };
    return state.shop;
  },
};

export function mockResolve<T>(key: string, payload: Payload): Promise<T> {
  const handler = routes[key];
  if (!handler) {
    return Promise.reject(new Error(`[mock] 未实现的接口：${key}`));
  }
  return delay(handler(payload) as T);
}
