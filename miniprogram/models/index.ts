/**
 * 领域模型
 * 约定：所有金额字段一律为「分」（整数），展示时用 utils/money 转换。
 */

export type Role = 'customer' | 'merchant';

export interface UserProfile {
  openid: string;
  nickname: string;
  avatar: string;
  /** 掩码手机号，如 138****8000 */
  phoneMask: string;
  /** 是否已认证商家，决定「我的」页是否展示商家管理入口 */
  isMerchant: boolean;
}

/* ---------------- 店铺 / 商品 ---------------- */

export interface Shop {
  id: string;
  name: string;
  logo: string;
  score: number;
  monthSoldText: string;
  etaText: string;
  distanceText: string;
  /** 首页公告 / 满减提示 */
  promoTag: string;
  promoText: string;
  open: boolean;
  businessHours: string;
  deliveryText: string;
  activityText: string;
  certified: boolean;
  staffCount: number;
  newOrderAlert: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface SpecOption {
  id: string;
  name: string;
  /** 相对基础价的加价，分 */
  priceDelta: number;
}

export interface SpecGroup {
  id: string;
  name: string;
  /** 可多选（加料）/ 单选（份量、辣度） */
  multiple: boolean;
  required: boolean;
  /** 必选组的默认选项；不填则取第一项 */
  defaultOptionId?: string;
  options: SpecOption[];
}

export interface Goods {
  id: string;
  categoryId: string;
  name: string;
  desc: string;
  image: string;
  /** 基础价（最低规格价），分 */
  price: number;
  monthSold: number;
  praiseRate: number;
  stock: number;
  onSale: boolean;
  /** 角标，如 TOP 1 */
  rankTag?: string;
  /** 价格后缀，如 /杯 */
  unit?: string;
  /** 热销位次；有值即进入「热销推荐」虚拟分类 */
  hot?: number;
  specGroups: SpecGroup[];
}

/** 顾客端菜单分组 */
export interface MenuGroup {
  category: Category;
  goods: Goods[];
}

/* ---------------- 购物车 ---------------- */

export interface CartItem {
  /** goodsId + 规格指纹，用于合并同规格 */
  key: string;
  goodsId: string;
  name: string;
  image: string;
  /** 含规格加价的单价，分 */
  unitPrice: number;
  qty: number;
  /** 「大份 / 微辣」 */
  specText: string;
  specIds: string[];
  unit?: string;
}

export interface CartState {
  shopId: string;
  items: CartItem[];
  remark: string;
  deliveryType: DeliveryType;
}

/* ---------------- 结算 ---------------- */

export type DeliveryType = 'delivery' | 'pickup';

export interface Address {
  id: string;
  detail: string;
  receiver: string;
  gender: string;
  phoneMask: string;
}

/** 服务端试算结果，前端不自行计算优惠 */
export interface CheckoutTrial {
  count: number;
  itemsTotal: number;
  packFee: number;
  deliveryFee: number;
  couponId: string | null;
  couponName: string;
  couponDiscount: number;
  /** 应付金额 */
  payable: number;
  /** 已优惠合计 */
  discountTotal: number;
  etaText: string;
}

export type PayMethodId = 'wechat' | 'balance' | 'friend';

export interface PayMethod {
  id: PayMethodId;
  name: string;
  desc: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  disabled: boolean;
}

/* ---------------- 订单 ---------------- */

export type OrderStatus =
  | 'unpaid'
  | 'pending'
  | 'cooking'
  | 'delivering'
  | 'pickupReady'
  | 'done'
  | 'commented'
  | 'refunding'
  | 'cancelled';

export interface OrderGoods {
  name: string;
  image: string;
  specText: string;
  qty: number;
  /** 该行小计，分 */
  amount: number;
}

export interface TimelineNode {
  label: string;
  done: boolean;
  current: boolean;
}

export interface Rider {
  name: string;
  role: string;
  statusText: string;
  avatarText: string;
  phone: string;
}

export interface Order {
  id: string;
  orderNo: string;
  shopName: string;
  status: OrderStatus;
  statusText: string;
  /** 列表页状态色：primary / weak */
  statusTone: 'primary' | 'weak';
  deliveryType: DeliveryType;
  items: OrderGoods[];
  count: number;
  itemsTotal: number;
  packFee: number;
  deliveryFee: number;
  couponDiscount: number;
  payable: number;
  createdAt: string;
  createdAtText: string;
  /** 列表页副标题：今天 12:02 · 外送 · 预计 12:30 送达 */
  metaText: string;
  /** 完整描述：预计 12:30 送达 · 距您 1.2km */
  etaText: string;
  /** 只有时间点：今天 12:30，用于结果页「预计送达」右值 */
  etaTimeText: string;
  pickupCode?: string;
  address?: Address;
  rider?: Rider;
  payMethodText: string;
  /** 下单备注（口味 / 餐具 / 自定义） */
  remark?: string;
  timeline: TimelineNode[];
  /** 列表页操作按钮 */
  actions: OrderAction[];
}

export interface OrderAction {
  key: 'again' | 'progress' | 'comment' | 'pay' | 'aftersale';
  text: string;
  style: 'outline' | 'primary' | 'outline-primary';
}

export type CustomerOrderTab = 'all' | 'ongoing' | 'toComment' | 'aftersale';

/* ---------------- 商家端 ---------------- */

export interface DashboardMetric {
  label: string;
  value: string;
  delta: string;
  deltaTone: 'up' | 'flat';
}

export interface DashboardTodo {
  label: string;
  value: number;
  highlight: boolean;
}

export interface TrendBar {
  label: string;
  /** 0–100 百分比高度 */
  percent: number;
  tone: 'weak' | 'mid' | 'today';
}

export interface HotGoods {
  rank: number;
  name: string;
  countText: string;
}

export interface Dashboard {
  shopName: string;
  scoreText: string;
  open: boolean;
  todos: DashboardTodo[];
  metrics: DashboardMetric[];
  trend: TrendBar[];
  hot: HotGoods[];
}

export type MerchantOrderTab = 'pending' | 'ongoing' | 'done' | 'aftersale';

export interface MerchantOrder {
  id: string;
  seq: string;
  channel: '外送' | '自提';
  status: MerchantOrderTab;
  statusText: string;
  /** 待接单倒计时剩余秒数 */
  countdown?: number;
  countdownText?: string;
  customerName: string;
  customerPhone: string;
  addressText?: string;
  distanceText?: string;
  pickupCode?: string;
  items: { name: string; qty: number }[];
  count: number;
  total: number;
  /** 自提单的紧凑摘要行 */
  summaryText?: string;
}

export interface MerchantGoods {
  id: string;
  name: string;
  image: string;
  categoryName: string;
  price: number;
  priceFrom: boolean;
  stock: number;
  specCountText: string;
  onSale: boolean;
  /** none / low / out */
  stockLevel: 'normal' | 'low' | 'out';
}
