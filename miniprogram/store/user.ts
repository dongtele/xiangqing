import { Store } from './base';
import type { Role, UserProfile } from '../models/index';

const STORAGE_KEY = 'wwf_user';

interface UserState {
  logged: boolean;
  role: Role;
  profile: UserProfile | null;
}

interface Persisted {
  role: Role;
  profile: UserProfile;
}

class UserStore extends Store<UserState> {
  constructor() {
    super({ logged: false, role: 'customer', profile: null });
    this.restore();
  }

  private restore(): void {
    const cached = wx.getStorageSync(STORAGE_KEY) as Persisted | '';
    if (cached && cached.profile) {
      this.setState({ logged: true, role: cached.role, profile: cached.profile });
    }
  }

  private persist(): void {
    const { role, profile } = this.get();
    if (!profile) {
      wx.removeStorageSync(STORAGE_KEY);
      return;
    }
    wx.setStorageSync(STORAGE_KEY, { role, profile } as Persisted);
  }

  login(profile: UserProfile, role: Role = 'customer'): void {
    this.setState({ logged: true, profile, role });
    this.persist();
  }

  /** 顾客端 ⇄ 商家端 角色切换（同一账号双身份） */
  switchRole(role: Role): void {
    this.setState({ role });
    this.persist();
  }

  logout(): void {
    this.setState({ logged: false, profile: null, role: 'customer' });
    wx.removeStorageSync(STORAGE_KEY);
  }
}

export const userStore = new UserStore();
