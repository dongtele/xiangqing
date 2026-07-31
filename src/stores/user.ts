import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Role, UserProfile } from '@/models';

const STORAGE_KEY = 'wwf_user';

interface Persisted {
  role: Role;
  profile: UserProfile;
}

/**
 * 登录态与角色。
 * 角色决定进哪一端的 TabBar，必须持久化：冷启动时 login 页要能直接分流，
 * 不然每次都会被打回授权页。
 */
export const useUserStore = defineStore('user', () => {
  const logged = ref(false);
  const role = ref<Role>('customer');
  const profile = ref<UserProfile | null>(null);

  const cached = uni.getStorageSync(STORAGE_KEY) as Persisted | '';
  if (cached && cached.profile) {
    logged.value = true;
    role.value = cached.role;
    profile.value = cached.profile;
  }

  const isMerchant = computed(() => !!profile.value?.isMerchant);

  function persist(): void {
    if (!profile.value) {
      uni.removeStorageSync(STORAGE_KEY);
      return;
    }
    uni.setStorageSync(STORAGE_KEY, { role: role.value, profile: profile.value } as Persisted);
  }

  function login(next: UserProfile, nextRole: Role = 'customer'): void {
    logged.value = true;
    profile.value = next;
    role.value = nextRole;
    persist();
  }

  /** 顾客端 ⇄ 商家端 角色切换（同一账号双身份） */
  function switchRole(next: Role): void {
    role.value = next;
    persist();
  }

  function logout(): void {
    logged.value = false;
    profile.value = null;
    role.value = 'customer';
    uni.removeStorageSync(STORAGE_KEY);
  }

  return { logged, role, profile, isMerchant, login, switchRole, logout };
});
