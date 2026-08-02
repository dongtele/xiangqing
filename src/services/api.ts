import { request } from './request';
import type {
  AboutInfo,
  AccountSecurity,
  AddressFull,
  AftersaleItem,
  AftersaleOptions,
  AftersaleType,
  BulkGoods,
  BulkTab,
  CartItem,
  Category,
  CategoryRow,
  CheckoutTrial,
  CommentOptions,
  Coupon,
  CouponCenterTab,
  CouponOffer,
  CouponPack,
  CouponRule,
  CouponTab,
  CustomerOrderTab,
  Dashboard,
  DeliveryTrack,
  DeliveryType,
  FeedbackOptions,
  Goods,
  GoodsDraft,
  HelpCenterInfo,
  InvoiceOptions,
  InvoiceTitle,
  LicenseInfo,
  MemberCenter,
  MenuGroup,
  MerchantGoods,
  MerchantOrder,
  MerchantOrderTab,
  MessageDetail,
  MessageItem,
  MessageTab,
  MyReview,
  MyReviewTab,
  NotifySwitch,
  OptionLibGroup,
  Order,
  PickupCodeInfo,
  PickupStore,
  PoiItem,
  PointsGoods,
  PointsGoodsTab,
  PrintSettings,
  ProfileForm,
  ReceiptPreview,
  ReceiptType,
  Refund,
  RefundTrial,
  RemarkOptions,
  Review,
  ReviewSummary,
  Rider,
  RiderMessage,
  SettingsInfo,
  Shop,
  ShopProfile,
  StockGoods,
  StockTab,
  SupportMessage,
  UserProfile,
} from '@/models';

/** 按域分组的接口函数，是页面访问数据的唯一出口。 */

/* ---------------- 账号 ---------------- */

export const login = (): Promise<UserProfile> =>
  request<UserProfile>('/auth/login', {}, { method: 'POST', loading: true });

/* ---------------- 顾客端 · 浏览选餐 ---------------- */

export const getShop = (): Promise<Shop> => request<Shop>('/shop');

export const getMenu = (): Promise<{ categories: Category[]; groups: MenuGroup[] }> =>
  request('/menu');

export const getGoods = (id: string): Promise<Goods> => request<Goods>('/goods/detail', { id });

export const searchGoods = (keyword: string): Promise<{ list: Goods[]; hotWords: string[] }> =>
  request('/goods/search', { keyword });

export const getShopProfile = (): Promise<ShopProfile> => request('/shop/profile');

export const getShopReviews = (
  filter: string
): Promise<{ summary: ReviewSummary; list: Review[] }> => request('/shop/reviews', { filter });

export const getLicenseInfo = (): Promise<LicenseInfo> => request('/shop/license');

/* ---------------- 顾客端 · 结算支付 ---------------- */

export const getRemarkOptions = (): Promise<RemarkOptions> => request('/remark/options');

export const getAddresses = (): Promise<AddressFull[]> => request('/address/list');

export const getAddress = (id: string): Promise<AddressFull | null> =>
  request('/address/detail', { id });

export const saveAddress = (address: AddressFull): Promise<{ ok: boolean }> =>
  request('/address/save', address as unknown as Record<string, unknown>, {
    method: 'POST',
    loading: true,
  });

export const removeAddress = (id: string): Promise<{ ok: boolean }> =>
  request('/address/remove', { id }, { method: 'POST' });

export const setDefaultAddress = (id: string): Promise<{ ok: boolean }> =>
  request('/address/default', { id }, { method: 'POST', silent: true });

export const getPois = (): Promise<PoiItem[]> => request('/map/pois');

export const getPickupStores = (): Promise<PickupStore[]> => request('/pickup/stores');

export const trialCheckout = (
  items: CartItem[],
  deliveryType: DeliveryType
): Promise<CheckoutTrial> =>
  request<CheckoutTrial>(
    '/checkout/trial',
    { items, deliveryType } as unknown as Record<string, unknown>,
    { method: 'POST' }
  );

export const createOrder = (
  items: CartItem[],
  deliveryType: DeliveryType,
  remark: string
): Promise<{ orderId: string }> =>
  request(
    '/order/create',
    { items, deliveryType, remark } as unknown as Record<string, unknown>,
    { method: 'POST', loading: true }
  );

export const payOrder = (
  orderId: string,
  method: string
): Promise<{ success: boolean; message?: string }> =>
  request('/order/pay', { orderId, method }, { method: 'POST' });

/* ---------------- 顾客端 · 订单 ---------------- */

export const getOrders = (tab: CustomerOrderTab): Promise<Order[]> =>
  request<Order[]>('/order/list', { tab });

export const getOrder = (id: string): Promise<Order> => request<Order>('/order/detail', { id });

/* ---------------- 顾客端 · 取餐 / 评价 / 发票 / 客服 ---------------- */

export const getPickupCode = (orderId: string): Promise<PickupCodeInfo | null> =>
  request('/order/pickup-code', { id: orderId });

export const getCommentOptions = (): Promise<CommentOptions> => request('/comment/options');

export const submitComment = (payload: {
  orderId: string;
  stars: number;
  tags: string[];
  text: string;
  photos: string[];
  anonymous: boolean;
}): Promise<{ ok: boolean }> =>
  request('/comment/submit', payload as unknown as Record<string, unknown>, {
    method: 'POST',
    loading: true,
  });

export const getMyReviews = (): Promise<{
  list: MyReview[];
  counts: Record<MyReviewTab, number>;
}> => request('/comment/mine');

export const removeMyReview = (id: string): Promise<{ ok: boolean }> =>
  request('/comment/remove', { id }, { method: 'POST' });

export const getInvoiceOptions = (): Promise<InvoiceOptions> => request('/invoice/options');

export const getInvoiceTitles = (): Promise<InvoiceTitle[]> => request('/invoice/titles');

export const setDefaultInvoiceTitle = (id: string): Promise<{ ok: boolean }> =>
  request('/invoice/title/default', { id }, { method: 'POST', silent: true });

export const removeInvoiceTitle = (id: string): Promise<{ ok: boolean }> =>
  request('/invoice/title/remove', { id }, { method: 'POST' });

export const applyInvoice = (payload: Record<string, unknown>): Promise<{ ok: boolean }> =>
  request('/invoice/apply', payload, { method: 'POST', loading: true });

export const getSupportChat = (): Promise<{
  messages: SupportMessage[];
  quickReplies: string[];
}> => request('/support/chat');

export const sendSupportMessage = (text: string): Promise<{ messages: SupportMessage[] }> =>
  request('/support/send', { text }, { method: 'POST' });

export const getHelpCenter = (): Promise<HelpCenterInfo> => request('/help/center');

export const getFeedbackOptions = (): Promise<FeedbackOptions> => request('/feedback/options');

export const submitFeedback = (payload: Record<string, unknown>): Promise<{ ok: boolean }> =>
  request('/feedback/submit', payload, { method: 'POST', loading: true });

/* ---------------- 顾客端 · 配送与联系骑手 ---------------- */

export const getDeliveryTrack = (orderId: string): Promise<DeliveryTrack | null> =>
  request('/delivery/track', { orderId });

export const getRiderChat = (
  orderId: string
): Promise<{ rider: Rider | null; messages: RiderMessage[]; quickReplies: string[] }> =>
  request('/rider/chat', { orderId });

export const sendRiderMessage = (
  orderId: string,
  text: string
): Promise<{ messages: RiderMessage[] }> =>
  request('/rider/chat/send', { orderId, text }, { method: 'POST' });

/* ---------------- 顾客端 · 售后与退款 ---------------- */

export const getAftersaleOptions = (orderId: string): Promise<AftersaleOptions | null> =>
  request('/aftersale/options', { orderId });

export const trialRefund = (orderId: string, items: AftersaleItem[]): Promise<RefundTrial> =>
  request('/aftersale/trial', { orderId, items } as unknown as Record<string, unknown>, {
    method: 'POST',
  });

export const applyAftersale = (payload: {
  orderId: string;
  type: AftersaleType;
  reason: string;
  desc: string;
  photos: string[];
  items: AftersaleItem[];
}): Promise<{ refundId: string }> =>
  request('/aftersale/apply', payload as unknown as Record<string, unknown>, {
    method: 'POST',
    loading: true,
  });

export const getRefund = (id: string): Promise<Refund | null> => request('/refund/detail', { id });

export const cancelRefund = (id: string): Promise<{ ok: boolean }> =>
  request('/refund/cancel', { id }, { method: 'POST' });

/* ---------------- 商家端 ---------------- */

export const getDashboard = (): Promise<Dashboard> => request<Dashboard>('/merchant/dashboard');

/* ---------------- 商家端 · 退款审核 ---------------- */

export const getMerchantRefund = (id: string): Promise<Refund | null> =>
  request('/merchant/refund/detail', { id });

export const approveRefund = (id: string): Promise<{ ok: boolean }> =>
  request('/merchant/refund/approve', { id }, { method: 'POST', loading: true });

export const rejectRefund = (id: string, reason: string): Promise<{ ok: boolean }> =>
  request('/merchant/refund/reject', { id, reason }, { method: 'POST', loading: true });

export const getMerchantOrders = (
  tab: MerchantOrderTab
): Promise<{ list: MerchantOrder[]; counts: Record<MerchantOrderTab, number> }> =>
  request('/merchant/orders', { tab });

export const getMerchantOrder = (
  id: string
): Promise<{ order: MerchantOrder; countdownText: string } | null> =>
  request('/merchant/order/detail', { id });

export const acceptOrder = (id: string): Promise<{ ok: boolean; autoPrinted: boolean }> =>
  request('/merchant/order/accept', { id }, { method: 'POST' });

export const rejectOrder = (id: string): Promise<{ ok: boolean }> =>
  request('/merchant/order/reject', { id }, { method: 'POST' });

export const finishOrder = (id: string): Promise<{ ok: boolean }> =>
  request('/merchant/order/finish', { id }, { method: 'POST' });

/* ---------------- 商家端 · 小票打印 ---------------- */

export const getPrintSettings = (): Promise<PrintSettings> =>
  request<PrintSettings>('/merchant/print/settings');

export const updatePrintSettings = (patch: Partial<PrintSettings>): Promise<PrintSettings> =>
  request<PrintSettings>('/merchant/print/settings/update', patch as Record<string, unknown>, {
    method: 'POST',
  });

export const getReceipt = (orderId: string, type: ReceiptType): Promise<ReceiptPreview | null> =>
  request('/merchant/print/receipt', { orderId, type });

/** 补打 / 测试打印；type 省略时按「打印联数」设置一次性送打 */
export const printReceipt = (
  orderId: string,
  type?: ReceiptType
): Promise<{ ok: boolean; message?: string }> =>
  request('/merchant/print', { orderId, type }, { method: 'POST', silent: true });

/* ---------------- 商家端 · 商品与菜单 ---------------- */

export const getGoodsDraft = (id: string): Promise<GoodsDraft | null> =>
  request('/merchant/goods/detail', { id });

export const saveGoodsDraft = (draft: GoodsDraft): Promise<{ ok: boolean }> =>
  request('/merchant/goods/save', draft as unknown as Record<string, unknown>, {
    method: 'POST',
    loading: true,
  });

export const getOptionLib = (): Promise<OptionLibGroup[]> => request('/merchant/option-lib');

export const toggleLibOption = (groupId: string, optionId: string): Promise<{ ok: boolean }> =>
  request('/merchant/option-lib/toggle', { groupId, optionId }, { method: 'POST', silent: true });

export const getCategoryRows = (): Promise<CategoryRow[]> => request('/merchant/categories');

export const moveCategory = (from: number, to: number): Promise<{ ok: boolean }> =>
  request('/merchant/categories/move', { from, to }, { method: 'POST', silent: true });

export const saveCategory = (id: string, name: string): Promise<{ ok: boolean }> =>
  request('/merchant/categories/save', { id, name }, { method: 'POST' });

export const getStockGoods = (): Promise<{
  list: StockGoods[];
  counts: Record<StockTab, number>;
}> => request('/merchant/stock');

export const toggleStock = (id: string): Promise<{ ok: boolean }> =>
  request('/merchant/stock/toggle', { id }, { method: 'POST', silent: true });

export const restoreAllStock = (): Promise<{ ok: boolean }> =>
  request('/merchant/stock/restore-all', {}, { method: 'POST' });

export const getBulkGoods = (
  tab: BulkTab
): Promise<{ list: BulkGoods[]; counts: Record<BulkTab, number> }> =>
  request('/merchant/goods/bulk', { tab });

export const bulkAction = (
  ids: string[],
  action: 'on' | 'off' | 'category' | 'delete'
): Promise<{ ok: boolean; count: number }> =>
  request('/merchant/goods/bulk-action', { ids, action } as unknown as Record<string, unknown>, {
    method: 'POST',
    loading: true,
  });

export const getMerchantGoods = (
  categoryName?: string
): Promise<{ list: MerchantGoods[]; categories: string[] }> =>
  request('/merchant/goods', { categoryName });

export const setGoodsOnSale = (id: string, onSale: boolean): Promise<{ ok: boolean }> =>
  request('/merchant/goods/onsale', { id, onSale }, { method: 'POST' });

export const getShopSettings = (): Promise<Shop> => request<Shop>('/merchant/shop');

export const updateShopSettings = (patch: Partial<Shop>): Promise<Shop> =>
  request<Shop>('/merchant/shop/update', patch as Record<string, unknown>, { method: 'POST' });

/* ---------------- 顾客端 · 卡券会员与设置账号 ---------------- */

export const getProfileForm = (): Promise<ProfileForm> => request('/customer/profile-form');

export const saveProfileForm = (patch: Partial<ProfileForm>): Promise<{ ok: boolean }> =>
  request('/customer/profile-form', patch as Record<string, unknown>, {
    method: 'POST',
    loading: true,
  });

export const toggleTaste = (key: string): Promise<{ ok: boolean }> =>
  request('/customer/profile-form/taste', { key }, { method: 'POST', silent: true });

export const getMessages = (
  tab: MessageTab
): Promise<{ list: MessageItem[]; counts: Record<MessageTab, number>; unread: number }> =>
  request('/customer/messages', { tab });

export const readAllMessages = (): Promise<{ ok: boolean }> =>
  request('/customer/messages/read-all', {}, { method: 'POST', silent: true });

export const getMessageDetail = (id: string): Promise<MessageDetail | null> =>
  request('/customer/message-detail', { id });

export const getCoupons = (
  tab: CouponTab
): Promise<{ list: Coupon[]; counts: Record<CouponTab, number> }> =>
  request('/customer/coupons', { tab });

export const getCouponRule = (id: string): Promise<CouponRule | null> =>
  request('/customer/coupon-rule', { id });

export const redeemCouponCode = (code: string): Promise<{ ok: boolean; message: string }> =>
  request('/customer/coupons/redeem', { code }, { method: 'POST', loading: true });

export const getCouponCenter = (
  tab: CouponCenterTab
): Promise<{ pack: CouponPack; list: CouponOffer[] }> => request('/customer/coupon-center', { tab });

export const takeCoupon = (id: string): Promise<{ ok: boolean; message: string }> =>
  request('/customer/coupon-center/take', { id }, { method: 'POST' });

export const takeCouponPack = (): Promise<{ ok: boolean; message: string }> =>
  request('/customer/coupon-center/take-pack', {}, { method: 'POST', loading: true });

export const getMemberCenter = (): Promise<MemberCenter> => request('/customer/member');

export const signIn = (): Promise<{ ok: boolean; message: string }> =>
  request('/customer/member/signin', {}, { method: 'POST' });

export const getPointsGoods = (
  tab: PointsGoodsTab
): Promise<{ points: string; list: PointsGoods[] }> => request('/customer/points-goods', { tab });

export const redeemPointsGoods = (id: string): Promise<{ ok: boolean; message: string }> =>
  request('/customer/points-goods/redeem', { id }, { method: 'POST', loading: true });

export const getSettings = (): Promise<SettingsInfo> => request('/customer/settings');

export const getAccountSecurity = (): Promise<AccountSecurity> =>
  request('/customer/account-security');

export const getNotifySwitches = (): Promise<NotifySwitch[]> => request('/customer/notify-settings');

export const setNotifySwitch = (key: string, on: boolean): Promise<{ ok: boolean }> =>
  request('/customer/notify-settings', { key, on }, { method: 'POST', silent: true });

export const getAbout = (): Promise<AboutInfo> => request('/customer/about');
