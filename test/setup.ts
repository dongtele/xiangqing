/**
 * 测试环境的 uni 桩。
 *
 * `services/mock/**` 完全不碰 uni，可以直接 import 来测业务规则；
 * 需要桩的只有 store 用到的存储三件套（cart / user 会持久化）。
 * 每个测例前 `resetUniStorage()` 清一次，避免跨测例串数据。
 */
const storage = new Map<string, unknown>();

export function resetUniStorage(): void {
  storage.clear();
}

const uniStub = {
  getStorageSync(key: string): unknown {
    return storage.has(key) ? storage.get(key) : '';
  },
  setStorageSync(key: string, value: unknown): void {
    storage.set(key, value);
  },
  removeStorageSync(key: string): void {
    storage.delete(key);
  },
  showToast(): void {},
  showLoading(): void {},
  hideLoading(): void {},
};

(globalThis as unknown as { uni: typeof uniStub }).uni = uniStub;
