import * as db from './db';
import { HOT_CATEGORY_ID } from './db';
import { MOCK_LATENCY, PAY_FAIL_FIRST_ATTEMPT } from './config';
import type {
  AftersaleItem,
  AftersaleOptions,
  AftersaleType,
  BulkGoods,
  BulkTab,
  CartItem,
  CategoryRow,
  GoodsDraft,
  CheckoutTrial,
  CustomerOrderTab,
  DeliveryTrack,
  DeliveryType,
  Goods,
  MenuGroup,
  MerchantOrder,
  MerchantOrderTab,
  Order,
  PrintSettings,
  ReceiptPreview,
  ReceiptType,
  Refund,
  RefundTrial,
  RiderMessage,
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
  refunds: db.refunds.map((r) => ({ ...r })),
  riderMessages: db.riderMessages.map((m) => ({ ...m })),
  optionLib: db.optionLib.map((g) => ({ ...g, options: g.options.map((o) => ({ ...o })) })),
  categoryRows: db.categoryRows.map((c) => ({ ...c })),
  stockGoods: db.stockGoods.map((g) => ({ ...g })),
  bulkGoods: db.bulkGoods.map((g) => ({ ...g })),
  /** 11 编辑商品的草稿副本，保存后写回 goodsList / merchantGoods */
  goodsDrafts: {} as Record<string, GoodsDraft>,
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

/** 售后：按实付比例分摊优惠后算退款额 */
function refundTrial(order: Order, items: AftersaleItem[]): RefundTrial {
  const itemsAmount = items.reduce((n, i) => n + (i.checked ? i.amount : 0), 0);
  const share = order.itemsTotal
    ? Math.round((order.couponDiscount * itemsAmount) / order.itemsTotal)
    : 0;
  return {
    itemsAmount,
    couponShare: share,
    refundAmount: Math.max(0, itemsAmount - share),
  };
}

function aftersaleItemsOf(order: Order): AftersaleItem[] {
  return order.items.map((i, idx) => ({
    key: `as_${idx}`,
    name: i.name,
    specText: i.specText,
    qty: i.qty,
    amount: i.amount,
    image: i.image,
    checked: idx === 0,
  }));
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

  /* ---------------- 配送追踪 / 联系骑手 ---------------- */

  'GET /delivery/track': (p): DeliveryTrack | null => {
    const order = state.orders.find((o) => o.id === p.orderId);
    if (!order || !order.rider) return null;
    return {
      etaText: '预计 12:38 送达',
      subText: '骑手已取餐，正在赶往你的位置 · 还有 2.1 公里',
      percent: 62,
      stages: ['已接单', '配送中', '已送达'],
      activeStage: 1,
      rider: order.rider,
      // 经纬度用于 <map> 组件；没有腾讯位置服务 key 时页面降级为示意底图
      shopPoint: { latitude: 30.2795, longitude: 120.0215, left: 70, top: 26 },
      userPoint: { latitude: 30.2731, longitude: 120.0128, left: 18, top: 64 },
      routePath: 'M72 200 L72 140 L200 140 L200 80 L266 80',
    };
  },

  'GET /rider/chat': (p) => {
    const order = state.orders.find((o) => o.id === p.orderId);
    return {
      rider: order && order.rider ? order.rider : null,
      messages: state.riderMessages,
      quickReplies: db.riderQuickReplies,
    };
  },

  'POST /rider/chat/send': (p) => {
    const msg: RiderMessage = {
      id: `rm_${state.riderMessages.length + 1}`,
      from: 'me',
      text: String(p.text || ''),
    };
    state.riderMessages = [...state.riderMessages, msg];
    return { messages: state.riderMessages };
  },

  /* ---------------- 售后与退款 ---------------- */

  'GET /aftersale/options': (p): AftersaleOptions | null => {
    const order = state.orders.find((o) => o.id === p.orderId);
    if (!order) return null;
    const first = order.items[0];
    return {
      orderNo: order.orderNo,
      orderTitle: `${first.name} 等${order.count}件`,
      orderMetaText: `订单 ${order.orderNo} · 实付 ￥${(order.payable / 100).toFixed(0)}`,
      orderImage: first.image,
      payable: order.payable,
      types: [
        { id: 'refundOnly', name: '仅退款', sub: '未收到餐' },
        { id: 'refundCompensate', name: '退款+补偿', sub: '餐品有问题' },
      ],
      reasons: db.aftersaleReasons,
      items: aftersaleItemsOf(order),
      tip: '商家 2 小时内未处理将自动退款，原路退回微信零钱',
      partialTip: '已出餐订单仅支持「仅退款」，退款金额按实付比例计算',
    };
  },

  'POST /aftersale/trial': (p) => {
    const order = state.orders.find((o) => o.id === p.orderId);
    if (!order) return { itemsAmount: 0, couponShare: 0, refundAmount: 0 };
    return refundTrial(order, (p.items as AftersaleItem[]) || []);
  },

  'POST /aftersale/apply': (p) => {
    const order = state.orders.find((o) => o.id === p.orderId);
    if (!order) return { refundId: '' };
    const items = ((p.items as AftersaleItem[]) || []).filter((i) => i.checked);
    const trial = refundTrial(order, items);
    const id = `rf_${3000 + state.refunds.length}`;
    const refund: Refund = {
      id,
      orderId: order.id,
      orderNo: order.orderNo,
      status: 'reviewing',
      statusText: '退款处理中',
      statusSub: '商家将在 2 小时内处理，超时自动退款',
      type: (p.type as AftersaleType) || 'refundOnly',
      typeText: p.type === 'refundCompensate' ? '退款+补偿' : '仅退款（已出餐）',
      amount: trial.refundAmount,
      itemsText: items.map((i) => `${i.name} ×${i.qty}`).join('、') || '整单',
      reasonText: String(p.reason || ''),
      desc: String(p.desc || ''),
      photos: (p.photos as string[]) || [],
      items,
      createdAtText: '今天 12:41',
      autoAgreeIn: 7200,
      timeline: [
        { title: '提交退款申请', sub: '今天 12:41', done: true },
        { title: '商家审核中', sub: '预计 14:41 前完成', done: true },
        { title: '退款到账', sub: '原路退回微信零钱', done: false },
      ],
      placedAtText: order.createdAtText,
    };
    state.refunds = [refund, ...state.refunds];
    order.status = 'refunding';
    order.statusText = '退款处理中';
    order.actions = [{ key: 'aftersale', text: '查看退款', style: 'primary' }];
    return { refundId: id };
  },

  'GET /refund/detail': (p) => state.refunds.find((r) => r.id === p.id) || null,

  'POST /refund/cancel': (p) => {
    const refund = state.refunds.find((r) => r.id === p.id);
    if (refund) {
      refund.status = 'cancelled';
      refund.statusText = '已撤销申请';
      refund.statusSub = '你已撤销本次退款申请';
      refund.timeline = [
        ...refund.timeline.slice(0, 1),
        { title: '已撤销申请', sub: '今天 12:52', done: true },
      ];
      const order = state.orders.find((o) => o.id === refund.orderId);
      if (order) {
        order.status = 'delivering';
        order.statusText = '骑手配送中';
        order.actions = [
          { key: 'again', text: '再来一单', style: 'outline' },
          { key: 'progress', text: '查看进度', style: 'primary' },
        ];
      }
    }
    return { ok: true };
  },

  /* 商家侧退款审核（48） */

  'GET /merchant/refund/detail': (p) => state.refunds.find((r) => r.id === p.id) || null,

  'POST /merchant/refund/approve': (p) => {
    const refund = state.refunds.find((r) => r.id === p.id);
    if (refund) {
      refund.status = 'agreed';
      refund.statusText = '退款成功';
      refund.statusSub = '款项已原路退回微信零钱，1-3 个工作日到账';
      refund.timeline = [
        { title: '提交退款申请', sub: refund.createdAtText, done: true },
        { title: '商家已同意', sub: '刚刚', done: true },
        { title: '退款到账', sub: '原路退回微信零钱', done: true },
      ];
      state.merchantOrders = state.merchantOrders.filter((o) => o.refundId !== refund.id);
    }
    return { ok: true };
  },

  'POST /merchant/refund/reject': (p) => {
    const refund = state.refunds.find((r) => r.id === p.id);
    if (refund) {
      refund.status = 'rejected';
      refund.statusText = '商家已拒绝';
      refund.statusSub = String(p.reason || '商家认为不符合退款条件');
      refund.timeline = [
        { title: '提交退款申请', sub: refund.createdAtText, done: true },
        { title: '商家已拒绝', sub: '刚刚', done: true },
        { title: '可联系客服介入', sub: '48 小时内可申请平台介入', done: false },
      ];
      state.merchantOrders = state.merchantOrders.filter((o) => o.refundId !== refund.id);
    }
    return { ok: true };
  },

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

  /* ---------------- 商家端 · 商品与菜单 ---------------- */

  'GET /merchant/goods/detail': (p): GoodsDraft | null => {
    const id = String(p.id || '');
    if (state.goodsDrafts[id]) return state.goodsDrafts[id];
    const goods = db.goodsList.find((g) => g.id === id);
    const row = state.merchantGoods.find((g) => g.id === id);
    if (!goods && !row) return null;
    const draft: GoodsDraft = {
      id,
      name: goods ? goods.name : row ? row.name : '',
      categoryName: row
        ? row.categoryName
        : db.categories.find((c) => c.id === (goods ? goods.categoryId : ''))?.name || '',
      price: goods ? goods.price : row ? row.price : 0,
      stock: goods ? goods.stock : row ? row.stock : 0,
      images: [goods ? goods.image : row ? row.image : ''],
      onSale: row ? row.onSale : true,
      specGroups: goods ? JSON.parse(JSON.stringify(goods.specGroups)) : [],
    };
    state.goodsDrafts[id] = draft;
    return draft;
  },

  'POST /merchant/goods/save': (p) => {
    const draft = p as unknown as GoodsDraft;
    state.goodsDrafts[draft.id] = draft;
    // 写回顾客端菜单与商家商品列表，保证 01 / 02 / 10 立即同步
    const goods = db.goodsList.find((g) => g.id === draft.id);
    if (goods) {
      goods.name = draft.name;
      goods.price = draft.price;
      goods.stock = draft.stock;
      goods.specGroups = draft.specGroups;
      goods.onSale = draft.onSale;
    }
    const row = state.merchantGoods.find((g) => g.id === draft.id);
    if (row) {
      row.name = draft.name;
      row.price = draft.price;
      row.stock = draft.stock;
      row.onSale = draft.onSale;
      row.priceFrom = draft.specGroups.some((sg) => sg.options.some((o) => o.priceDelta > 0));
    }
    return { ok: true };
  },

  'GET /merchant/option-lib': () => state.optionLib,

  'POST /merchant/option-lib/toggle': (p) => {
    const group = state.optionLib.find((g) => g.id === p.groupId);
    const option = group?.options.find((o) => o.id === p.optionId);
    if (option) option.checked = !option.checked;
    return { ok: true };
  },

  'GET /merchant/categories': (): CategoryRow[] => state.categoryRows,

  'POST /merchant/categories/move': (p) => {
    const from = Number(p.from);
    const to = Number(p.to);
    const list = [...state.categoryRows];
    if (from < 0 || to < 0 || from >= list.length || to >= list.length) return { ok: false };
    // 置顶的自动聚合分类不参与排序
    if (list[from].pinned || list[to].pinned) return { ok: false };
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    state.categoryRows = list;
    return { ok: true };
  },

  'POST /merchant/categories/save': (p) => {
    const id = String(p.id || '');
    const name = String(p.name || '');
    const hit = state.categoryRows.find((c) => c.id === id);
    if (hit) {
      hit.name = name;
    } else {
      state.categoryRows.push({
        id: `c_${state.categoryRows.length + 1}`,
        name,
        sub: '0 个商品',
        pinned: false,
        hidden: true,
      });
    }
    return { ok: true };
  },

  'GET /merchant/stock': () => ({
    list: state.stockGoods,
    counts: {
      all: state.stockGoods.length,
      onSale: state.stockGoods.filter((g) => g.available).length,
      soldOut: state.stockGoods.filter((g) => !g.available).length,
    },
  }),

  'POST /merchant/stock/toggle': (p) => {
    const goods = state.stockGoods.find((g) => g.id === p.id);
    if (goods) {
      goods.available = !goods.available;
      if (goods.available && goods.remain === 0) goods.remain = 10;
      if (!goods.available) goods.remain = 0;
    }
    return { ok: true };
  },

  'POST /merchant/stock/restore-all': () => {
    state.stockGoods.forEach((g) => {
      if (!g.available) {
        g.available = true;
        g.remain = 10;
      }
    });
    return { ok: true };
  },

  'GET /merchant/goods/bulk': (p) => {
    const tab = (p.tab as BulkTab) || 'all';
    const all = state.bulkGoods;
    const list: BulkGoods[] =
      tab === 'off'
        ? all.filter((g) => g.offShelf)
        : tab === 'soldOut'
          ? all.filter((g) => !g.offShelf).slice(0, 2)
          : tab === 'hot'
            ? all.slice(0, 3)
            : all;
    return {
      list,
      counts: {
        all: all.length,
        hot: 3,
        off: all.filter((g) => g.offShelf).length,
        soldOut: state.stockGoods.filter((g) => !g.available).length,
      },
    };
  },

  'POST /merchant/goods/bulk-action': (p) => {
    const ids = (p.ids as string[]) || [];
    const action = String(p.action || '');
    if (action === 'delete') {
      state.bulkGoods = state.bulkGoods.filter((g) => ids.indexOf(g.id) < 0);
    } else if (action === 'on' || action === 'off') {
      state.bulkGoods.forEach((g) => {
        if (ids.indexOf(g.id) >= 0) g.offShelf = action === 'off';
      });
    }
    return { ok: true, count: ids.length };
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
