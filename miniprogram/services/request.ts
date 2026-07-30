import { USE_MOCK } from './mock/config';
import { mockResolve } from './mock/index';

/**
 * 统一请求层：登录态注入、401 重新授权、loading / 错误 toast 收口。
 * USE_MOCK 为 true 时走本地 mock 路由，接后端只需把 BASE_URL 填上并关掉开关。
 */
const BASE_URL = 'https://api.example.com';

let pendingLoading = 0;

function showLoading(): void {
  pendingLoading += 1;
  if (pendingLoading === 1) wx.showLoading({ title: '加载中', mask: true });
}

function hideLoading(): void {
  pendingLoading = Math.max(0, pendingLoading - 1);
  if (pendingLoading === 0) wx.hideLoading();
}

export interface RequestOptions {
  method?: 'GET' | 'POST';
  /** 是否展示全局 loading */
  loading?: boolean;
  /** 失败时是否自动 toast */
  silent?: boolean;
}

export function request<T>(
  path: string,
  data: Record<string, unknown> = {},
  options: RequestOptions = {}
): Promise<T> {
  const method = options.method || 'GET';
  if (options.loading) showLoading();

  const done = (): void => {
    if (options.loading) hideLoading();
  };

  const fail = (err: Error): never => {
    if (!options.silent) wx.showToast({ title: err.message || '网络异常', icon: 'none' });
    throw err;
  };

  if (USE_MOCK) {
    return mockResolve<T>(`${method} ${path}`, data)
      .then((res) => {
        done();
        return res;
      })
      .catch((err: Error) => {
        done();
        return fail(err);
      });
  }

  return new Promise<T>((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}`,
      method,
      data,
      header: { 'x-token': (wx.getStorageSync('wwf_token') as string) || '' },
      success(res) {
        done();
        const body = res.data as { code: number; data: T; message?: string };
        if (res.statusCode === 401) {
          // 登录态失效：回到授权页重新走一次登录分流
          wx.reLaunch({ url: '/pages/login/index' });
          reject(new Error('登录已过期'));
          return;
        }
        if (res.statusCode !== 200 || body.code !== 0) {
          reject(new Error(body.message || '请求失败'));
          return;
        }
        resolve(body.data);
      },
      fail(err) {
        done();
        reject(new Error(err.errMsg || '网络异常'));
      },
    });
  }).catch(fail);
}
