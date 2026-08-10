<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { login } from '@/services/api';
import { chrome } from '@/utils/chrome';
import { useUserStore } from '@/stores/user';
import { gotoRoleHome, relaunch, toast } from '@/utils/nav';

/** 13 · 微信授权登录 —— 支持「先逛后登」，下单时再触发授权 */
const user = useUserStore();

const permissions = [
  { title: '获取你的手机号', sub: '用于账户服务及订单联系' },
  { title: '获取你的昵称、头像', sub: '用于个人中心展示' },
];

const topPad = ref(170);
const loading = ref(false);

onLoad(() => {
  topPad.value = chrome().capsuleBottom + 90;
  if (user.logged) {
    // 已登录：直接按角色分流，不再停留在授权页
    gotoRoleHome(user.role);
  }
});

async function doLogin(): Promise<void> {
  if (loading.value) return;
  loading.value = true;
  try {
    const profile = await login();
    user.login(profile, 'customer');
    gotoRoleHome('customer');
  } finally {
    loading.value = false;
  }
}

/** 真机上由 <button open-type="getPhoneNumber"> 触发 */
function onGetPhone(e: { detail?: { errMsg?: string } }): void {
  const errMsg = e && e.detail ? e.detail.errMsg : '';
  if (errMsg && errMsg.indexOf('ok') < 0) {
    toast('已取消授权，可先逛逛再登录');
    return;
  }
  doLogin();
}

function onSkip(): void {
  relaunch('/pages/customer/menu/index');
}

function onAgreement(): void {
  toast('协议详情见「关于美味坊」（78）');
}
</script>

<template>
  <view class="login">
    <view class="login__main" :style="{ paddingTop: topPad + 'px' }">
      <view class="login__logo">
        <text class="login__logo-text">味</text>
      </view>
      <text class="login__brand">美味坊小店</text>
      <text class="login__hint">申请获取以下权限用于账户服务</text>

      <view class="login__perms">
        <view v-for="p in permissions" :key="p.title" class="login__perm">
          <view class="login__dot" />
          <view class="login__perm-text">
            <text class="login__perm-title">{{ p.title }}</text>
            <text class="login__perm-sub">{{ p.sub }}</text>
          </view>
        </view>
      </view>

      <view class="login__actions">
        <!-- #ifdef MP-WEIXIN -->
        <button
          class="login__btn login__btn--wechat"
          open-type="getPhoneNumber"
          :loading="loading"
          @getphonenumber="onGetPhone"
        >
          手机号快捷登录
        </button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <!-- 非微信端没有手机号授权能力，走同一个 login()，保证 H5 预览与后续多端一致 -->
        <view class="login__btn login__btn--wechat tap" @tap="doLogin">手机号快捷登录</view>
        <!-- #endif -->
        <view class="login__btn login__btn--ghost tap" @tap="onSkip">暂不登录，先逛逛</view>
      </view>
    </view>

    <view class="login__footer">
      <text>登录即代表同意 </text>
      <text class="login__link" @tap="onAgreement">《用户服务协议》</text>
      <text>及</text>
      <text class="login__link" @tap="onAgreement">《隐私政策》</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
page {
  background: #ffffff;
}

.login {
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

.login__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-left: 64rpx;
  padding-right: 64rpx;
}

.login__logo {
  width: 164rpx;
  height: 164rpx;
  border-radius: 48rpx;
  background: var(--grad-main);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20rpx 52rpx rgba(255, 61, 0, 0.3);
}

.login__logo-text {
  color: #fff;
  font-size: 68rpx;
  font-weight: 800;
}

.login__brand {
  font-size: 44rpx;
  font-weight: 800;
  margin-top: 36rpx;
}

.login__hint {
  font-size: 25rpx;
  color: var(--c-text-weak);
  margin-top: 16rpx;
  line-height: 1.7;
}

.login__perms {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  margin-top: 72rpx;
}

.login__perm {
  display: flex;
  gap: 24rpx;
}

.login__dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: var(--c-text-placeholder);
  margin-top: 14rpx;
  flex-shrink: 0;
}

.login__perm-text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.login__perm-title {
  font-size: 28rpx;
  font-weight: 700;
}

.login__perm-sub {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.login__actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  margin-top: 104rpx;
}

.login__btn {
  width: 100%;
  text-align: center;
  font-size: 30rpx;
  padding: 28rpx 0;
  border-radius: 28rpx;
  line-height: 1.4;
  margin: 0;
}

.login__btn::after {
  border: none;
}

.login__btn--wechat {
  background: var(--c-success);
  color: #fff;
  font-weight: 800;
}

.login__btn--ghost {
  background: #f4f2ee;
  color: var(--c-text-2);
  font-weight: 700;
}

.login__footer {
  flex-shrink: 0;
  padding: 0 64rpx 88rpx;
  text-align: center;
  font-size: 21rpx;
  color: var(--c-text-placeholder);
  line-height: 1.7;
}

.login__link {
  color: var(--c-primary);
  font-weight: 600;
}
</style>
