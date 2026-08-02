import { IMG } from './images';
import type {
  AboutInfo,
  AccountSecurity,
  Address,
  AddressFull,
  BulkGoods,
  Category,
  CategoryRow,
  CommentOptions,
  Coupon,
  CouponOffer,
  CouponPack,
  CouponRule,
  CouponTab,
  Dashboard,
  DeviceSettings,
  ExceptionOrder,
  ExceptionTab,
  FeedbackOptions,
  Goods,
  HelpCenterInfo,
  HistoryFilter,
  HistoryOrder,
  HistorySummary,
  InvoiceOptions,
  InvoiceTitle,
  LicenseInfo,
  MarketingCenter,
  MemberCenter,
  MerchantGoods,
  MerchantMessage,
  MerchantOrder,
  MerchantReview,
  MerchantReviewSummary,
  MessageDetail,
  MessageItem,
  MyReview,
  NotifySwitch,
  OptionLibGroup,
  Order,
  PickupStore,
  PoiItem,
  PointsGoods,
  PrintSettings,
  ProfileForm,
  PromoGoods,
  PromotionDraft,
  PromotionItem,
  Refund,
  RemarkOptions,
  Review,
  ReviewSummary,
  RiderMessage,
  SettingsInfo,
  Shop,
  ShopCouponDraft,
  ShopProfile,
  StockGoods,
  SupportMessage,
  UserProfile,
  VerifyLogTab,
  VerifyPreview,
  VerifyRecord,
  VerifyStats,
} from '@/models';

/** 示例数据；文案沿用设计稿，接入真实数据源时整体替换。 */

export const HOT_CATEGORY_ID = 'hot';

export const shop: Shop = {
  id: 'shop_1',
  name: '美味坊（中心店）',
  logo: IMG.shopLogo,
  score: 4.9,
  monthSoldText: '月售 2000+',
  etaText: '约30分钟送达',
  distanceText: '1.2km',
  promoTag: '满减',
  promoText: '全场满50减10，结算自动抵扣',
  open: true,
  businessHours: '09:00 – 22:00',
  deliveryText: '3km · ¥3 起送¥20',
  activityText: '满50减10 生效中',
  certified: true,
  staffCount: 3,
  newOrderAlert: true,
};

export const categories: Category[] = [
  { id: HOT_CATEGORY_ID, name: '热销推荐' },
  { id: 'c1', name: '招牌热菜' },
  { id: 'c2', name: '经典小炒' },
  { id: 'c3', name: '海鲜水产' },
  { id: 'c4', name: '主食米饭' },
  { id: 'c5', name: '汤品饮品' },
];

export const goodsList: Goods[] = [
  {
    id: 'g1',
    categoryId: 'c1',
    name: '招牌红烧肉套餐',
    desc: '精选五花三层肉，秘制酱汁慢炖 90 分钟，入口即化。套餐含时蔬一份与例汤，饭量大可选大份。',
    image: IMG.braisedPork,
    price: 3800,
    monthSold: 128,
    praiseRate: 98,
    stock: 45,
    onSale: true,
    rankTag: 'TOP 1',
    hot: 1,
    specGroups: [
      {
        id: 'sg1',
        name: '份量',
        multiple: false,
        required: true,
        options: [
          { id: 'o1', name: '标准', priceDelta: 0 },
          { id: 'o2', name: '大份', priceDelta: 700 },
        ],
      },
      {
        id: 'sg2',
        name: '辣度',
        multiple: false,
        required: true,
        defaultOptionId: 'o4',
        options: [
          { id: 'o3', name: '免辣', priceDelta: 0 },
          { id: 'o4', name: '微辣', priceDelta: 0 },
          { id: 'o5', name: '中辣', priceDelta: 0 },
        ],
      },
      {
        id: 'sg3',
        name: '加料',
        multiple: true,
        required: false,
        options: [
          { id: 'o6', name: '卤蛋', priceDelta: 300 },
          { id: 'o7', name: '加饭', priceDelta: 200 },
        ],
      },
    ],
  },
  {
    id: 'g2',
    categoryId: 'c3',
    name: '香煎深海带鱼',
    desc: '深海带鱼段中段，薄面粉煎至两面金黄，外脆里嫩。',
    image: IMG.hairtail,
    price: 4500,
    monthSold: 86,
    praiseRate: 96,
    stock: 30,
    onSale: true,
    hot: 2,
    specGroups: [],
  },
  {
    id: 'g3',
    categoryId: 'c2',
    name: '农家小炒肉拌饭',
    desc: '现炒农家小炒肉浇在米饭上，锅气足，饭量实在。',
    image: IMG.riceBowl,
    price: 2800,
    monthSold: 245,
    praiseRate: 99,
    stock: 12,
    onSale: true,
    hot: 3,
    specGroups: [],
  },
  {
    id: 'g4',
    categoryId: 'c1',
    name: '金黄炸猪排',
    desc: '整块里脊拍松裹粉现炸，配秘制酱汁。',
    image: IMG.porkChop,
    price: 2200,
    monthSold: 90,
    praiseRate: 95,
    stock: 24,
    onSale: true,
    hot: 4,
    specGroups: [],
  },
  {
    id: 'g5',
    categoryId: 'c5',
    name: '冰镇酸梅汤',
    desc: '乌梅山楂熬煮，冷藏后饮用，解腻。',
    image: IMG.plumJuice,
    price: 1200,
    monthSold: 320,
    praiseRate: 97,
    stock: 99,
    onSale: true,
    unit: '/杯',
    specGroups: [
      {
        id: 'sg4',
        name: '温度',
        multiple: false,
        required: true,
        options: [
          { id: 'o8', name: '常温', priceDelta: 0 },
          { id: 'o9', name: '加冰', priceDelta: 0 },
        ],
      },
    ],
  },
];

export const user: UserProfile = {
  openid: 'oX_mock_openid_0001',
  nickname: '吃货小王',
  avatar: '',
  phoneMask: '138****8000',
  isMerchant: true,
};

export const defaultAddress: Address = {
  id: 'addr_1',
  detail: '科技园南区A座15层1501室',
  receiver: '吃货小王',
  gender: '先生',
  phoneMask: '138****8000',
};

/** 15 / 16 / 38 · 收货地址簿 */
export const addresses: AddressFull[] = [
  {
    id: 'addr_1',
    tag: '公司',
    receiver: '吃货小王',
    gender: '先生',
    phone: '13880008000',
    phoneMask: '138****8000',
    poi: '科技园南区A座',
    houseNo: '15层1501室',
    detail: '科技园南区A座15层1501室',
    isDefault: true,
    distanceText: '距店 1.2km',
    outOfRange: false,
    latitude: 30.2731,
    longitude: 120.0128,
  },
  {
    id: 'addr_2',
    tag: '家',
    receiver: '吃货小王',
    gender: '先生',
    phone: '13880008000',
    phoneMask: '138****8000',
    poi: '阳光花园3栋2单元',
    houseNo: '801',
    detail: '阳光花园3栋2单元801',
    isDefault: false,
    distanceText: '距店 4.8km',
    outOfRange: true,
    latitude: 30.3011,
    longitude: 120.0512,
  },
  {
    id: 'addr_3',
    tag: '学校',
    receiver: '王女士',
    gender: '女士',
    phone: '13922112211',
    phoneMask: '139****2211',
    poi: '创业大厦B座',
    houseNo: '12层',
    detail: '创业大厦B座12层',
    isDefault: false,
    distanceText: '距店 2.1km',
    outOfRange: false,
    latitude: 30.2688,
    longitude: 120.0201,
  },
];

/** 52 · 地图选点候选 POI */
export const pois: PoiItem[] = [
  {
    id: 'poi_1',
    name: '文三路 100 号',
    districtText: '西湖区',
    distanceText: '距当前位置 80m',
    latitude: 30.2795,
    longitude: 120.0215,
  },
  {
    id: 'poi_2',
    name: '学院路 25 号',
    districtText: '西湖区',
    distanceText: '240m',
    latitude: 30.2801,
    longitude: 120.0232,
  },
  {
    id: 'poi_3',
    name: '嘉绿苑小区',
    districtText: '西湖区',
    distanceText: '520m',
    latitude: 30.2777,
    longitude: 120.0248,
  },
];

/** 83 · 自提门店 */
export const pickupStores: PickupStore[] = [
  {
    id: 'ps_1',
    name: '美味坊（文三路店）',
    open: true,
    addressText: '西湖区文三路 100 号 1 层 · 距你 320m',
    distanceText: '320m',
    etaText: '预计 15 分钟可取',
    hoursText: '09:00-21:30',
    latitude: 30.2795,
    longitude: 120.0215,
  },
  {
    id: 'ps_2',
    name: '美味坊（黄龙店）',
    open: true,
    addressText: '西湖区黄龙路 8 号 B1 · 距你 1.4km',
    distanceText: '1.4km',
    etaText: '预计 20 分钟可取',
    hoursText: '10:00-22:00',
    latitude: 30.2712,
    longitude: 120.1301,
  },
  {
    id: 'ps_3',
    name: '美味坊（滨江店）',
    open: false,
    addressText: '滨江区江南大道 66 号 · 距你 6.2km',
    distanceText: '6.2km',
    etaText: '明日 10:00 开始接单',
    hoursText: '10:00-22:00',
    latitude: 30.2088,
    longitude: 120.2101,
  },
];

/** 31 · 快捷备注 */
export const remarkOptions: RemarkOptions = {
  quick: ['不要香菜', '少放辣', '米饭多一点', '放前台代收', '到了打电话'],
  maxLength: 50,
};

/** 32 · 店铺主页 */
export const shopProfile: ShopProfile = {
  name: shop.name,
  logo: IMG.shopLogo,
  headerImage: '',
  score: 4.9,
  categoryText: '中式快餐 · 月售 2000+ 单',
  badges: [
    { text: '✓ 企业资质认证', tone: 'primary' },
    { text: '食安封签配送', tone: 'success' },
    { text: '开业 3 年', tone: 'grey' },
  ],
  notice: '本店招牌红烧肉每日限量 60 份，售完即止；全场满 50 减 10 长期有效。',
  hoursText: '周一至周日 09:00–22:00',
  open: true,
  addressText: '科技园中路88号1层',
  phone: '0755-8888 6666',
  licenseText: '营业执照 · 食品经营许可证',
  reviewCount: 326,
  reviewTagText: '"分量足" "味道正宗" 提及最多',
};

/** 82 · 评价 */
export const reviewSummary: ReviewSummary = {
  score: 4.8,
  total: 1246,
  dims: [
    { label: '口味', value: 4.9, percent: 96 },
    { label: '包装', value: 4.7, percent: 92 },
    { label: '配送', value: 4.6, percent: 88 },
  ],
  filters: [
    { key: 'all', label: '全部', count: 1246 },
    { key: 'photo', label: '有图', count: 328 },
    { key: 'portion', label: '份量足', count: 402 },
    { key: 'fast', label: '出餐快', count: 265 },
    { key: 'bad', label: '差评', count: 12 },
  ],
};

export const reviews: Review[] = [
  {
    id: 'rv_1',
    name: '李**',
    avatarText: '李',
    anonymous: false,
    stars: 5,
    dateText: '7月26日',
    text: '宫保鸡丁花生米很脆，米饭也给得足，30 分钟就到了。',
    photos: ['', '', ''],
    reply: '谢谢夸奖，下次给您多送一份小菜～',
    repeatText: '回头客 5 次',
  },
  {
    id: 'rv_2',
    name: '匿名用户',
    avatarText: '匿',
    anonymous: true,
    stars: 4,
    dateText: '7月25日',
    text: '味道不错，就是雨天等了 50 分钟，希望配送再快一点。',
    photos: [],
  },
];

/** 61 · 资质公示 */
export const licenseInfo: LicenseInfo = {
  shopName: '美味坊（文三路店）',
  companyName: '杭州美味坊餐饮有限公司',
  logo: IMG.shopLogo,
  docs: [
    {
      title: '营业执照',
      image: '',
      noLabel: '统一社会信用代码',
      no: '91330100MA2XXXXX',
      validText: '2025.03.12 - 长期',
    },
    {
      title: '食品经营许可证',
      image: '',
      noLabel: '证件编号',
      no: 'JY13301080XXXXXX',
      validText: '2025.04.01 - 2030.03.31',
    },
  ],
};

/** 19 / 55 · 评价编辑 */
export const commentOptions: CommentOptions = {
  orderNo: 'DD20260711018',
  shopName: '美味坊（文三路店）',
  shopLogo: IMG.shopLogo,
  orderMetaText: '7月26日 · 3 件商品',
  ratingLabels: ['很不满意', '不满意', '一般', '满意', '非常满意'],
  tags: ['份量足', '味道正宗', '包装好', '送达快', '性价比高'],
  maxLength: 200,
  maxPhotos: 9,
  rewardText: '评价成功可得 1 张无门槛 ¥3 券',
};

/** 60 · 我的评价 */
export const myReviews: MyReview[] = [
  {
    id: 'mr_1',
    name: '我',
    avatarText: '王',
    anonymous: false,
    stars: 5,
    dateText: '7月26日',
    text: '分量很足，宫保鸡丁花生米很脆，会回购。',
    photos: ['', ''],
    reply: '感谢支持，欢迎再来～',
    canAppend: true,
  },
  {
    id: 'mr_2',
    name: '我',
    avatarText: '王',
    anonymous: false,
    stars: 4,
    dateText: '7月20日',
    text: '味道不错，就是等得有点久。',
    photos: [],
    canAppend: false,
  },
];

/** 58 · 发票抬头 */
export const invoiceTitles: InvoiceTitle[] = [
  {
    id: 'it_1',
    type: 'company',
    typeText: '单位',
    name: '杭州某某科技有限公司',
    taxNo: '91330100MA2XXXXX',
    isDefault: true,
  },
  { id: 'it_2', type: 'personal', typeText: '个人', name: '王女士', taxNo: '', isDefault: false },
];

/** 57 · 申请发票 */
export const invoiceOptions: InvoiceOptions = {
  orderNo: '#20260726018',
  amount: 6800,
  invoiceTypeText: '电子普通发票',
  email: 'wang@example.com',
  tip: '发票由商家开具，预计 1-3 个工作日发送至邮箱；开票后该订单不支持退款。',
};

/** 41 · 在线客服会话 */
export const supportMessages: SupportMessage[] = [
  {
    id: 'sm_1',
    from: 'agent',
    kind: 'text',
    text: '您好，美味坊客服为您服务，请问有什么可以帮您？',
    timeText: '今天 12:44',
  },
  {
    id: 'sm_2',
    from: 'me',
    kind: 'order',
    text: '',
    order: { orderNo: '#20260727039', summary: '宫保鸡丁 等 3 件 · ￥68.00', image: '' },
  },
  { id: 'sm_3', from: 'me', kind: 'text', text: '这单里的米饭没有送到' },
];

export const supportQuickReplies = ['菜品少送了', '催一下单', '怎么退款', '发票问题'];

/** 77 · 帮助中心 */
export const helpCenter: HelpCenterInfo = {
  scenes: [
    { key: 'order', label: '订单', icon: 'order' },
    { key: 'delivery', label: '配送', icon: 'pin' },
    { key: 'refund', label: '退款', icon: 'card' },
    { key: 'account', label: '账号', icon: 'user' },
  ],
  faqs: [
    {
      id: 'faq_1',
      question: '下单后多久可以取消？',
      answer: '商家接单前可直接取消并原路退款；接单后需在订单详情申请售后，由商家确认。',
    },
    {
      id: 'faq_2',
      question: '退款多久到账？',
      answer: '商家同意后原路退回微信零钱，一般 1–3 个工作日到账，节假日可能顺延。',
    },
    {
      id: 'faq_3',
      question: '配送超时可以赔付吗？',
      answer: '超出承诺送达时间 15 分钟以上，可在订单详情申请超时赔付，审核通过后发放补偿券。',
    },
    {
      id: 'faq_4',
      question: '优惠券为什么用不了？',
      answer: '请检查是否满足使用门槛、是否在有效期内、是否限定了适用商品或配送方式。',
    },
    {
      id: 'faq_5',
      question: '餐品少送 / 洒漏怎么处理？',
      answer: '在订单详情点「申请售后」，选择对应商品并上传凭证图，商家 2 小时内处理。',
    },
  ],
};

/** 76 · 意见反馈 */
export const feedbackOptions: FeedbackOptions = {
  types: ['配送太慢', '商品问题', '功能建议', '小程序卡顿', '其他'],
  orderNo: '#20260726018',
  phoneMask: '138****8899',
  maxLength: 500,
  minLength: 10,
};

/** 18 · 搜索热词 */
export const hotWords = ['酸梅汤', '小炒肉', '带鱼', '猪排饭'];

/** 顾客端订单：一单配送中、一单已完成待评价 */
export const orders: Order[] = [
  {
    id: 'ord_1024',
    orderNo: 'DD20260717001',
    shopName: shop.name,
    status: 'delivering',
    statusText: '骑手配送中',
    statusTone: 'primary',
    deliveryType: 'delivery',
    items: [
      {
        name: '招牌红烧肉套餐',
        image: IMG.braisedPork,
        specText: '大份 / 微辣',
        qty: 1,
        amount: 4500,
      },
      { name: '冰镇酸梅汤', image: IMG.plumJuice, specText: '常温', qty: 2, amount: 2400 },
    ],
    count: 3,
    itemsTotal: 6900,
    packFee: 200,
    deliveryFee: 300,
    couponDiscount: 1000,
    payable: 6400,
    createdAt: '2026-07-17 12:02',
    createdAtText: '2026-07-17 12:02',
    metaText: '今天 12:02 · 外送 · 预计 12:30 送达',
    etaText: '预计 12:30 送达 · 距您 1.2km',
    etaTimeText: '今天 12:30',
    address: defaultAddress,
    rider: {
      name: '王师傅',
      role: '专送骑手',
      statusText: '已取餐，正在配送途中',
      avatarText: '王',
      phone: '1010-8899',
      titleText: '王师傅 · 浙A·D3821',
      creditText: '已服务 1,204 单 · 准时率 98%',
      virtualPhone: '1010-8899',
    },
    payMethodText: '微信支付',
    timeline: [
      { label: '已接单', done: true, current: false },
      { label: '备餐完成', done: true, current: false },
      { label: '配送中', done: false, current: true },
      { label: '已送达', done: false, current: false },
    ],
    actions: [
      { key: 'again', text: '再来一单', style: 'outline' },
      { key: 'progress', text: '查看进度', style: 'primary' },
    ],
  },
  {
    id: 'ord_1019',
    orderNo: 'DD20260711018',
    shopName: shop.name,
    status: 'done',
    statusText: '已完成',
    statusTone: 'weak',
    deliveryType: 'pickup',
    items: [
      { name: '香煎深海带鱼', image: IMG.hairtail, specText: '', qty: 1, amount: 4500 },
      { name: '农家小炒肉拌饭', image: IMG.riceBowl, specText: '', qty: 1, amount: 2800 },
    ],
    count: 2,
    itemsTotal: 7300,
    packFee: 200,
    deliveryFee: 0,
    couponDiscount: 700,
    payable: 6800,
    createdAt: '2026-07-11 18:45',
    createdAtText: '2026-07-11 18:45',
    metaText: '7月11日 18:45 · 自取 · 取餐码 8823',
    etaText: '已完成',
    etaTimeText: '7月11日 19:05',
    pickupCode: '8823',
    payMethodText: '微信支付',
    timeline: [
      { label: '已接单', done: true, current: false },
      { label: '备餐完成', done: true, current: false },
      { label: '待取餐', done: true, current: false },
      { label: '已完成', done: true, current: false },
    ],
    actions: [
      { key: 'again', text: '再来一单', style: 'outline' },
      { key: 'comment', text: '去评价', style: 'outline-primary' },
    ],
  },
];

/** 商家侧待处理的售后单（09 售后 Tab → 48 审核） */
export const refunds: Refund[] = [
  {
    id: 'rf_2001',
    orderId: 'm_1019',
    orderNo: '#20260727039',
    status: 'reviewing',
    statusText: '退款处理中',
    statusSub: '商家将在 2 小时内处理，超时自动退款',
    type: 'refundOnly',
    typeText: '仅退款（已出餐）',
    amount: 2800,
    itemsText: '招牌红烧肉套餐 ×1',
    reasonText: '口味/质量问题',
    desc: '菜品与描述不符：红烧肉偏咸',
    photos: ['', ''],
    items: [
      {
        key: 'rfi_1',
        name: '招牌红烧肉套餐',
        specText: '大份 / 微辣',
        qty: 1,
        amount: 2800,
        image: IMG.braisedPork,
        checked: true,
      },
    ],
    createdAtText: '7月27日 12:41',
    autoAgreeIn: 6720,
    timeline: [
      { title: '提交退款申请', sub: '7月27日 12:41', done: true },
      { title: '商家审核中', sub: '预计 14:41 前完成', done: true },
      { title: '退款到账', sub: '原路退回微信零钱', done: false },
    ],
    placedAtText: '今天 12:05',
  },
];

/** 联系骑手的会话（84） */
export const riderMessages: RiderMessage[] = [
  {
    id: 'rm_1',
    from: 'rider',
    text: '我已取到餐，大概 12 分钟到，路上有点堵。',
    timeText: '12:12',
  },
  { id: 'rm_2', from: 'me', text: '好的，到了放门口就行，谢谢！' },
];

export const riderQuickReplies = ['放门口，不用敲门', '到了给我打电话', '我在小区南门等'];

export const aftersaleReasons = ['配送超时未送达', '少送 / 漏送', '餐品洒漏', '口味/质量问题'];

export const dashboard: Dashboard = {
  shopName: shop.name,
  scoreText: '★ 4.9 · 已认证商家',
  open: true,
  todos: [
    { label: '待接单', value: 3, highlight: true },
    { label: '备餐中', value: 2, highlight: false },
    { label: '已售罄商品', value: 1, highlight: false },
  ],
  metrics: [
    { label: '营业额（元）', value: '4,280.50', delta: '↑ 12.5% 较昨日', deltaTone: 'up' },
    { label: '订单量', value: '128', delta: '↑ 8.4%', deltaTone: 'up' },
    { label: '访客数', value: '412', delta: '转化率 31%', deltaTone: 'flat' },
    { label: '客单价（元）', value: '33.4', delta: '持平', deltaTone: 'flat' },
  ],
  trend: [
    { label: '7-11', percent: 38, tone: 'weak' },
    { label: '7-12', percent: 55, tone: 'weak' },
    { label: '7-13', percent: 46, tone: 'weak' },
    { label: '7-14', percent: 66, tone: 'weak' },
    { label: '7-15', percent: 58, tone: 'weak' },
    { label: '7-16', percent: 82, tone: 'mid' },
    { label: '今天', percent: 100, tone: 'today' },
  ],
  hot: [
    { rank: 1, name: '招牌红烧肉套餐', countText: '45 单' },
    { rank: 2, name: '农家小炒肉拌饭', countText: '32 单' },
    { rank: 3, name: '冰镇酸梅汤', countText: '28 单' },
  ],
};

export const merchantOrders: MerchantOrder[] = [
  {
    id: 'm_1024',
    seq: '#1024',
    channel: '外送',
    status: 'pending',
    statusText: '待接单',
    countdown: 222,
    customerName: '张先生',
    customerPhone: '138****1234',
    addressText: '科技园南区A座15层1501室',
    distanceText: '距店 1.2km',
    distanceEtaText: '1.2 km · 预计 25 分钟',
    lines: [
      {
        name: '招牌红烧肉套餐',
        specText: '大份 / 微辣',
        qty: 1,
        amount: 4500,
        image: IMG.braisedPork,
      },
      { name: '冰镇酸梅汤', specText: '常温', qty: 2, amount: 2400, image: IMG.plumJuice },
    ],
    count: 3,
    total: 6400,
    placedAtText: '下单 12:02',
    expectText: '立即送出',
    customerSeqText: '第 3 单',
    remark: '不要香菜，多给一份醋',
  },
  {
    id: 'm_1023',
    seq: '#1023',
    channel: '自提',
    status: 'ongoing',
    statusText: '备餐中',
    customerName: '李女士',
    customerPhone: '139****5678',
    pickupCode: '8823',
    lines: [{ name: '农家小炒肉拌饭', specText: '', qty: 2, amount: 5600, image: IMG.riceBowl }],
    count: 2,
    total: 5600,
    placedAtText: '下单 11:48',
    expectText: '12:20 前自取',
    customerSeqText: '第 1 单',
    summaryText: '李女士 139****5678 · 农家小炒肉拌饭 x2 · ¥56.00',
  },
  {
    id: 'm_1022',
    seq: '#1022',
    channel: '外送',
    status: 'pending',
    statusText: '待接单',
    countdown: 405,
    customerName: '陈先生',
    customerPhone: '137****9911',
    addressText: '软件园二期 3 号楼 B 座 902',
    distanceText: '距店 0.8km',
    distanceEtaText: '0.8 km · 预计 20 分钟',
    lines: [
      { name: '香煎深海带鱼', specText: '', qty: 1, amount: 4500, image: IMG.hairtail },
      { name: '金黄炸猪排', specText: '', qty: 1, amount: 2200, image: IMG.porkChop },
    ],
    count: 2,
    total: 6700,
    placedAtText: '下单 12:05',
    expectText: '立即送出',
    customerSeqText: '第 2 单',
  },
  {
    id: 'm_1021',
    seq: '#1021',
    channel: '外送',
    status: 'pending',
    statusText: '待接单',
    countdown: 540,
    customerName: '刘女士',
    customerPhone: '135****4432',
    addressText: '中心广场 A 座 1802',
    distanceText: '距店 2.1km',
    distanceEtaText: '2.1 km · 预计 30 分钟',
    lines: [{ name: '农家小炒肉拌饭', specText: '', qty: 3, amount: 8400, image: IMG.riceBowl }],
    count: 3,
    total: 8400,
    placedAtText: '下单 12:08',
    expectText: '13:00 前送达',
    customerSeqText: '首单',
  },
  {
    id: 'm_1020',
    seq: '#1020',
    channel: '外送',
    status: 'ongoing',
    statusText: '备餐中',
    customerName: '赵先生',
    customerPhone: '132****7788',
    addressText: '滨江路 66 号 2 单元 301',
    distanceText: '距店 1.9km',
    distanceEtaText: '1.9 km · 预计 28 分钟',
    lines: [
      {
        name: '招牌红烧肉套餐',
        specText: '标准 / 微辣',
        qty: 1,
        amount: 3800,
        image: IMG.braisedPork,
      },
      { name: '冰镇酸梅汤', specText: '加冰', qty: 1, amount: 1200, image: IMG.plumJuice },
    ],
    count: 2,
    total: 5000,
    placedAtText: '下单 11:52',
    expectText: '立即送出',
    customerSeqText: '第 5 单',
    summaryText: '赵先生 132****7788 · 红烧肉套餐 x1、酸梅汤 x1 · ¥50.00',
  },
  {
    id: 'm_1019',
    seq: '#1019',
    channel: '外送',
    status: 'aftersale',
    statusText: '退款待处理',
    customerName: '孙女士',
    customerPhone: '133****6655',
    addressText: '云谷小区 8 号楼 1201',
    distanceText: '距店 1.4km',
    distanceEtaText: '1.4 km · 已送达',
    lines: [
      {
        name: '招牌红烧肉套餐',
        specText: '大份 / 微辣',
        qty: 1,
        amount: 4500,
        image: IMG.braisedPork,
      },
    ],
    count: 1,
    total: 4500,
    placedAtText: '下单 12:05',
    expectText: '已送达',
    customerSeqText: '第 2 单',
    refundId: 'rf_2001',
    refundAmount: 2800,
    refundReason: '口味/质量问题',
  },
  {
    id: 'm_1018',
    seq: '#1018',
    channel: '外送',
    status: 'done',
    statusText: '已完成',
    customerName: '周先生',
    customerPhone: '136****2201',
    addressText: '创业大厦 12 层',
    distanceText: '距店 1.6km',
    distanceEtaText: '1.6 km · 已送达',
    lines: [
      {
        name: '招牌红烧肉套餐',
        specText: '标准 / 中辣',
        qty: 2,
        amount: 7600,
        image: IMG.braisedPork,
      },
    ],
    count: 2,
    total: 7600,
    placedAtText: '下单 11:20',
    expectText: '已完成',
    customerSeqText: '第 8 单',
  },
];

/** 64 · 选项库：可复用的规格 / 加料组 */
export const optionLib: OptionLibGroup[] = [
  {
    id: 'ol_1',
    name: '份量',
    multiple: false,
    required: true,
    metaText: '单选 · 必选 · 已用于 18 个商品',
    options: [
      { id: 'olo_1', name: '小份', priceDelta: 0, checked: false },
      { id: 'olo_2', name: '标准', priceDelta: 0, checked: false },
      { id: 'olo_3', name: '大份', priceDelta: 600, checked: false },
    ],
  },
  {
    id: 'ol_2',
    name: '辣度',
    multiple: false,
    required: false,
    metaText: '单选 · 可选 · 已用于 12 个商品',
    options: [
      { id: 'olo_4', name: '不辣', priceDelta: 0, checked: false },
      { id: 'olo_5', name: '微辣', priceDelta: 0, checked: false },
      { id: 'olo_6', name: '中辣', priceDelta: 0, checked: false },
      { id: 'olo_7', name: '特辣', priceDelta: 0, checked: false },
    ],
  },
  {
    id: 'ol_3',
    name: '加料',
    multiple: true,
    required: false,
    metaText: '多选 · 最多 3 项 · 已用于 9 个商品',
    options: [
      { id: 'olo_8', name: '加米饭', priceDelta: 300, checked: true },
      { id: 'olo_9', name: '加鸡蛋', priceDelta: 200, checked: true },
      { id: 'olo_10', name: '加青菜', priceDelta: 400, checked: false },
    ],
  },
];

/** 22 · 分类管理 */
export const categoryRows: CategoryRow[] = [
  { id: 'hot', name: '热销推荐', sub: '自动聚合 · 按月售排序', pinned: true, hidden: false },
  { id: 'c1', name: '招牌热菜', sub: '8 个商品', pinned: false, hidden: false },
  { id: 'c2', name: '经典小炒', sub: '6 个商品', pinned: false, hidden: false },
  { id: 'c3', name: '海鲜水产', sub: '4 个商品 · 1 个售罄', pinned: false, hidden: false },
  { id: 'c4', name: '主食米饭', sub: '5 个商品', pinned: false, hidden: false },
  {
    id: 'c5',
    name: '汤品饮品',
    sub: '分类内无在售商品，顾客端自动隐藏',
    pinned: false,
    hidden: true,
  },
];

/** 49 · 沽清与库存 */
export const stockGoods: StockGoods[] = [
  {
    id: 'sg_1',
    name: '宫保鸡丁',
    image: '',
    categoryName: '招牌热菜',
    soldTodayText: '今日已售 38',
    remain: 12,
    available: true,
  },
  {
    id: 'sg_2',
    name: '水煮牛肉',
    image: '',
    categoryName: '招牌热菜',
    soldTodayText: '今日已售 25',
    remain: 4,
    available: true,
  },
  {
    id: 'sg_3',
    name: '清蒸鲈鱼',
    image: '',
    categoryName: '海鲜水产',
    soldTodayText: '今日已售 9',
    remain: 0,
    available: false,
  },
  {
    id: 'sg_4',
    name: '蒜蓉西兰花',
    image: '',
    categoryName: '经典小炒',
    soldTodayText: '今日已售 21',
    remain: 26,
    available: true,
  },
  {
    id: 'sg_5',
    name: '酸辣汤',
    image: '',
    categoryName: '汤品饮品',
    soldTodayText: '今日已售 6',
    remain: 0,
    available: false,
  },
];

/** 93 · 商品批量管理 */
export const bulkGoods: BulkGoods[] = [
  { id: 'bg_1', name: '宫保鸡丁', image: '', metaText: '热菜 · ￥28.00 · 月售 186', offShelf: false },
  {
    id: 'bg_2',
    name: '红烧肉盖饭',
    image: '',
    metaText: '主食 · ￥29.00 · 月售 154',
    offShelf: false,
  },
  {
    id: 'bg_3',
    name: '酸辣土豆丝',
    image: '',
    metaText: '热菜 · ￥12.00 · 月售 121',
    offShelf: false,
  },
  { id: 'bg_4', name: '干锅花菜', image: '', metaText: '热菜 · ￥26.00 · 月售 3', offShelf: true },
];

export const printSettings: PrintSettings = {
  device: {
    id: 'printer_a',
    name: '后厨打印机 A',
    online: true,
    statusText: '在线 · 蓝牙已连接',
  },
  autoPrint: true,
  copies: 2,
  copiesText: '2 联',
  width: '58mm',
  printRemark: true,
};

export const merchantGoods: MerchantGoods[] = [
  {
    id: 'g1',
    name: '招牌红烧肉套餐',
    image: IMG.braisedPork,
    categoryName: '招牌热菜',
    price: 3800,
    priceFrom: true,
    stock: 45,
    specCountText: '库存 45 · 2个规格',
    onSale: true,
    stockLevel: 'normal',
  },
  {
    id: 'g3',
    name: '农家小炒肉拌饭',
    image: IMG.friedPork,
    categoryName: '经典小炒',
    price: 2800,
    priceFrom: false,
    stock: 12,
    specCountText: '库存偏低 12',
    onSale: true,
    stockLevel: 'low',
  },
  {
    id: 'g6',
    name: '清蒸鲈鱼（需预定）',
    image: IMG.steamedFish,
    categoryName: '海鲜水产',
    price: 6800,
    priceFrom: false,
    stock: 0,
    specCountText: '库存 0',
    onSale: true,
    stockLevel: 'out',
  },
  {
    id: 'g7',
    name: '时令蔬菜沙拉',
    image: IMG.salad,
    categoryName: '汤品饮品',
    price: 1800,
    priceFrom: false,
    stock: 20,
    specCountText: '已下架',
    onSale: false,
    stockLevel: 'normal',
  },
];

/* ================= 顾客端 · 卡券会员与设置账号 ================= */

/** 73 个人资料 */
export const profileForm: ProfileForm = {
  avatar: IMG.avatar,
  nickname: '王小明',
  gender: 'male',
  genderText: '男',
  birthday: '1995-06-12',
  phoneMask: '138****8899',
  tastes: [
    { key: 'mild', label: '少辣', on: true },
    { key: 'noCilantro', label: '不吃香菜', on: true },
    { key: 'lessOil', label: '少油少盐', on: false },
    { key: 'noScallion', label: '不要葱', on: false },
  ],
};

/** 37 消息通知 */
export const messages: MessageItem[] = [
  {
    id: 'msg_1',
    tab: 'order',
    icon: 'order',
    tone: 'primary',
    title: '订单已出餐',
    desc: '#20260727039 骑手王师傅已取餐，预计 12:38 送达',
    timeText: '刚刚',
    unread: true,
  },
  {
    id: 'msg_2',
    tab: 'promo',
    icon: 'ticket',
    tone: 'primary',
    title: '新券到账',
    desc: '满 60 减 12 元券，7 天内有效',
    timeText: '昨天',
    unread: false,
  },
  {
    id: 'msg_3',
    tab: 'order',
    icon: 'check',
    tone: 'success',
    title: '退款已到账',
    desc: '￥18.00 已原路退回微信零钱',
    timeText: '7月25日',
    unread: false,
  },
];

/** 86 通知详情 */
export const messageDetails: Record<string, MessageDetail> = {
  msg_3: {
    id: 'msg_3',
    categoryText: '订单通知',
    title: '你的退款 ￥28.00 已到账',
    timeText: '2026-07-26 12:58',
    paragraphs: [
      '订单 #20260726018 的售后申请已通过，退款 ￥28.00 已退回原微信支付账户，通常 1-3 个工作日内到账，具体以银行为准。',
      '如超时未收到，可在「订单详情 › 退款进度」查看流水编号，或联系在线客服协助查询。',
    ],
    order: {
      id: 'ord_1019',
      shopName: '美味坊（文三路店）',
      summary: '宫保鸡丁 等 3 件 · 实付 ￥68.00',
      image: IMG.riceBowl,
    },
    actions: [
      { key: 'support', text: '联系客服', style: 'ghost' },
      { key: 'refund', text: '查看退款进度', style: 'primary' },
    ],
    footText: '通知将保留 30 天',
  },
  msg_1: {
    id: 'msg_1',
    categoryText: '订单通知',
    title: '订单已出餐，骑手正在赶来',
    timeText: '2026-07-27 12:16',
    paragraphs: [
      '订单 #20260727039 已出餐，骑手王师傅已取餐，预计 12:38 送达，请保持手机畅通。',
      '如需修改收货信息或联系骑手，可在「配送追踪」页操作。',
    ],
    order: {
      id: 'ord_1024',
      shopName: '美味坊（文三路店）',
      summary: '招牌红烧肉套餐 等 2 件 · 实付 ￥64.00',
      image: IMG.braisedPork,
    },
    actions: [
      { key: 'support', text: '联系客服', style: 'ghost' },
      { key: 'track', text: '查看配送进度', style: 'primary' },
    ],
    footText: '通知将保留 30 天',
  },
  msg_2: {
    id: 'msg_2',
    categoryText: '优惠通知',
    title: '满 60 减 12 元券已到账',
    timeText: '2026-07-26 09:02',
    paragraphs: [
      '你获得「新客立减券」1 张，满 60 元可用，全店通用，有效期至 2026-07-31。',
      '结算时系统会自动为你选择最优券组合，无需手动选择。',
    ],
    order: null,
    actions: [
      { key: 'coupons', text: '查看卡券', style: 'ghost' },
      { key: 'menu', text: '去点餐', style: 'primary' },
    ],
    footText: '通知将保留 30 天',
  },
};

/**
 * 17 / 39 我的优惠券。
 * 设计稿把同一个卡券包画了两遍（17「我的优惠券」、39「我的卡券」），
 * 这里按并集实现一份数据：17 的券种类 + 39 的即将过期标记。
 */
export const coupons: Record<CouponTab, Coupon[]> = {
  usable: [
    {
      id: 'cp_60_12',
      kind: 'cash',
      amount: 1200,
      amountText: '12',
      thresholdText: '满 60 元可用',
      name: '新客立减券',
      validText: '全店通用 · 有效期至 2026-07-31',
      note: '即将过期',
      noteTone: 'danger',
      tone: 'main',
    },
    {
      id: 'cp_50_10',
      kind: 'cash',
      amount: 1000,
      amountText: '10',
      thresholdText: '满 50 元可用',
      name: '全场通用券',
      validText: '全店通用 · 有效期至 2026-08-10',
      note: '还差 ¥0 可用 · 结算自动抵扣',
      noteTone: 'primary',
      tone: 'main',
    },
    {
      id: 'cp_ship_3',
      kind: 'cash',
      amount: 300,
      amountText: '3',
      thresholdText: '无门槛',
      name: '配送费抵扣券',
      validText: '有效期至 2026-08-20',
      note: '仅限外卖配送订单',
      noteTone: 'warn',
      tone: 'light',
    },
  ],
  used: [
    {
      id: 'cp_used_1',
      kind: 'cash',
      amount: 500,
      amountText: '5',
      thresholdText: '满 30 元可用',
      name: '日常满减券',
      validText: '已用于订单 #20260720011',
      note: '2026-07-20 使用',
      noteTone: 'weak',
      tone: 'grey',
    },
  ],
  expired: [
    {
      id: 'cp_exp_1',
      kind: 'discount',
      amount: 88,
      amountText: '8.8折',
      thresholdText: '上限 ¥15',
      name: '会员日折扣券',
      validText: '有效期至 2026-06-30',
      note: '已过期',
      noteTone: 'weak',
      tone: 'grey',
    },
  ],
};

/** 59 优惠券使用规则 */
export const couponRules: Record<string, CouponRule> = {
  cp_60_12: {
    couponId: 'cp_60_12',
    rangeText: '2026.07.20 - 07.31',
    rows: [
      { label: '适用门店', value: '美味坊（文三路店）' },
      { label: '适用商品', value: '全部商品' },
      { label: '叠加规则', value: '不可与满减同享' },
      { label: '每单限用', value: '1 张' },
    ],
    terms: [
      '实付金额满 60 元（不含配送费与包装费）方可使用；',
      '退款时优惠不予退还，按实付比例退款；',
      '最终解释权归商家所有。',
    ],
  },
  cp_50_10: {
    couponId: 'cp_50_10',
    rangeText: '2026.07.01 - 08.10',
    rows: [
      { label: '适用门店', value: '全部门店' },
      { label: '适用商品', value: '全部商品' },
      { label: '叠加规则', value: '可与店铺满减同享' },
      { label: '每单限用', value: '1 张' },
    ],
    terms: [
      '实付金额满 50 元（不含配送费与包装费）方可使用；',
      '退款时优惠不予退还，按实付比例退款；',
      '最终解释权归商家所有。',
    ],
  },
  cp_ship_3: {
    couponId: 'cp_ship_3',
    rangeText: '2026.07.10 - 08.20',
    rows: [
      { label: '适用门店', value: '美味坊（文三路店）' },
      { label: '适用商品', value: '仅抵扣配送费' },
      { label: '叠加规则', value: '可与优惠券同享' },
      { label: '每单限用', value: '1 张' },
    ],
    terms: [
      '仅限外卖配送订单，自提订单不可用；',
      '抵扣金额不超过实际配送费；',
      '最终解释权归商家所有。',
    ],
  },
};

/** 79 领券中心 */
export const couponPack: CouponPack = {
  title: '新客礼包 · 3 张',
  sub: '最高立减 ¥25，仅限首单使用',
};

export const couponOffers: CouponOffer[] = [
  {
    id: 'of_60_12',
    tab: 'shop',
    amountText: '12',
    thresholdText: '满 60 可用',
    name: '新客立减券',
    desc: '领取后 7 天内有效',
    tone: 'main',
    state: 'take',
  },
  {
    id: 'of_30_5',
    tab: 'shop',
    amountText: '5',
    thresholdText: '满 30 可用',
    name: '午市专享券',
    desc: '每日 11:00-14:00 可用',
    tone: 'gold',
    state: 'take',
  },
  {
    id: 'of_ship_3',
    tab: 'shop',
    amountText: '3',
    thresholdText: '无门槛',
    name: '配送费减免券',
    desc: '今日已领完，明日 10:00 再来',
    tone: 'grey',
    state: 'soldout',
  },
  {
    id: 'of_disc_88',
    tab: 'shop',
    amountText: '8.8折',
    thresholdText: '上限 ¥15',
    name: '会员日折扣券',
    desc: '每月 18 日可用',
    tone: 'green',
    state: 'taken',
  },
  {
    id: 'of_plat_8',
    tab: 'platform',
    amountText: '8',
    thresholdText: '满 40 可用',
    name: '平台通用补贴券',
    desc: '平台补贴 · 全城门店通用',
    tone: 'main',
    state: 'take',
  },
  {
    id: 'of_plat_15',
    tab: 'platform',
    amountText: '15',
    thresholdText: '满 99 可用',
    name: '大额聚餐券',
    desc: '周末与节假日可用',
    tone: 'gold',
    state: 'take',
  },
  {
    id: 'of_pt_200',
    tab: 'points',
    amountText: '3',
    thresholdText: '无门槛',
    name: '200 积分兑配送券',
    desc: '兑换后 7 天内有效',
    tone: 'green',
    state: 'take',
  },
];

/** 80 会员积分中心 */
export const memberCenter: MemberCenter = {
  levelName: '黄金食客',
  levelText: 'LV.3',
  pointsText: '1,280',
  progress: 64,
  upgradeText: '再消费 ¥320 升级铂金食客，配送费全免',
  todayText: '今日可得 30 分',
  tasks: [
    { key: 'signin', name: '每日签到', sub: '连续 6 天 · 明日 +8', btnText: '已签到', done: true },
    { key: 'order', name: '完成一单', sub: '+10 积分', btnText: '去点餐', done: false },
    { key: 'comment', name: '带图评价', sub: '+15 积分 · 每日 1 次', btnText: '去评价', done: false },
  ],
  rows: [
    { key: 'mall', label: '积分兑换', value: '12 件好物', tone: 'weak' },
    { key: 'log', label: '积分明细', value: '近 30 天 +260', tone: 'weak' },
    { key: 'expiring', label: '即将过期', value: '120 分 · 7月31日', tone: 'primary' },
  ],
};

/** 81 积分兑换 */
export const pointsGoods: PointsGoods[] = [
  {
    id: 'pg_1',
    tab: 'coupon',
    name: '配送费全免券',
    image: IMG.pointsShip,
    sub: '剩余 240 张',
    costText: '200 分',
    affordable: true,
    shortText: '',
  },
  {
    id: 'pg_2',
    tab: 'dish',
    name: '可乐（罐装）',
    image: IMG.pointsCola,
    sub: '随单赠送',
    costText: '300 分',
    affordable: true,
    shortText: '',
  },
  {
    id: 'pg_3',
    tab: 'coupon',
    name: '￥15 无门槛券',
    image: IMG.pointsCash,
    sub: '每月限兑 1 次',
    costText: '1,200 分',
    affordable: true,
    shortText: '',
  },
  {
    id: 'pg_4',
    tab: 'gift',
    name: '美味坊保温袋',
    image: IMG.pointsBag,
    sub: '积分不足 720 分',
    costText: '2,000 分',
    affordable: false,
    shortText: '差一点',
  },
];

/** 44 设置与关于 */
export const settingsInfo: SettingsInfo = {
  rows: [
    [
      { key: 'phone', label: '手机号', value: '138****8899' },
      { key: 'wechat', label: '微信授权', value: '已授权' },
      { key: 'push', label: '消息推送', value: '订单通知已开' },
    ],
    [
      { key: 'privacy', label: '隐私政策', value: '' },
      { key: 'terms', label: '用户协议', value: '' },
      { key: 'feedback', label: '意见反馈', value: '' },
      { key: 'version', label: '当前版本', value: 'v2.4.0' },
    ],
  ],
  version: 'v2.4.0',
  company: '杭州美味坊餐饮有限公司',
};

/** 74 账号与安全 */
export const accountSecurity: AccountSecurity = {
  rows: [
    [
      { key: 'wechat', label: '微信账号', value: '已绑定', tone: 'success' },
      { key: 'phone', label: '手机号', value: '138****8899 · 更换', tone: 'weak' },
      { key: 'realname', label: '实名认证', value: '王* · 已认证', tone: 'weak' },
    ],
    [
      { key: 'payless', label: '免密支付', value: '微信支付分 · 已开通', tone: 'weak' },
      { key: 'limit', label: '单笔免密上限', value: '¥200', tone: 'weak' },
      { key: 'devices', label: '登录设备管理', value: '2 台设备', tone: 'weak' },
    ],
  ],
  warnText: '账号注销后订单记录、优惠券与积分将被清空且不可恢复，请谨慎操作。',
};

/** 75 通知设置 */
export const notifySwitches: NotifySwitch[] = [
  { key: 'orderStatus', name: '订单状态通知', sub: '接单、出餐、送达实时提醒', on: true, group: 'push' },
  { key: 'riderNear', name: '骑手即将到达', sub: '距离 500m 时提醒', on: true, group: 'push' },
  { key: 'promo', name: '优惠活动推送', sub: '新券到账与限时折扣', on: false, group: 'push' },
  { key: 'comment', name: '评价提醒', sub: '订单完成 2 小时后提醒', on: true, group: 'push' },
  { key: 'quiet', name: '夜间免打扰', sub: '22:00 - 08:00 只保留订单通知', on: true, group: 'quiet' },
];

/** 78 关于美味坊 */
export const aboutInfo: AboutInfo = {
  appName: '美味坊点餐',
  versionText: '版本 2.4.0（基础库 3.5.7）',
  docs: [
    { key: 'terms', label: '用户服务协议' },
    { key: 'privacy', label: '隐私政策' },
    { key: 'collect', label: '个人信息收集清单' },
    { key: 'share', label: '第三方信息共享清单' },
  ],
  license: [
    { key: 'license', label: '营业执照与资质', value: '' },
    { key: 'complaint', label: '投诉与举报', value: '400-820-1234' },
  ],
  company: '杭州美味坊网络科技有限公司',
  icp: '浙ICP备2026XXXXXX号 · © 2026',
};

/* ================= 商家端 · 接单扩展与营销评价 ================= */

/** 21 核销取餐码：按 4 位码匹配订单预览，防错核 */
export const verifyPreviews: Record<string, VerifyPreview> = {
  '8823': {
    code: '8823',
    orderNo: '#1023',
    customer: '李女士',
    itemsText: '农家小炒肉拌饭 x2',
    amountText: '56.00',
  },
  '8Q4K': {
    code: '8Q4K',
    orderNo: '#20260726018',
    customer: '王**',
    itemsText: '宫保鸡丁 x1、番茄蛋汤 x1',
    amountText: '68.00',
  },
};

/** 45 商家消息中心 */
export const merchantMessages: MerchantMessage[] = [
  {
    id: 'mm_1',
    kind: 'order',
    icon: 'order',
    title: '新订单 #041',
    timeText: '刚刚',
    desc: '宫保鸡丁 等 2 件 · ￥46.00 · 请在 3 分钟内接单',
    actionable: true,
    urgent: true,
  },
  {
    id: 'mm_1b',
    kind: 'order',
    icon: 'order',
    title: '新订单 #042',
    timeText: '2 分钟前',
    desc: '水煮牛肉 等 3 件 · ￥96.00 · 请在 1 分钟内接单',
    actionable: true,
    urgent: true,
  },
  {
    id: 'mm_2',
    kind: 'refund',
    icon: 'card',
    title: '退款申请',
    timeText: '8 分钟前',
    desc: '#039 顾客申请退款 ￥28.00，理由：菜品与描述不符',
    actionable: true,
    urgent: true,
  },
  {
    id: 'mm_3',
    kind: 'review',
    icon: 'star',
    title: '新增评价',
    timeText: '1 小时前',
    desc: '顾客给出 3 星评价，建议及时回复',
    actionable: false,
    urgent: false,
  },
  {
    id: 'mm_4',
    kind: 'settle',
    icon: 'chart',
    title: '货款到账',
    timeText: '今天 09:00',
    desc: '7月26日货款 ￥2,318.40 已结算至对公账户',
    actionable: false,
    urgent: false,
  },
];

/** 91 历史订单查询 */
export const historyFilter: HistoryFilter = {
  dateText: '07-20 至 07-26',
  statusText: '全部状态',
  channelText: '全渠道',
};

export const historySummary: HistorySummary = {
  countText: '共 428 单',
  incomeText: '实收 ￥18,642.50',
  refundText: '退款 12 单',
};

export const historyOrders: HistoryOrder[] = [
  {
    id: 'h_1',
    orderNo: '#20260726018',
    statusText: '已完成',
    statusTone: 'done',
    metaText: '外卖 · 12:38 送达 · 王**',
    amountText: '68.00',
    refundText: '',
    itemsText: '宫保鸡丁 ×1、红烧肉盖饭 ×1、番茄蛋汤 ×1',
  },
  {
    id: 'h_2',
    orderNo: '#20260726014',
    statusText: '部分退款',
    statusTone: 'partial',
    metaText: '自提 · 12:10 核销 · 李**',
    amountText: '42.00',
    refundText: '-12',
    itemsText: '酸辣土豆丝 ×1、红烧肉盖饭 ×1',
  },
  {
    id: 'h_3',
    orderNo: '#20260725220',
    statusText: '已取消',
    statusTone: 'cancelled',
    metaText: '外卖 · 顾客支付前取消',
    amountText: '0.00',
    refundText: '',
    itemsText: '',
  },
];

/** 92 异常与取消订单 */
export const exceptionOrders: Record<ExceptionTab, ExceptionOrder[]> = {
  cancel: [
    {
      id: 'e_1',
      orderNo: '#20260726031',
      stageText: '待处理',
      stageTone: 'pending',
      countdownText: '剩 4 分钟自动同意',
      reasonQuote: '点错了，想重新下单',
      itemsText: '未出餐 · 宫保鸡丁 ×1 等 2 件',
      amountText: '46.00',
      needProof: false,
      noteText: '',
      resolved: false,
      resolveText: '',
    },
    {
      id: 'e_2',
      orderNo: '#20260726029',
      stageText: '已出餐',
      stageTone: 'cooked',
      countdownText: '12:41 申请',
      reasonQuote: '等太久了',
      itemsText: '已出餐可拒绝',
      amountText: '38.00',
      needProof: true,
      noteText: '拒绝需上传出餐凭证，平台将在 2 小时内仲裁。',
      resolved: false,
      resolveText: '',
    },
    {
      id: 'e_3',
      orderNo: '#20260726022',
      stageText: '已处理',
      stageTone: 'done',
      countdownText: '',
      reasonQuote: '',
      itemsText: '',
      amountText: '38.00',
      needProof: false,
      noteText: '',
      resolved: true,
      resolveText: '12:20 同意取消 · 全额退款 ￥38.00',
    },
  ],
  timeout: [
    {
      id: 'e_4',
      orderNo: '#20260726027',
      stageText: '出餐超时',
      stageTone: 'pending',
      countdownText: '已超时 8 分钟',
      reasonQuote: '',
      itemsText: '水煮牛肉 ×1 等 3 件',
      amountText: '96.00',
      needProof: false,
      noteText: '超时超过 15 分钟顾客可一键取消并全额退款。',
      resolved: false,
      resolveText: '',
    },
    {
      id: 'e_5',
      orderNo: '#20260726025',
      stageText: '出餐超时',
      stageTone: 'pending',
      countdownText: '已超时 3 分钟',
      reasonQuote: '',
      itemsText: '清蒸鲈鱼 ×1',
      amountText: '68.00',
      needProof: false,
      noteText: '',
      resolved: false,
      resolveText: '',
    },
  ],
  delivery: [
    {
      id: 'e_6',
      orderNo: '#20260726019',
      stageText: '配送异常',
      stageTone: 'cooked',
      countdownText: '骑手上报 12:52',
      reasonQuote: '顾客电话无人接听',
      itemsText: '已出餐 · 番茄蛋汤 ×1 等 2 件',
      amountText: '52.00',
      needProof: false,
      noteText: '可联系顾客确认，或申请骑手二次配送。',
      resolved: false,
      resolveText: '',
    },
  ],
};

/** 96 核销记录 */
export const verifyStats: VerifyStats = {
  countText: '32 单',
  amountText: '￥1,286',
  pendingText: '4',
};

export const verifyRecords: Record<VerifyLogTab, VerifyRecord[]> = {
  today: [
    {
      id: 'v_1',
      code: '8Q4K',
      title: '#20260726018 · 王**',
      metaText: '12:36 核销 · 店员 小陈',
      amountText: '68.00',
      state: 'done',
    },
    {
      id: 'v_2',
      code: '3M7F',
      title: '#20260726014 · 李**',
      metaText: '12:10 核销 · 店员 小陈',
      amountText: '42.00',
      state: 'done',
    },
    {
      id: 'v_3',
      code: '已废',
      title: '#20260726009 · 张**',
      metaText: '11:52 顾客取消 · 码作废',
      amountText: '0.00',
      state: 'void',
    },
    {
      id: 'v_4',
      code: '6H2P',
      title: '#20260726007 · 待核销（超时未取）',
      metaText: '11:30 备餐完成 · 已超时 66 分钟',
      amountText: '34.00',
      state: 'pending',
    },
  ],
  yesterday: [
    {
      id: 'v_5',
      code: '4T9C',
      title: '#20260725186 · 赵**',
      metaText: '18:42 核销 · 店员 小林',
      amountText: '58.00',
      state: 'done',
    },
  ],
  week: [
    {
      id: 'v_6',
      code: '9K2D',
      title: '#20260722104 · 周**',
      metaText: '7月22日 12:18 核销 · 店员 小陈',
      amountText: '46.00',
      state: 'done',
    },
  ],
};

/** 97 打印机与设备 */
export const deviceSettings: DeviceSettings = {
  devices: [
    {
      id: 'dev_1',
      name: '前台小票机（58mm）',
      statusText: '蓝牙已连接 · 纸量充足',
      online: true,
      actionText: '测试打印',
    },
    {
      id: 'dev_2',
      name: '厨房打印机（80mm）',
      statusText: '离线 · 请检查电源与网络',
      online: false,
      actionText: '重连',
    },
  ],
  autoPrint: true,
  copies: 2,
  voiceOn: true,
  voiceText: '「您有新订单，请及时处理」',
  volumeText: '高',
  scannerText: '未接入',
  noteText: '设备离线超过 5 分钟将转为手机弹窗提醒，避免漏单。',
};

/** 23 优惠活动设置 */
export const promotions: PromotionItem[] = [
  {
    id: 'pr_1',
    kindText: '满减',
    name: '满50减10',
    statusText: '生效中',
    status: 'running',
    sub: '',
    rangeText: '2026-07-01 至 2026-07-31',
    stats: [
      { label: '今日使用', value: '38 次' },
      { label: '带动客单价', value: '+18%' },
      { label: '让利金额', value: '¥380' },
    ],
  },
  {
    id: 'pr_2',
    kindText: '返券',
    name: '评价返 ¥3 无门槛券',
    statusText: '已暂停',
    status: 'paused',
    sub: '顾客完成评价后自动发放，7 天有效',
    rangeText: '',
    stats: [],
  },
];

/** 65 新建满减活动 */
export const promotionDraft: PromotionDraft = {
  id: 'new',
  type: 'full',
  tiers: [
    { id: 't1', threshold: 3000, cut: 500 },
    { id: 't2', threshold: 6000, cut: 1200 },
  ],
  dateText: '7月28日 - 8月31日',
  timeText: '每天 10:30-21:30',
  goodsText: '全部商品',
  budgetText: '￥500',
  estimateText: '预估：客单价 +￥6.2，日均多支出 ￥310。活动上线后顾客端菜单顶部与购物车条同步展示凑单提示。',
};

/** 66 选择适用商品 */
export const promoGoods: PromoGoods[] = [
  { id: 'pg1', name: '宫保鸡丁', priceText: '28.00', categoryName: '经典小炒', checked: true },
  { id: 'pg2', name: '水煮牛肉', priceText: '49.00', categoryName: '招牌热菜', checked: true },
  { id: 'pg3', name: '回锅肉', priceText: '32.00', categoryName: '经典小炒', checked: false },
  { id: 'pg4', name: '麻婆豆腐', priceText: '22.00', categoryName: '经典小炒', checked: false },
  { id: 'pg5', name: '辣子鸡', priceText: '38.00', categoryName: '招牌热菜', checked: false },
  { id: 'pg6', name: '清蒸鲈鱼', priceText: '68.00', categoryName: '海鲜水产', checked: false },
  { id: 'pg7', name: '农家小炒肉拌饭', priceText: '26.00', categoryName: '主食米饭', checked: false },
  { id: 'pg8', name: '番茄蛋汤', priceText: '7.00', categoryName: '汤品饮品', checked: false },
];

/** 94 营销中心 */
export const marketingCenter: MarketingCenter = {
  rangeText: '7月1日 - 7月26日',
  stats: [
    { label: '带动订单', value: '312' },
    { label: '优惠成本', value: '￥2,486' },
    { label: '投产比', value: '5.4' },
  ],
  tools: [
    { key: 'full', badge: '减', label: '满减' },
    { key: 'coupon', badge: '券', label: '优惠券' },
    { key: 'newbie', badge: '新', label: '新客立减' },
    { key: 'discount', badge: '折', label: '折扣商品' },
    { key: 'delivery', badge: '送', label: '配送费减免' },
    { key: 'member', badge: '员', label: '会员日' },
  ],
  activities: [
    { id: 'ma_1', name: '满 60 减 12', sub: '7月20日 - 7月31日 · 已用 186 次', on: true },
    { id: 'ma_2', name: '新客立减 ￥5', sub: '长期有效 · 已用 62 次', on: true },
    { id: 'ma_3', name: '午市 8.8 折', sub: '每日 11:00-14:00 · 已用 64 次', on: true },
  ],
};

/** 95 创建店铺优惠券 */
export const shopCouponDraft: ShopCouponDraft = {
  kind: 'cash',
  amount: 800,
  threshold: 4000,
  totalText: '500 张',
  perUserText: '1 张',
  validText: '领取后 7 天',
  newOnly: false,
  stackable: true,
};

/** 47 评价管理 */
export const merchantReviewSummary: MerchantReviewSummary = {
  score: '4.7',
  dist: [
    { label: '5 星', percent: 78 },
    { label: '4 星', percent: 14 },
    { label: '≤3 星', percent: 8 },
  ],
};

export const merchantReviews: MerchantReview[] = [
  {
    id: 'mr_1',
    user: '吃*王',
    stars: 3,
    timeText: '1 小时前',
    content: '菜品味道不错，但配送有点慢，米饭到手已经凉了。',
    goodsText: '宫保鸡丁 · 米饭',
    reply: '',
    lowScore: true,
  },
  {
    id: 'mr_2',
    user: '李*',
    stars: 5,
    timeText: '昨天',
    content: '水煮牛肉分量足，会回购！',
    goodsText: '水煮牛肉',
    reply: '谢谢支持，欢迎再来～',
    lowScore: false,
  },
  {
    id: 'mr_3',
    user: '匿名用户',
    stars: 2,
    timeText: '7月26日 13:02',
    content: '土豆丝有点咸，而且送到时汤洒了一半，包装能不能再稳一点。',
    goodsText: '酸辣土豆丝 · 番茄蛋汤',
    reply: '',
    lowScore: true,
  },
];

/** 90 评价回复 */
export const reviewReplyTemplates = [
  {
    key: 'sorry',
    label: '致歉 + 补偿券',
    text: '非常抱歉给您带来不好的体验！汤品我们已改用双层密封盒，咸度也会重新校准。已为您补一张 ￥10 无门槛券，期待再次为您服务。',
  },
  { key: 'thanks', label: '感谢建议', text: '感谢您的反馈！我们已记录并会持续改进，期待下次为您服务。' },
  {
    key: 'fixed',
    label: '已改进说明',
    text: '您反馈的问题我们已经改进：包装换成双层密封盒，出餐前会二次检查。欢迎再来体验～',
  },
];

export const reviewReplyTags: Record<string, string[]> = {
  mr_1: ['配送慢', '米饭凉了'],
  mr_3: ['口味偏咸', '包装洒漏'],
};
