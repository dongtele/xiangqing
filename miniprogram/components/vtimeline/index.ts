/** 竖向时间轴：退款进度（40）、入驻审核（24 / 28）共用 */
Component({
  options: { virtualHost: true },

  properties: {
    /** [{ title, sub, done }] */
    nodes: { type: Array, value: [] as { title: string; sub: string; done: boolean }[] },
  },
});
