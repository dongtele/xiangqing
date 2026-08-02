<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getProfileForm, saveProfileForm, toggleTaste } from '@/services/api';
import { back, toast } from '@/utils/nav';
import { useUserStore } from '@/stores/user';
import type { ProfileForm } from '@/models';

/** 73 · 个人资料：头像、基础字段与口味偏好（偏好会自动带进 31 订单备注） */
const user = useUserStore();
const form = ref<ProfileForm | null>(null);

const GENDERS = ['男', '女', '保密'];

onLoad(() => {
  load();
});

async function load(): Promise<void> {
  form.value = await getProfileForm();
}

function onAvatar(): void {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const files = res.tempFilePaths as string[];
      if (form.value && files.length) form.value.avatar = files[0];
    },
    fail: () => toast('未选择图片'),
  });
}

function onNickname(): void {
  if (!form.value) return;
  const current = form.value.nickname;
  uni.showModal({
    title: '修改昵称',
    editable: true,
    placeholderText: current,
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm || !form.value) return;
      const next = (res.content || '').trim();
      if (!next) {
        toast('昵称不能为空');
        return;
      }
      form.value.nickname = next;
    },
  });
}

function onGender(): void {
  uni.showActionSheet({
    itemList: GENDERS,
    success: (res) => {
      if (!form.value) return;
      const label = GENDERS[res.tapIndex];
      form.value.genderText = label;
      form.value.gender = label === '男' ? 'male' : label === '女' ? 'female' : 'unknown';
    },
  });
}

function onBirthday(): void {
  toast('生日选择走原生 picker，接后端后开放');
}

function onPhone(): void {
  toast('更换手机号请到「账号与安全」');
}

async function onTaste(key: string): Promise<void> {
  if (!form.value) return;
  const taste = form.value.tastes.find((t) => t.key === key);
  if (taste) taste.on = !taste.on;
  await toggleTaste(key);
}

async function onSave(): Promise<void> {
  if (!form.value) return;
  await saveProfileForm(form.value);
  user.updateProfile({ nickname: form.value.nickname, avatar: form.value.avatar });
  toast('已保存');
  setTimeout(() => back(), 600);
}

function onLogout(): void {
  uni.showModal({
    title: '退出登录？',
    content: '退出后需重新授权才能下单',
    confirmColor: '#D14343',
    success: (res) => {
      if (!res.confirm) return;
      user.logout();
      uni.reLaunch({ url: '/pages/login/index' });
    },
  });
}
</script>

<template>
  <view v-if="form" class="pe">
    <wf-nav-bar title="个人资料" right="保存" @righttap="onSave" />

    <scroll-view class="pe__body" scroll-y>
      <view class="card pe__avatar-card">
        <view class="pe__avatar tap-sm" @tap="onAvatar">
          <image v-if="form.avatar" class="pe__avatar-img" :src="form.avatar" mode="aspectFill" />
          <text v-else>{{ form.nickname.slice(-1) }}</text>
          <view class="pe__avatar-badge">
            <wf-icon name="edit" :size="22" color="#FFFFFF" :weight="2.4" />
          </view>
        </view>
        <text class="pe__avatar-tip">点击更换头像（可用微信头像）</text>
      </view>

      <view class="card card--flat">
        <view class="cell tap" @tap="onNickname">
          <text class="cell__label">昵称</text>
          <view class="cell__value"
            ><text>{{ form.nickname }}</text
            ><text class="chevron">›</text></view
          >
        </view>
        <view class="cell tap" @tap="onGender">
          <text class="cell__label">性别</text>
          <view class="cell__value"
            ><text>{{ form.genderText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
        <view class="cell tap" @tap="onBirthday">
          <text class="cell__label">生日</text>
          <view class="cell__value"
            ><text>{{ form.birthday }}</text
            ><text class="chevron">›</text></view
          >
        </view>
        <view class="cell tap" @tap="onPhone">
          <text class="cell__label">手机号</text>
          <view class="cell__value"
            ><text>{{ form.phoneMask }}</text
            ><text class="chevron">›</text></view
          >
        </view>
      </view>

      <view class="card">
        <view class="row--between">
          <text class="t-section">口味偏好</text>
          <text class="t-sub">下单时自动带入备注</text>
        </view>
        <view class="pe__tastes">
          <view
            v-for="t in form.tastes"
            :key="t.key"
            class="pe__taste tap-sm"
            :class="{ 'pe__taste--on': t.on }"
            @tap="onTaste(t.key)"
            >{{ t.label }}</view
          >
        </view>
      </view>

    </scroll-view>

    <!-- 设计稿用 flex:1 把退出登录顶到屏底，这里改成 scroll-view 外的固定尾部 -->
    <view class="pe__foot">
      <view class="pe__logout tap" @tap="onLogout">退出登录</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.pe {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pe__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.pe__foot {
  flex-shrink: 0;
  padding: 20rpx 32rpx calc(32rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
}

.pe__body > .card {
  margin-bottom: 20rpx;
}

.pe__avatar-card {
  align-items: center;
  padding: 36rpx 32rpx;
}

.pe__avatar {
  width: 144rpx;
  height: 144rpx;
  border-radius: 50%;
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-size: 52rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.pe__avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.pe__avatar-badge {
  position: absolute;
  right: -4rpx;
  bottom: -4rpx;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: var(--c-primary);
  border: 5rpx solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pe__avatar-tip {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.pe__tastes {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.pe__taste {
  border: 3rpx solid var(--c-line-2);
  color: var(--c-text-2);
  font-size: 23rpx;
  font-weight: 600;
  padding: 12rpx 26rpx;
  border-radius: 28rpx;
}

.pe__taste--on {
  border-color: var(--c-primary);
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-weight: 700;
}

.pe__logout {
  height: 92rpx;
  border-radius: 46rpx;
  background: #fff;
  color: var(--c-danger);
  font-size: 28rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
