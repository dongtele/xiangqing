import * as db from './db';
import { HOT_CATEGORY_ID } from './db';
import { MOCK_LATENCY, PAY_FAIL_FIRST_ATTEMPT } from './config';
import type {
  AddressFull,
  AftersaleItem,
  AftersaleOptions,
  AftersaleType,
  AreaShape,
  AuditState,
  BulkGoods,
  BulkTab,
  BusinessSettings,
  CartItem,
  CategoryRow,
  CheckoutTrial,
  Coupon,
  CouponRule,
  CouponTab,
  CustomerOrderTab,
  DeliverySettings,
  DeliveryTrack,
  DeliveryType,
  DeviceSettings,
  ExceptionOrder,
  ExceptionTab,
  Goods,
  GoodsDraft,
  InvoiceTitle,
  MenuGroup,
  MerchantOrder,
  MerchantOrderTab,
  MessageDetail,
  OnboardForm,
  Order,
  PrintSettings,
  ProfileForm,
  PromotionDraft,
  RankRange,
  ReceiptPreview,
  ReceiptType,
  Refund,
  RefundTrial,
  RiderMessage,
  Shop,
  ShopCouponDraft,
  ShopProfileForm,
  StaffPermission,
  StaffRole,
  SupportMessage,
  VerifyLogTab,
  VerifyPreview,
  VerifyRecord,
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
  addresses: db.addresses.map((a) => ({ ...a })),
  reviews: db.reviews.map((r) => ({ ...r })),
  myReviews: db.myReviews.map((r) => ({ ...r })),
  invoiceTitles: db.invoiceTitles.map((t) => ({ ...t })),
  supportMessages: db.supportMessages.map((m) => ({ ...m })),
  categoryRows: db.categoryRows.map((c) => ({ ...c })),
  stockGoods: db.stockGoods.map((g) => ({ ...g })),
  bulkGoods: db.bulkGoods.map((g) => ({ ...g })),
  /** 11 编辑商品的草稿副本，保存后写回 goodsList / merchantGoods */
  profileForm: { ...db.profileForm, tastes: db.profileForm.tastes.map((t) => ({ ...t })) },
  messages: db.messages.map((m) => ({ ...m })),
  coupons: {
    usable: db.coupons.usable.map((c) => ({ ...c })),
    used: db.coupons.used.map((c) => ({ ...c })),
    expired: db.coupons.expired.map((c) => ({ ...c })),
  } as Record<CouponTab, Coupon[]>,
  couponOffers: db.couponOffers.map((o) => ({ ...o })),
  memberCenter: { ...db.memberCenter, tasks: db.memberCenter.tasks.map((t) => ({ ...t })) },
  notifySwitches: db.notifySwitches.map((n) => ({ ...n })),
  merchantMessages: db.merchantMessages.map((m) => ({ ...m })),
  historyOrders: db.historyOrders.map((o) => ({ ...o })),
  exceptionOrders: {
    cancel: db.exceptionOrders.cancel.map((o) => ({ ...o })),
    timeout: db.exceptionOrders.timeout.map((o) => ({ ...o })),
    delivery: db.exceptionOrders.delivery.map((o) => ({ ...o })),
  } as Record<ExceptionTab, ExceptionOrder[]>,
  verifyRecords: {
    today: db.verifyRecords.today.map((r) => ({ ...r })),
    yesterday: db.verifyRecords.yesterday.map((r) => ({ ...r })),
    week: db.verifyRecords.week.map((r) => ({ ...r })),
  } as Record<VerifyLogTab, VerifyRecord[]>,
  deviceSettings: {
    ...db.deviceSettings,
    devices: db.deviceSettings.devices.map((d) => ({ ...d })),
  },
  promotions: db.promotions.map((p) => ({ ...p })),
  promoGoods: db.promoGoods.map((g) => ({ ...g })),
  promoGoodsText: '全部商品',
  marketingCenter: {
    ...db.marketingCenter,
    activities: db.marketingCenter.activities.map((a) => ({ ...a })),
  },
  merchantReviews: db.merchantReviews.map((r) => ({ ...r })),
  settlement: { ...db.settlement, rows: db.settlement.rows.map((r) => ({ ...r })) },
  businessSettings: {
    ...db.businessSettings,
    slots: db.businessSettings.slots.map((x) => ({ ...x })),
    restDays: [...db.businessSettings.restDays],
  },
  deliverySettings: { ...db.deliverySettings },
  deliveryArea: { ...db.deliveryArea, tiers: db.deliveryArea.tiers.map((t) => ({ ...t })) },
  shopProfileForm: {
    ...db.shopProfileForm,
    rows: db.shopProfileForm.rows.map((r) => ({ ...r })),
  },
  staffList: db.staffList.map((x) => ({ ...x })),
  staffPermissions: {
    st_3: {
      ...db.staffPermissions.st_3,
      permissions: db.staffPermissions.st_3.permissions.map((x) => ({ ...x })),
    },
  } as Record<string, StaffPermission>,
  licenseCenter: {
    ...db.licenseCenter,
    docs: db.licenseCenter.docs.map((d) => ({ ...d })),
  },
  onboardForm: { ...db.onboardForm, rows: db.onboardForm.rows.map((r) => ({ ...r })), slots: db.onboardForm.slots.map((x) => ({ ...x })) },
  onboardLicense: {
    ...db.onboardLicense,
    slots: db.onboardLicense.slots.map((x) => ({ ...x })),
  },
  auditState: 'reviewing' as AuditState,
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

  /* ---------------- 浏览与选餐扩展：18 / 32 / 82 / 61 ---------------- */

  'GET /goods/search': (p) => {
    const kw = String(p.keyword || '').trim();
    const list = kw ? db.goodsList.filter((g) => g.name.indexOf(kw) >= 0) : [];
    return { list, hotWords: db.hotWords };
  },

  'GET /shop/profile': () => ({ ...db.shopProfile, open: state.shop.open }),

  'GET /shop/reviews': (p) => {
    const key = String(p.filter || 'all');
    const list =
      key === 'photo'
        ? state.reviews.filter((r) => r.photos.length > 0)
        : key === 'bad'
          ? state.reviews.filter((r) => r.stars <= 3)
          : state.reviews;
    return { summary: db.merchantReviewSummary, list };
  },

  'GET /shop/license': () => db.licenseInfo,

  /* ---------------- 结算二级页：31 / 15 / 16 / 38 / 52 / 83 ---------------- */

  'GET /remark/options': () => db.remarkOptions,

  'GET /address/list': () => state.addresses,

  'GET /address/detail': (p) => state.addresses.find((a) => a.id === p.id) || null,

  'POST /address/save': (p) => {
    const patch = p as unknown as AddressFull;
    const detail = `${patch.poi}${patch.houseNo}`;
    const hit = state.addresses.find((a) => a.id === patch.id);
    if (hit) {
      Object.assign(hit, patch, { detail });
    } else {
      state.addresses.push({
        ...patch,
        id: `addr_${state.addresses.length + 1}`,
        detail,
        distanceText: '距店 1.5km',
        outOfRange: false,
      });
    }
    if (patch.isDefault) {
      state.addresses.forEach((a) => {
        a.isDefault = a.id === (hit ? hit.id : state.addresses[state.addresses.length - 1].id);
      });
    }
    return { ok: true };
  },

  'POST /address/remove': (p) => {
    state.addresses = state.addresses.filter((a) => a.id !== p.id);
    return { ok: true };
  },

  'POST /address/default': (p) => {
    state.addresses.forEach((a) => {
      a.isDefault = a.id === p.id;
    });
    return { ok: true };
  },

  'GET /map/pois': () => db.pois,

  'GET /pickup/stores': () => db.pickupStores,

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

  /* ---------------- 取餐 / 评价 / 发票 / 客服 ---------------- */

  'GET /order/pickup-code': (p) => {
    const order = state.orders.find((o) => o.id === p.id);
    if (!order || !order.pickupCode) return null;
    return {
      code: order.pickupCode,
      qrData: `WWF-${order.orderNo}-${order.pickupCode}`,
      orderNo: order.orderNo,
      itemsText: `${order.items.map((i) => `${i.name} x${i.qty}`).join('、')} · 共￥${(
        order.payable / 100
      ).toFixed(0)}`,
      statusTitle: '备餐完成，请到店取餐',
      statusSub: '向店员出示此码，或报 4 位取餐码',
      waitText: '尽快取餐（已出餐 5 分钟）',
      shopName: state.shop.name,
      shopAddress: db.shopProfile.addressText,
      shopDistance: state.shop.distanceText,
    };
  },

  'GET /comment/options': () => db.commentOptions,

  'POST /comment/submit': (p) => {
    const order = state.orders.find((o) => o.id === p.orderId);
    if (order) {
      order.status = 'commented';
      order.statusText = '已评价';
      order.statusTone = 'weak';
      order.actions = [{ key: 'again', text: '再来一单', style: 'outline' }];
    }
    state.myReviews = [
      {
        id: `mr_${state.myReviews.length + 1}`,
        name: '我',
        avatarText: '王',
        anonymous: !!p.anonymous,
        stars: Number(p.stars || 5),
        dateText: '今天',
        text: String(p.text || ''),
        photos: (p.photos as string[]) || [],
        canAppend: true,
      },
      ...state.myReviews,
    ];
    return { ok: true };
  },

  'GET /comment/mine': () => ({
    list: state.myReviews,
    counts: {
      todo: customerOrders('toComment').length,
      done: state.myReviews.length,
    },
  }),

  'POST /comment/remove': (p) => {
    state.myReviews = state.myReviews.filter((r) => r.id !== p.id);
    return { ok: true };
  },

  'GET /invoice/options': () => db.invoiceOptions,

  'GET /invoice/titles': (): InvoiceTitle[] => state.invoiceTitles,

  'POST /invoice/title/default': (p) => {
    state.invoiceTitles.forEach((t) => {
      t.isDefault = t.id === p.id;
    });
    return { ok: true };
  },

  'POST /invoice/title/remove': (p) => {
    state.invoiceTitles = state.invoiceTitles.filter((t) => t.id !== p.id);
    return { ok: true };
  },

  'POST /invoice/apply': () => ({ ok: true }),

  'GET /support/chat': () => ({
    messages: state.supportMessages,
    quickReplies: db.supportQuickReplies,
  }),

  'POST /support/send': (p) => {
    const msg: SupportMessage = {
      id: `sm_${state.supportMessages.length + 1}`,
      from: 'me',
      kind: 'text',
      text: String(p.text || ''),
    };
    state.supportMessages = [...state.supportMessages, msg];
    return { messages: state.supportMessages };
  },

  'GET /help/center': () => db.helpCenter,

  'GET /feedback/options': () => db.feedbackOptions,

  'POST /feedback/submit': () => ({ ok: true }),

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

  /* ---------------- 卡券会员与设置账号：73 37 86 17/39 59 79 80 81 44 74 75 78 ---------------- */

  'GET /customer/profile-form': () => state.profileForm,

  'POST /customer/profile-form': (p) => {
    state.profileForm = { ...state.profileForm, ...(p as Partial<ProfileForm>) };
    return { ok: true };
  },

  'POST /customer/profile-form/taste': (p) => {
    const taste = state.profileForm.tastes.find((t) => t.key === p.key);
    if (taste) taste.on = !taste.on;
    return { ok: true };
  },

  'GET /customer/messages': (p) => {
    const tab = String(p.tab || 'all');
    const list = tab === 'all' ? state.messages : state.messages.filter((m) => m.tab === tab);
    return {
      list,
      counts: {
        all: state.messages.length,
        order: state.messages.filter((m) => m.tab === 'order').length,
        promo: state.messages.filter((m) => m.tab === 'promo').length,
      },
      unread: state.messages.filter((m) => m.unread).length,
    };
  },

  'POST /customer/messages/read-all': () => {
    state.messages.forEach((m) => {
      m.unread = false;
    });
    return { ok: true };
  },

  'GET /customer/message-detail': (p) => {
    const msg = state.messages.find((m) => m.id === p.id);
    if (msg) msg.unread = false;
    return (db.messageDetails[String(p.id)] as MessageDetail) || null;
  },

  'GET /customer/coupons': (p) => {
    const tab = (p.tab || 'usable') as CouponTab;
    return {
      list: state.coupons[tab] || [],
      counts: {
        usable: state.coupons.usable.length,
        used: state.coupons.used.length,
        expired: state.coupons.expired.length,
      },
    };
  },

  'GET /customer/coupon-rule': (p) => (db.couponRules[String(p.id)] as CouponRule) || null,

  'POST /customer/coupons/redeem': (p) => {
    const code = String(p.code || '').trim();
    if (!code) return { ok: false, message: '请输入兑换码' };
    if (code.toUpperCase() !== 'MWF2026') return { ok: false, message: '兑换码无效或已被使用' };
    state.coupons.usable = [
      {
        id: `cp_redeem_${Date.now()}`,
        kind: 'cash',
        amount: 800,
        amountText: '8',
        thresholdText: '满 40 元可用',
        name: '兑换码专享券',
        validText: '全店通用 · 领取后 7 天内有效',
        note: '兑换成功',
        noteTone: 'primary',
        tone: 'main',
      },
      ...state.coupons.usable,
    ];
    return { ok: true, message: '兑换成功，已存入卡券包' };
  },

  'GET /customer/coupon-center': (p) => {
    const tab = String(p.tab || 'shop');
    return {
      pack: db.couponPack,
      list: state.couponOffers.filter((o) => o.tab === tab),
    };
  },

  'POST /customer/coupon-center/take': (p) => {
    const offer = state.couponOffers.find((o) => o.id === p.id);
    if (!offer) return { ok: false, message: '优惠券不存在' };
    if (offer.state === 'soldout') return { ok: false, message: '今日已领完' };
    if (offer.state === 'taken') return { ok: false, message: '已领取过该券' };
    offer.state = 'taken';
    state.coupons.usable = [
      ...state.coupons.usable,
      {
        id: `cp_${offer.id}`,
        kind: offer.amountText.indexOf('折') >= 0 ? 'discount' : 'cash',
        amount: 0,
        amountText: offer.amountText,
        thresholdText: offer.thresholdText,
        name: offer.name,
        validText: offer.desc,
        note: '刚刚领取',
        noteTone: 'primary',
        tone: offer.tone === 'grey' ? 'light' : 'main',
      },
    ];
    return { ok: true, message: '领取成功，已存入卡券包' };
  },

  'POST /customer/coupon-center/take-pack': () => {
    let taken = 0;
    state.couponOffers.forEach((o) => {
      if (o.tab === 'shop' && o.state === 'take') {
        o.state = 'taken';
        taken += 1;
      }
    });
    return taken
      ? { ok: true, message: `已领取 ${taken} 张券` }
      : { ok: false, message: '礼包已领完' };
  },

  'GET /customer/member': () => state.memberCenter,

  'POST /customer/member/signin': () => {
    const task = state.memberCenter.tasks.find((t) => t.key === 'signin');
    if (!task || task.done) return { ok: false, message: '今日已签到' };
    task.done = true;
    task.btnText = '已签到';
    return { ok: true, message: '签到成功 +8 积分' };
  },

  'GET /customer/points-goods': (p) => {
    const tab = String(p.tab || 'all');
    return {
      points: state.memberCenter.pointsText,
      list: tab === 'all' ? db.pointsGoods : db.pointsGoods.filter((g) => g.tab === tab),
    };
  },

  'POST /customer/points-goods/redeem': (p) => {
    const goods = db.pointsGoods.find((g) => g.id === p.id);
    if (!goods) return { ok: false, message: '商品不存在' };
    if (!goods.affordable) return { ok: false, message: '积分不足' };
    return { ok: true, message: `已兑换「${goods.name}」` };
  },

  'GET /customer/settings': () => db.settingsInfo,

  'GET /customer/account-security': () => db.accountSecurity,

  'GET /customer/notify-settings': () => state.notifySwitches,

  'POST /customer/notify-settings': (p) => {
    const item = state.notifySwitches.find((n) => n.key === p.key);
    if (item) item.on = p.on as boolean;
    return { ok: true };
  },

  'GET /customer/about': () => db.aboutInfo,

  /* ---------------- 商家端接单扩展与营销评价：21 45 91 92 96 97 23 65 66 94 95 47 90 ---------------- */

  'GET /merchant/verify/preview': (p) => {
    const code = String(p.code || '').toUpperCase();
    return (db.verifyPreviews[code] as VerifyPreview) || null;
  },

  'POST /merchant/verify': (p) => {
    const code = String(p.code || '').toUpperCase();
    if (!db.verifyPreviews[code]) return { ok: false, message: '取餐码不存在或已核销' };
    state.verifyRecords.today = [
      {
        id: `v_${Date.now()}`,
        code,
        title: `${db.verifyPreviews[code].orderNo} · ${db.verifyPreviews[code].customer}`,
        metaText: '刚刚核销 · 店员 小陈',
        amountText: db.verifyPreviews[code].amountText,
        state: 'done',
      },
      ...state.verifyRecords.today,
    ];
    return { ok: true, message: `核销成功 · ${db.verifyPreviews[code].orderNo}` };
  },

  'GET /merchant/messages': () => {
    const pending = state.merchantMessages.filter((m) => m.actionable);
    const orders = pending.filter((m) => m.kind === 'order').length;
    const refunds = pending.filter((m) => m.kind === 'refund').length;
    return {
      list: state.merchantMessages,
      summary: pending.length
        ? `${pending.length} 条待处理：${orders} 个新订单 · ${refunds} 个退款申请`
        : '暂无待处理消息',
    };
  },

  'POST /merchant/messages/ignore': (p) => {
    state.merchantMessages = state.merchantMessages.filter((m) => m.id !== p.id);
    return { ok: true };
  },

  'GET /merchant/orders/history': (p) => {
    const kw = String(p.keyword || '').trim();
    const list = kw
      ? state.historyOrders.filter(
          (o) => o.orderNo.indexOf(kw) >= 0 || o.itemsText.indexOf(kw) >= 0
        )
      : state.historyOrders;
    return { list, filter: db.historyFilter, summary: db.historySummary };
  },

  'GET /merchant/orders/exception': (p) => {
    const tab = (p.tab || 'cancel') as ExceptionTab;
    return {
      list: state.exceptionOrders[tab] || [],
      counts: {
        cancel: state.exceptionOrders.cancel.filter((o) => !o.resolved).length,
        timeout: state.exceptionOrders.timeout.filter((o) => !o.resolved).length,
        delivery: state.exceptionOrders.delivery.filter((o) => !o.resolved).length,
      },
    };
  },

  'POST /merchant/orders/exception/resolve': (p) => {
    const tab = (p.tab || 'cancel') as ExceptionTab;
    const order = state.exceptionOrders[tab].find((o) => o.id === p.id);
    if (!order) return { ok: false, message: '订单不存在' };
    const agree = p.action === 'agree';
    order.resolved = true;
    order.stageText = '已处理';
    order.stageTone = 'done';
    order.resolveText = agree
      ? `刚刚同意取消 · 全额退款 ￥${order.amountText}`
      : '刚刚拒绝取消 · 已提交凭证，平台仲裁中';
    return { ok: true, message: agree ? '已同意取消' : '已提交凭证，等待平台仲裁' };
  },

  'GET /merchant/verify/log': (p) => {
    const tab = (p.tab || 'today') as VerifyLogTab;
    return { stats: db.verifyStats, list: state.verifyRecords[tab] || [] };
  },

  'POST /merchant/verify/urge': (p) => {
    const record = state.verifyRecords.today.find((r) => r.id === p.id);
    return record
      ? { ok: true, message: `已提醒顾客取餐（${record.code}）` }
      : { ok: false, message: '记录不存在' };
  },

  'GET /merchant/devices': () => state.deviceSettings,

  'POST /merchant/devices/update': (p) => {
    state.deviceSettings = { ...state.deviceSettings, ...(p as Partial<DeviceSettings>) };
    return { ok: true };
  },

  'POST /merchant/devices/action': (p) => {
    const device = state.deviceSettings.devices.find((d) => d.id === p.id);
    if (!device) return { ok: false, message: '设备不存在' };
    if (device.online) return { ok: true, message: `已向${device.name}发送测试小票` };
    device.online = true;
    device.statusText = '已重连 · 纸量充足';
    device.actionText = '测试打印';
    return { ok: true, message: `${device.name}已重连` };
  },

  'GET /merchant/promotions': () => state.promotions,

  'POST /merchant/promotions/toggle': (p) => {
    const item = state.promotions.find((x) => x.id === p.id);
    if (!item) return { ok: false, message: '活动不存在' };
    item.status = item.status === 'running' ? 'paused' : 'running';
    item.statusText = item.status === 'running' ? '生效中' : '已暂停';
    return { ok: true, message: item.status === 'running' ? '活动已开启' : '活动已暂停' };
  },

  'GET /merchant/promotion/draft': () => ({
    ...db.promotionDraft,
    tiers: db.promotionDraft.tiers.map((t) => ({ ...t })),
    goodsText: state.promoGoodsText,
  }),

  'POST /merchant/promotion/save': (p) => {
    const draft = p as unknown as PromotionDraft;
    const tierText = draft.tiers
      .map((t) => `满${t.threshold / 100}减${t.cut / 100}`)
      .join('、');
    state.promotions = [
      {
        id: `pr_${Date.now()}`,
        kindText: draft.type === 'full' ? '满减' : draft.type === 'discount' ? '折扣' : '第二份半价',
        name: tierText || '新建活动',
        statusText: '生效中',
        status: 'running',
        sub: '',
        rangeText: draft.dateText,
        stats: [
          { label: '今日使用', value: '0 次' },
          { label: '带动客单价', value: '—' },
          { label: '让利金额', value: '¥0' },
        ],
      },
      ...state.promotions,
    ];
    return { ok: true, message: '活动已创建并生效' };
  },

  'GET /merchant/promotion/goods': () => ({
    list: state.promoGoods,
    categories: [...new Set(db.promoGoods.map((g) => g.categoryName))],
  }),

  'POST /merchant/promotion/goods': (p) => {
    const ids = (p.ids || []) as string[];
    state.promoGoods.forEach((g) => {
      g.checked = ids.indexOf(g.id) >= 0;
    });
    state.promoGoodsText = ids.length === state.promoGoods.length
      ? '全部商品'
      : `已选 ${ids.length} 个商品`;
    return { ok: true };
  },

  'GET /merchant/marketing': () => state.marketingCenter,

  'POST /merchant/marketing/toggle': (p) => {
    const act = state.marketingCenter.activities.find((a) => a.id === p.id);
    if (act) act.on = p.on as boolean;
    return { ok: true };
  },

  'GET /merchant/coupon/draft': () => ({ ...db.shopCouponDraft }),

  'POST /merchant/coupon/save': (p) => {
    const draft = p as unknown as ShopCouponDraft;
    if (draft.kind === 'cash' && draft.amount >= draft.threshold && draft.threshold > 0) {
      return { ok: false, message: '优惠金额需小于使用门槛' };
    }
    return { ok: true, message: '优惠券已创建并开始发放' };
  },

  'GET /merchant/reviews': (p) => {
    const filter = String(p.filter || 'all');
    const list =
      filter === 'low' ? state.merchantReviews.filter((r) => r.lowScore) : state.merchantReviews;
    return { summary: db.merchantReviewSummary, list };
  },

  'GET /merchant/review/reply': (p) => {
    const review = state.merchantReviews.find((r) => r.id === p.id);
    if (!review) return null;
    return {
      review,
      tags: db.reviewReplyTags[review.id] || [],
      orderNo: '#20260726004',
      templates: db.reviewReplyTemplates,
      couponText: '￥10 无门槛 · 7 天有效',
    };
  },

  'POST /merchant/review/reply': (p) => {
    const review = state.merchantReviews.find((r) => r.id === p.id);
    if (!review) return { ok: false, message: '评价不存在' };
    const text = String(p.text || '').trim();
    if (!text) return { ok: false, message: '请填写回复内容' };
    review.reply = text;
    return { ok: true, message: '回复已发布，顾客可见' };
  },

  'POST /merchant/review/appeal': () => ({ ok: true, message: '申诉已提交，平台将在 24 小时内处理' }),

  /* ---------------- 商家端数据结算与店铺团队：46 87 89 34 67 88 68 50 33 70 71 35 69 72 98 ---------------- */

  'GET /merchant/stats': () => db.businessStats,

  'GET /merchant/stats/goods': (p) => {
    const range = (p.range || 'week') as RankRange;
    return db.goodsRank[range] || db.goodsRank.week;
  },

  'GET /merchant/stats/customer': () => db.customerAnalysis,

  'GET /merchant/settlement': () => state.settlement,

  'POST /merchant/settlement/withdraw': (p) => {
    const amount = Number(p.amount) || 0;
    const balance = Number(state.settlement.balanceText.replace(/,/g, ''));
    if (amount < 100) return { ok: false, message: '单笔提现最低 ￥100' };
    if (amount > balance) return { ok: false, message: '超出可提现余额' };
    const left = balance - amount;
    state.settlement.balanceText = left.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    state.settlement.rows = [
      {
        id: `s_${Date.now()}`,
        title: '提现到银行卡',
        metaText: '刚刚 · 处理中',
        amountText: amount.toFixed(2),
        income: false,
      },
      ...state.settlement.rows,
    ];
    return { ok: true, message: '提现申请已提交，预计 2 小时内到账' };
  },

  'GET /merchant/settlement/detail': () => db.settlementDetail,

  'GET /merchant/bills': (p) => {
    const tab = String(p.tab || 'all');
    return {
      ...db.bills,
      rows: tab === 'all' ? db.bills.rows : db.bills.rows.filter((r) => r.tab === tab),
    };
  },

  'GET /merchant/payout-account': () => db.payoutAccount,

  'GET /merchant/business-settings': () => state.businessSettings,

  'POST /merchant/business-settings': (p) => {
    state.businessSettings = {
      ...state.businessSettings,
      ...(p as Partial<BusinessSettings>),
    };
    return { ok: true, message: '营业设置已保存' };
  },

  'GET /merchant/delivery-settings': () => state.deliverySettings,

  'POST /merchant/delivery-settings': (p) => {
    state.deliverySettings = {
      ...state.deliverySettings,
      ...(p as Partial<DeliverySettings>),
    };
    state.shop.deliveryText = `${state.deliverySettings.radiusKm}km · 起送 ${state.deliverySettings.minOrderText}`;
    return { ok: true, message: '配送设置已保存' };
  },

  'GET /merchant/delivery-area': () => state.deliveryArea,

  'POST /merchant/delivery-area': (p) => {
    state.deliveryArea.shape = (p.shape || 'circle') as AreaShape;
    return { ok: true, message: '配送范围已保存' };
  },

  'GET /merchant/shop-profile': () => state.shopProfileForm,

  'POST /merchant/shop-profile': (p) => {
    state.shopProfileForm = {
      ...state.shopProfileForm,
      ...(p as Partial<ShopProfileForm>),
    };
    const name = state.shopProfileForm.rows.find((r) => r.key === 'name');
    if (name) state.shop.name = name.value;
    return { ok: true, message: '店铺信息已保存' };
  },

  'GET /merchant/staff': () => ({ list: state.staffList, roleDocs: db.staffRoleDocs }),

  'POST /merchant/staff/invite': () => ({
    ok: true,
    message: '邀请链接已生成，转发给员工用微信打开即可加入',
  }),

  'GET /merchant/staff/permission': (p) => {
    const id = String(p.id);
    const cached = state.staffPermissions[id];
    if (cached) return cached;
    const staff = state.staffList.find((s2) => s2.id === id);
    if (!staff) return null;
    // 没有单独配过的员工按角色模板给一份默认权限
    const base = db.staffPermissions.st_3;
    return { ...base, staff, joinedText: staff.metaText };
  },

  'POST /merchant/staff/permission': (p) => {
    const id = String(p.id);
    const current = state.staffPermissions[id];
    if (current) {
      current.permissions = (p.permissions || current.permissions) as StaffPermission['permissions'];
      const role = p.role as StaffRole | undefined;
      if (role) {
        current.staff = { ...current.staff, role };
      }
    }
    return { ok: true, message: '权限已保存' };
  },

  'POST /merchant/staff/remove': (p) => {
    state.staffList = state.staffList.filter((s2) => s2.id !== p.id);
    return { ok: true, message: '已移除该员工' };
  },

  'GET /merchant/licenses': () => db.licenseCenter,

  'POST /merchant/licenses/upload': (p) => {
    const doc = state.licenseCenter.docs.find((d) => d.id === p.id);
    if (!doc) return { ok: false, message: '证照不存在' };
    doc.status = 'normal';
    doc.statusText = '审核中';
    return { ok: true, message: '已提交，平台将在 1 个工作日内审核' };
  },

  'GET /merchant/help': () => db.merchantHelp,

  /* ---------------- 商家入驻：26 14 27 24 28 29 ---------------- */

  'GET /onboard/intro': () => db.onboardIntro,

  'GET /onboard/form': () => state.onboardForm,

  'POST /onboard/form': (p) => {
    const rows = (p.rows || []) as OnboardForm['rows'];
    const missing = rows.find((r) => !r.value);
    if (missing) return { ok: false, message: `请填写${missing.label}` };
    state.onboardForm.rows = rows;
    return { ok: true, message: '资料已保存' };
  },

  'GET /onboard/license': () => state.onboardLicense,

  'POST /onboard/license/upload': (p) => {
    const slot = state.onboardLicense.slots.find((x) => x.key === p.key);
    if (!slot) return { ok: false, message: '上传位不存在' };
    slot.path = String(p.path || 'uploaded');
    // 营业执照走 OCR，识别成功后回填公司名与信用代码
    if (slot.key === 'license') {
      slot.ocrText = '美味坊餐饮管理有限公司 · 91440300MA5XXXXXX';
      slot.hint = '识别有误可点击修改';
    }
    return { ok: true, message: slot.key === 'license' ? '识别成功' : '已上传' };
  },

  'POST /onboard/submit': () => {
    const missing = state.onboardLicense.slots.filter((x) => x.required && !x.path);
    if (missing.length) return { ok: false, message: '还有必传资质未上传' };
    state.auditState = 'reviewing';
    return { ok: true, message: '已提交审核' };
  },

  'GET /onboard/audit': (p) => {
    const forced = p.state as AuditState | undefined;
    return db.onboardAudits[forced || state.auditState];
  },

  'POST /onboard/resubmit': () => {
    state.auditState = 'reviewing';
    return { ok: true, message: '已重新提交，1–3 个工作日内出结果' };
  },

  'POST /onboard/withdraw': () => {
    state.auditState = 'reviewing';
    return { ok: true, message: '已撤回，可修改后重新提交' };
  },

  'GET /onboard/done': () => db.onboardDone,

  /** 开通成功后把当前账号标记为已认证商家，07 立刻出现「商家管理」 */
  'POST /onboard/activate': () => {
    state.auditState = 'passed';
    return { ok: true, message: '店铺已开通' };
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
