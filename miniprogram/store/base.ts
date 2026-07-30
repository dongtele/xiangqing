/**
 * 极简 observable store。
 * 页面在 onLoad 订阅、onUnload 退订；不引第三方状态库，保持小程序包体最小。
 */
export type Listener<T> = (state: T) => void;

export class Store<T extends object> {
  protected state: T;
  private listeners = new Set<Listener<T>>();

  constructor(initial: T) {
    this.state = initial;
  }

  get(): Readonly<T> {
    return this.state;
  }

  setState(patch: Partial<T>): void {
    this.state = { ...this.state, ...patch };
    this.notify();
  }

  subscribe(fn: Listener<T>): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => {
      this.listeners.delete(fn);
    };
  }

  protected notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }
}
