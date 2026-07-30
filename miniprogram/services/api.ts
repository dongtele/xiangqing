import { request } from './request';
import type {
  Category,
  CartItem,
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
  Shop,
  UserProfile,
} from '../models/index';

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
  request<CheckoutTrial>('/checkout/trial', { items, deliveryType }, { method: 'POST' });

export const createOrder = (
  items: CartItem[],
  deliveryType: DeliveryType,
  remark: string
): Promise<{ orderId: string }> =>
  request('/order/create', { items, deliveryType, remark }, { method: 'POST', loading: true });

export const payOrder = (
  orderId: string,
  method: string
): Promise<{ success: boolean; message?: string }> =>
  request('/order/pay', { orderId, method }, { method: 'POST' });

/* ---------------- 顾客端 · 订单 ---------------- */

export const getOrders = (tab: CustomerOrderTab): Promise<Order[]> =>
  request<Order[]>('/order/list', { tab });

export const getOrder = (id: string): Promise<Order> => request<Order>('/order/detail', { id });

/* ---------------- 商家端 ---------------- */

export const getDashboard = (): Promise<Dashboard> => request<Dashboard>('/merchant/dashboard');

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

export const getMerchantGoods = (
  categoryName?: string
): Promise<{ list: MerchantGoods[]; categories: string[] }> =>
  request('/merchant/goods', { categoryName });

export const setGoodsOnSale = (id: string, onSale: boolean): Promise<{ ok: boolean }> =>
  request('/merchant/goods/onsale', { id, onSale }, { method: 'POST' });

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

/* ---------------- 商家端 · 店铺设置 ---------------- */

export const getShopSettings = (): Promise<Shop> => request<Shop>('/merchant/shop');

export const updateShopSettings = (patch: Partial<Shop>): Promise<Shop> =>
  request<Shop>('/merchant/shop/update', patch as Record<string, unknown>, { method: 'POST' });
