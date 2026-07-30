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
  /** 王师傅 · 浙A·D3821 */
  titleText: string;
  /** 已服务 1,204 单 · 准时率 98% */
  creditText: string;
  /** 虚拟号，订单完成后失效 */
  virtualPhone: string;
}

/* ---------------- 配送追踪 / 联系骑手 ---------------- */

export interface TrackPoint {
  /** 百分比坐标，用于示意底图；接腾讯位置服务后换成经纬度 */
  left: number;
  top: number;
}

export interface DeliveryTrack {
  etaText: string;
  subText: string;
  /** 0–100 */
  percent: number;
  stages: string[];
  activeStage: number;
  rider: Rider;
  shopPoint: TrackPoint;
  userPoint: TrackPoint;
  /** 骑手轨迹折线（SVG path，示意用） */
  routePath: string;
}

export interface RiderMessage {
  id: string;
  from: 'rider' | 'me';
  text: string;
  /** 有值时在气泡上方显示时间胶囊 */
  timeText?: string;
}

/* ---------------- 售后 / 退款 ---------------- */

export type AftersaleType = 'refundOnly' | 'refundCompensate';

export interface AftersaleItem {
  key: string;
  name: string;
  specText: string;
  qty: number;
  /** 该行实付，分 */
  amount: number;
  image: string;
  checked: boolean;
}

export interface AftersaleOptions {
  orderNo: string;
  orderTitle: string;
  orderMetaText: string;
  orderImage: string;
  /** 整单实付，分 */
  payable: number;
  types: { id: AftersaleType; name: string; sub: string }[];
  reasons: string[];
  items: AftersaleItem[];
  tip: string;
  /** 已出餐提示（56 顶部） */
  partialTip: string;
}

/** 退款试算：按实付比例分摊优惠 */
export interface RefundTrial {
  itemsAmount: number;
  couponShare: number;
  refundAmount: number;
}

export type RefundStatus = 'reviewing' | 'agreed' | 'rejected' | 'cancelled';

export interface Refund {
  id: string;
  orderId: string;
  orderNo: string;
  status: RefundStatus;
  statusText: string;
  statusSub: string;
  type: AftersaleType;
  typeText: string;
  amount: number;
  itemsText: string;
  reasonText: string;
  desc: string;
  photos: string[];
  items: AftersaleItem[];
  createdAtText: string;
  /** 商家侧倒计时（秒），超时自动同意 */
  autoAgreeIn: number;
  timeline: { title: string; sub: string; done: boolean }[];
  /** 商家侧展示的顾客下单时间 */
  placedAtText: string;
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

export interface MerchantOrderLine {
  name: string;
  specText: string;
  qty: number;
  /** 该行小计，分 */
  amount: number;
  image: string;
}

export interface MerchantOrder {
  id: string;
  seq: string;
  channel: '外送' | '自提';
  status: MerchantOrderTab;
  statusText: string;
  /** 待接单倒计时剩余秒数 */
  countdown?: number;
  /** 列表页倒计时文案 */
  countdownText?: string;
  /** 详情页倒计时文案（超时后自动拒单） */
  detailCountdownText?: string;
  customerName: string;
  customerPhone: string;
  addressText?: string;
  distanceText?: string;
  /** 2.1 km · 预计 25 分钟 */
  distanceEtaText?: string;
  pickupCode?: string;
  lines: MerchantOrderLine[];
  count: number;
  total: number;
  /** 下单 12:41 */
  placedAtText: string;
  /** 立即送出 / 12:30 前送达 */
  expectText: string;
  /** 第 3 单（回头客提示） */
  customerSeqText: string;
  remark?: string;
  /** 自提单的紧凑摘要行 */
  summaryText?: string;
  /** 售后单关联（status = aftersale 时有值） */
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
}

/* ---------------- 商家端 · 小票打印 ---------------- */

export interface PrinterDevice {
  id: string;
  name: string;
  online: boolean;
  /** 在线 · 蓝牙已连接 */
  statusText: string;
}

export interface PrintSettings {
  device: PrinterDevice;
  autoPrint: boolean;
  copies: number;
  copiesText: string;
  width: string;
  printRemark: boolean;
}

export type ReceiptType = 'kitchen' | 'customer';

export interface ReceiptLine {
  text: string;
  qty: string;
}

export interface ReceiptPreview {
  type: ReceiptType;
  title: string;
  meta: string;
  lines: ReceiptLine[];
  remark?: string;
  /** 顾客联的金额区 */
  amounts: { label: string; value: string }[];
  footer?: string;
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
