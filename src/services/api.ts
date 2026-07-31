import { request } from './request';
import type {
  AftersaleItem,
  AftersaleOptions,
  AftersaleType,
  BulkGoods,
  BulkTab,
  CartItem,
  Category,
  CategoryRow,
  DeliveryTrack,
  GoodsDraft,
  OptionLibGroup,
  StockGoods,
  StockTab,
  CheckoutTrial,
  CustomerOrderTab,
  Dashboard,
  DeliveryType,
  Goods,
  MenuGroup,
  MerchantGoods,
  MerchantOrder,
  MerchantOrderTab,
  Order,
  PrintSettings,
  ReceiptPreview,
  ReceiptType,
  Refund,
  RefundTrial,
  Rider,
  RiderMessage,
  Shop,
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

/* ---------------- 顾客端 · 结算支付 ---------------- */

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
