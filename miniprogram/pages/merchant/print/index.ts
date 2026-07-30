import {
  getPrintSettings,
  getReceipt,
  printReceipt,
  updatePrintSettings,
} from '../../../services/api';
import { toast } from '../../../utils/nav';
import type { PrintSettings, ReceiptPreview, ReceiptType } from '../../../models/index';

const COPY_OPTIONS = [
  { copies: 1, label: '1 联（仅后厨联）' },
  { copies: 2, label: '2 联（后厨联 + 顾客联）' },
  { copies: 3, label: '3 联（加打配送联）' },
];

const WIDTH_OPTIONS = ['58mm', '80mm'];

/** 51 · 小票打印：设备状态、打印设置、顾客联 / 后厨联预览与补打 */
Page({
  data: {
    settings: null as PrintSettings | null,
    tabs: [
      { key: 'kitchen', label: '后厨联' },
      { key: 'customer', label: '顾客联' },
    ],
    activeTab: 'kitchen' as ReceiptType,
    receipt: null as ReceiptPreview | null,
    /** 无订单时只做打印设置，不展示补打 */
    hasOrder: false,
    loading: true,
  },

  orderId: '',

  onLoad(options: Record<string, string | undefined>) {
    this.orderId = options.orderId || '';
    this.setData({ hasOrder: !!this.orderId });
  },

  onShow() {
    this.load();
  },

  async load() {
    const settings = await getPrintSettings();
    this.setData({ settings, loading: false });
    await this.loadReceipt();
  },

  async loadReceipt() {
    if (!this.orderId) return;
    const receipt = await getReceipt(this.orderId, this.data.activeTab);
    this.setData({ receipt });
  },

  onSwitchTab(e: WechatMiniprogram.TouchEvent) {
    const { key } = e.currentTarget.dataset as { key: ReceiptType };
    if (key === this.data.activeTab) return;
    this.setData({ activeTab: key }, () => this.loadReceipt());
  },

  async onToggleAuto(e: WechatMiniprogram.CustomEvent) {
    const { on } = e.detail as { on: boolean };
    const settings = await updatePrintSettings({ autoPrint: on });
    this.setData({ settings });
    toast(on ? '接单后将自动打印后厨联' : '已关闭自动打印，注意手动补打');
  },

  async onToggleRemark(e: WechatMiniprogram.CustomEvent) {
    const { on } = e.detail as { on: boolean };
    const settings = await updatePrintSettings({ printRemark: on });
    this.setData({ settings });
    await this.loadReceipt();
  },

  onPickCopies() {
    wx.showActionSheet({
      itemList: COPY_OPTIONS.map((o) => o.label),
      success: async (res) => {
        const picked = COPY_OPTIONS[res.tapIndex];
        const settings = await updatePrintSettings({ copies: picked.copies });
        this.setData({ settings });
      },
    });
  },

  onPickWidth() {
    wx.showActionSheet({
      itemList: WIDTH_OPTIONS,
      success: async (res) => {
        const settings = await updatePrintSettings({ width: WIDTH_OPTIONS[res.tapIndex] });
        this.setData({ settings });
      },
    });
  },

  onManageDevice() {
    toast('打印机与设备（97）在后续步骤实现');
  },

  /** 右上角「测试打印」：不依赖订单，走设备自检 */
  async onTestPrint() {
    if (!this.data.settings) return;
    if (!this.data.settings.device.online) {
      toast('打印机离线，请检查蓝牙连接');
      return;
    }
    if (!this.orderId) {
      toast(`已向${this.data.settings.device.name}发送测试页`);
      return;
    }
    const res = await printReceipt(this.orderId, this.data.activeTab);
    toast(res.message || '已发送测试页', res.ok ? 'success' : 'none');
  },

  /** 按「打印联数」一次性补打 */
  async onReprint() {
    const res = await printReceipt(this.orderId);
    toast(res.message || (res.ok ? '已补打' : '补打失败'), res.ok ? 'success' : 'none');
  },
});
