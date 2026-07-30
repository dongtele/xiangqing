import { getRiderChat, sendRiderMessage } from '../../../services/api';
import { toast } from '../../../utils/nav';
import type { Rider, RiderMessage } from '../../../models/index';

/** 84 · 联系骑手：虚拟号通话 + 快捷短语 IM */
Page({
  data: {
    rider: null as Rider | null,
    messages: [] as RiderMessage[],
    quickReplies: [] as string[],
    draft: '',
    scrollInto: '',
    loading: true,
  },

  orderId: '',

  onLoad(options: Record<string, string | undefined>) {
    this.orderId = options.id || '';
  },

  onShow() {
    this.load();
  },

  async load() {
    const res = await getRiderChat(this.orderId);
    this.setData({
      rider: res.rider,
      messages: res.messages,
      quickReplies: res.quickReplies,
      loading: false,
      scrollInto: res.messages.length ? `msg-${res.messages[res.messages.length - 1].id}` : '',
    });
  },

  onInput(e: WechatMiniprogram.Input) {
    this.setData({ draft: e.detail.value });
  },

  onQuickReply(e: WechatMiniprogram.TouchEvent) {
    const { text } = e.currentTarget.dataset as { text: string };
    this.send(text);
  },

  onSend() {
    this.send(this.data.draft.trim());
  },

  async send(text: string) {
    if (!text) return;
    const res = await sendRiderMessage(this.orderId, text);
    this.setData({
      messages: res.messages,
      draft: '',
      scrollInto: `msg-${res.messages[res.messages.length - 1].id}`,
    });
  },

  /** 虚拟号拨号，保护双方隐私 */
  onCall() {
    const rider = this.data.rider;
    if (!rider) return;
    wx.makePhoneCall({
      phoneNumber: rider.virtualPhone,
      fail: () => toast('拨号已取消'),
    });
  },
});
