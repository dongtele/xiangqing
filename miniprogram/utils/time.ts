/** 秒数 → mm:ss（倒计时展示，服务端时间为准） */
export function mmss(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/** 每秒回调的倒计时器，返回停止函数 */
export function countdown(
  seconds: number,
  onTick: (left: number) => void,
  onEnd?: () => void
): () => void {
  let left = seconds;
  onTick(left);
  const timer = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      clearInterval(timer);
      onTick(0);
      onEnd && onEnd();
      return;
    }
    onTick(left);
  }, 1000);
  return () => clearInterval(timer);
}
