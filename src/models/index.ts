/**
 * 领域模型
 * 约定：所有金额字段一律为「分」（整数），展示时用 utils/money 转换。
 * 当前覆盖交付文档「实现建议顺序」第 1–2 步所需的实体；第 3 步起按需扩充。
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

/** 完整地址（15 / 16 / 38），Address 是它在订单里的精简投影 */
export interface AddressFull {
  id: string;
  /** 家 / 公司 / 学校 */
  tag: string;
  receiver: string;
  gender: string;
  phone: string;
  phoneMask: string;
  /** 地图选点得到的 POI */
  poi: string;
  /** 门牌号 */
  houseNo: string;
  /** poi + houseNo 拼出的完整地址 */
  detail: string;
  isDefault: boolean;
  distanceText: string;
  /** 超出配送范围时不可选 */
  outOfRange: boolean;
  latitude: number;
  longitude: number;
}

/** 52 地图选点的候选 POI */
export interface PoiItem {
  id: string;
  name: string;
  districtText: string;
  distanceText: string;
  latitude: number;
  longitude: number;
}

/** 83 自提门店 */
export interface PickupStore {
  id: string;
  name: string;
  open: boolean;
  addressText: string;
  distanceText: string;
  /** 预计 15 分钟可取 / 明日 10:00 开始接单 */
  etaText: string;
  hoursText: string;
  latitude: number;
  longitude: number;
}

/** 31 订单备注 */
export interface RemarkOptions {
  quick: string[];
  maxLength: number;
}

/* ---------------- 店铺主页 / 评价 / 资质 ---------------- */

export interface ShopProfile {
  name: string;
  logo: string;
  headerImage: string;
  score: number;
  categoryText: string;
  badges: { text: string; tone: 'primary' | 'success' | 'grey' }[];
  notice: string;
  hoursText: string;
  open: boolean;
  addressText: string;
  phone: string;
  licenseText: string;
  reviewCount: number;
  reviewTagText: string;
}

export interface ReviewDim {
  label: string;
  value: number;
  /** 0–100 */
  percent: number;
}

export interface ReviewFilter {
  key: string;
  label: string;
  count: number;
}

export interface Review {
  id: string;
  name: string;
  avatarText: string;
  anonymous: boolean;
  stars: number;
  dateText: string;
  text: string;
  photos: string[];
  reply?: string;
  repeatText?: string;
}

export interface ReviewSummary {
  score: number;
  total: number;
  dims: ReviewDim[];
  filters: ReviewFilter[];
}

export interface LicenseDoc {
  title: string;
  image: string;
  noLabel: string;
  no: string;
  validText: string;
}

export interface LicenseInfo {
  shopName: string;
  companyName: string;
  logo: string;
  docs: LicenseDoc[];
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
  /** 经纬度，给 <map> 组件用（接入腾讯位置服务后即为真实坐标） */
  latitude: number;
  longitude: number;
  /** 百分比坐标，无地图 key 时降级用示意底图定位 */
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

export interface OrderAction {
  key: 'again' | 'progress' | 'comment' | 'pay' | 'aftersale';
  text: string;
  style: 'outline' | 'primary' | 'outline-primary';
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

export type CustomerOrderTab = 'all' | 'ongoing' | 'toComment' | 'aftersale';

/* ---------------- 取餐 / 评价 / 发票 / 客服 ---------------- */

/** 25 自提取餐码 */
export interface PickupCodeInfo {
  code: string;
  /** 二维码里编码的内容 */
  qrData: string;
  orderNo: string;
  itemsText: string;
  statusTitle: string;
  statusSub: string;
  waitText: string;
  shopName: string;
  shopAddress: string;
  shopDistance: string;
}

/** 19 / 55 评价编辑 */
export interface CommentOptions {
  orderNo: string;
  shopName: string;
  shopLogo: string;
  orderMetaText: string;
  /** 5 → 非常满意 */
  ratingLabels: string[];
  tags: string[];
  maxLength: number;
  maxPhotos: number;
  rewardText: string;
}

export type MyReviewTab = 'todo' | 'done';

/** 60 我的评价 */
export interface MyReview extends Review {
  canAppend: boolean;
}

/** 58 发票抬头 */
export interface InvoiceTitle {
  id: string;
  type: 'company' | 'personal';
  typeText: string;
  name: string;
  taxNo: string;
  isDefault: boolean;
}

/** 57 申请发票 */
export interface InvoiceOptions {
  orderNo: string;
  /** 开票金额，分 */
  amount: number;
  invoiceTypeText: string;
  email: string;
  tip: string;
}

/** 41 在线客服的一条消息 */
export interface SupportMessage {
  id: string;
  from: 'agent' | 'me';
  /** text 普通气泡；order 订单卡片 */
  kind: 'text' | 'order';
  text: string;
  timeText?: string;
  order?: { orderNo: string; summary: string; image: string };
}

/** 77 帮助中心 */
export interface HelpScene {
  key: string;
  label: string;
  icon: string;
}

export interface HelpCenterInfo {
  scenes: HelpScene[];
  faqs: { id: string; question: string; answer: string }[];
}

/** 76 意见反馈 */
export interface FeedbackOptions {
  types: string[];
  orderNo: string;
  phoneMask: string;
  maxLength: number;
  minLength: number;
}

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

/* ---------------- 商家端 · 商品与菜单 ---------------- */

/** 11 编辑商品的可编辑副本 */
export interface GoodsDraft {
  id: string;
  name: string;
  categoryName: string;
  /** 基础价，分 */
  price: number;
  stock: number;
  images: string[];
  onSale: boolean;
  specGroups: SpecGroup[];
}

/** 64 规格与加料选项库：可复用的选项组 */
export interface OptionLibGroup {
  id: string;
  name: string;
  multiple: boolean;
  required: boolean;
  /** 单选 · 必选 · 已用于 18 个商品 */
  metaText: string;
  options: { id: string; name: string; priceDelta: number; checked: boolean }[];
}

/** 22 分类管理 */
export interface CategoryRow {
  id: string;
  name: string;
  sub: string;
  /** 热销推荐这类自动聚合分类不可删改 */
  pinned: boolean;
  /** 分类内无在售商品，顾客端自动隐藏 */
  hidden: boolean;
}

/** 49 沽清与库存 */
export interface StockGoods {
  id: string;
  name: string;
  image: string;
  categoryName: string;
  /** 今日已售 38 */
  soldTodayText: string;
  remain: number;
  /** false = 已沽清 */
  available: boolean;
}

export type StockTab = 'all' | 'onSale' | 'soldOut';

/** 93 商品批量管理 */
export interface BulkGoods {
  id: string;
  name: string;
  image: string;
  /** 热菜 · ￥28.00 · 月售 186 */
  metaText: string;
  offShelf: boolean;
}

export type BulkTab = 'all' | 'hot' | 'off' | 'soldOut';

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
  stockLevel: 'normal' | 'low' | 'out';
}

/* ================= 顾客端 · 卡券会员与设置账号（73 37 86 17/39 59 79 80 81 44 74 75 78） ================= */

/** 73 个人资料 */
export interface ProfileForm {
  avatar: string;
  nickname: string;
  gender: 'male' | 'female' | 'unknown';
  genderText: string;
  birthday: string;
  phoneMask: string;
  /** 口味偏好，下单时自动带进订单备注（与 31 备注浮层共用一套 key） */
  tastes: { key: string; label: string; on: boolean }[];
}

/** 37 消息通知 */
export type MessageTab = 'all' | 'order' | 'promo';

export interface MessageItem {
  id: string;
  tab: Exclude<MessageTab, 'all'>;
  /** wf-icon 名 */
  icon: string;
  tone: 'primary' | 'success';
  title: string;
  desc: string;
  timeText: string;
  unread: boolean;
}

/** 86 通知详情 */
export interface MessageDetail {
  id: string;
  categoryText: string;
  title: string;
  timeText: string;
  /** 段落数组，避免在模板里塞 <br> */
  paragraphs: string[];
  order: { id: string; shopName: string; summary: string; image: string } | null;
  actions: { key: string; text: string; style: 'primary' | 'ghost' }[];
  footText: string;
}

/** 17 / 39 我的优惠券 */
export type CouponTab = 'usable' | 'used' | 'expired';

export interface Coupon {
  id: string;
  /** cash = 满减/无门槛，discount = 折扣券 */
  kind: 'cash' | 'discount';
  /** 面额（分）；折扣券此处存折扣值 ×10（88 = 8.8 折），只用于排序 */
  amount: number;
  /** 卡头大字：10 / 8.8折 */
  amountText: string;
  /** 满50可用 / 无门槛 / 上限 ¥15 */
  thresholdText: string;
  name: string;
  validText: string;
  /** 「还差 ¥0 可用 · 结算自动抵扣」这类补充说明 */
  note: string;
  noteTone: 'primary' | 'warn' | 'danger' | 'weak';
  /** 卡头配色 */
  tone: 'main' | 'light' | 'green' | 'grey';
}

/** 59 优惠券使用规则（39 上的半屏浮层） */
export interface CouponRule {
  couponId: string;
  rangeText: string;
  rows: { label: string; value: string }[];
  terms: string[];
}

/** 79 领券中心 */
export type CouponCenterTab = 'shop' | 'platform' | 'points';

export interface CouponOffer {
  id: string;
  tab: CouponCenterTab;
  amountText: string;
  thresholdText: string;
  name: string;
  desc: string;
  tone: 'main' | 'gold' | 'green' | 'grey';
  state: 'take' | 'taken' | 'soldout';
}

export interface CouponPack {
  title: string;
  sub: string;
}

/** 80 会员积分中心 */
export interface MemberCenter {
  levelName: string;
  levelText: string;
  pointsText: string;
  /** 升级进度 0–100 */
  progress: number;
  upgradeText: string;
  todayText: string;
  tasks: { key: string; name: string; sub: string; btnText: string; done: boolean }[];
  rows: { key: string; label: string; value: string; tone: 'weak' | 'primary' }[];
}

/** 81 积分兑换 */
export type PointsGoodsTab = 'all' | 'coupon' | 'dish' | 'gift';

export interface PointsGoods {
  id: string;
  tab: Exclude<PointsGoodsTab, 'all'>;
  name: string;
  image: string;
  sub: string;
  costText: string;
  /** 积分足够才可兑换 */
  affordable: boolean;
  /** 不足时显示「差一点」，并在 sub 里说明还差多少 */
  shortText: string;
}

/** 44 设置与关于 */
export interface SettingsInfo {
  rows: { key: string; label: string; value: string }[][];
  version: string;
  company: string;
}

/** 74 账号与安全 */
export interface AccountSecurity {
  rows: { key: string; label: string; value: string; tone: 'weak' | 'success' }[][];
  warnText: string;
}

/** 75 通知设置 */
export interface NotifySwitch {
  key: string;
  name: string;
  sub: string;
  on: boolean;
  /** push = 推送类型分组，quiet = 免打扰分组 */
  group: 'push' | 'quiet';
}

/** 78 关于美味坊 */
export interface AboutInfo {
  appName: string;
  versionText: string;
  docs: { key: string; label: string }[];
  license: { key: string; label: string; value: string }[];
  company: string;
  icp: string;
}
