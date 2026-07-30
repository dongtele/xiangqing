import { getShopSettings, updateShopSettings } from '../../../services/api';
import { chrome } from '../../../utils/chrome';
import { toast } from '../../../utils/nav';
import { userStore } from '../../../store/user';
import type { Shop } from '../../../models/index';

/** 12 · 店铺中心：商家侧「我的」总入口，含营业开关与角色回切 */
Page({
  data: {
    headPad: 100,
    shop: null as Shop | null,
    loading: true,
  },

  onLoad() {
    this.setData({ headPad: chrome().capsuleBottom + 20 });
  },

  onShow() {
    this.load();
  },

  async load() {
    const shop = await getShopSettings();
    this.setData({ shop, loading: false });
  },

  async onToggleOpen(e: WechatMiniprogram.CustomEvent) {
    const { on } = e.detail as { on: boolean };
    const shop = await updateShopSettings({ open: on });
    this.setData({ shop });
    toast(on ? '已开始营业' : '已暂停营业，顾客端将显示休息中');
  },

  async onToggleAlert(e: WechatMiniprogram.CustomEvent) {
    const { on } = e.detail as { on: boolean };
    const shop = await updateShopSettings({ newOrderAlert: on });
    this.setData({ shop });
  },

  onTapCell(e: WechatMiniprogram.TouchEvent) {
    const { key } = e.currentTarget.dataset as { key: string };
    const map: Record<string, string> = {
      info: '店铺信息编辑（71）',
      hours: '营业设置（50）',
      delivery: '配送范围与运费（33）',
      activity: '优惠活动设置（23）',
      license: '资质更新与年审（72）',
      staff: '员工账号（35）',
    };
    toast(`${map[key] || '该页面'}在后续步骤实现`);
  },

  /** 切回顾客视角，完成角色闭环 */
  onSwitchToCustomer() {
    userStore.switchRole('customer');
    getApp<IAppOption>().gotoRoleHome('customer');
  },
});
