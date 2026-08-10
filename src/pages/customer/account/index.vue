<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getAccountSecurity } from '@/services/api';
import { toast } from '@/utils/nav';
import { useUserStore } from '@/stores/user';
import type { AccountSecurity } from '@/models';

/** 74 · 账号与安全：免密支付与注销都收在这一层，从 44 设置进入 */
const user = useUserStore();
const info = ref<AccountSecurity | null>(null);

onLoad(() => {
  load();
});

async function load(): Promise<void> {
  info.value = await getAccountSecurity();
}

const HINTS: Record<string, string> = {
  wechat: '微信账号已绑定，解绑后无法用微信一键登录',
  phone: '更换手机号需微信短信验证，接后端后开放',
  realname: '实名信息由微信支付提供，不可在此修改',
  payless: '免密支付由微信支付分开通与关闭',
  limit: '单笔免密上限在微信支付分内调整',
  devices: '设备管理接后端后开放',
};

function onRow(key: string): void {
  toast(HINTS[key] || '接后端后开放');
}

/** 注销是不可逆操作，二次确认里再说明一遍后果 */
function onDelete(): void {
  uni.showModal({
    title: '确认注销账号？',
    content: '订单记录、优惠券与积分将被清空且不可恢复',
    confirmText: '仍要注销',
    confirmColor: '#D14343',
    success: (res) => {
      if (!res.confirm) return;
      uni.showModal({
        title: '再次确认',
        content: '注销后 7 天内不可用同一微信重新注册',
        confirmText: '确认注销',
        confirmColor: '#D14343',
        success: (r2) => {
          if (!r2.confirm) return;
          user.logout();
          toast('注销申请已提交');
          setTimeout(() => uni.reLaunch({ url: '/pages/login/index' }), 900);
        },
      });
    },
  });
}
</script>

<template>
  <view v-if="info" class="ac">
    <wf-nav-bar title="账号与安全" />

    <scroll-view class="ac__body" scroll-y>
      <view v-for="(group, gi) in info.rows" :key="gi" class="card card--flat">
        <view v-for="r in group" :key="r.key" class="cell tap" @tap="onRow(r.key)">
          <text class="cell__label">{{ r.label }}</text>
          <view class="cell__value">
            <text :class="{ 'ac__ok': r.tone === 'success' }">{{ r.value }}</text>
            <text v-if="r.tone !== 'success'" class="chevron">›</text>
          </view>
        </view>
      </view>

      <view class="ac__warn">{{ info.warnText }}</view>

      <view class="card ac__delete tap" @tap="onDelete">
        <text class="ac__delete-label">注销账号</text>
        <text class="chevron">›</text>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.ac {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ac__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.card {
  margin-bottom: 20rpx;
}

.ac__ok {
  color: var(--c-success);
  font-weight: 700;
}

.ac__warn {
  background: var(--c-primary-bg);
  border: 1px solid var(--c-primary-line);
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
  font-size: 23rpx;
  color: var(--c-warn-text-2);
  line-height: 1.7;
  margin-bottom: 20rpx;
}

.ac__delete {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.ac__delete-label {
  font-size: 27rpx;
  font-weight: 700;
  color: var(--c-danger);
}
</style>
