<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getAddress, removeAddress, saveAddress } from '@/services/api';
import { useCheckoutStore } from '@/stores/checkout';
import { back, push, toast } from '@/utils/nav';
import type { AddressFull } from '@/models';

const TAGS = ['公司', '家', '学校'];
const GENDERS = ['先生', '女士'];

/** 16 · 新增 / 编辑地址：表单 + 地图定位入口 */
const checkout = useCheckoutStore();

const empty: AddressFull = {
  id: '',
  tag: '公司',
  receiver: '',
  gender: '先生',
  phone: '',
  phoneMask: '',
  poi: '',
  houseNo: '',
  detail: '',
  isDefault: false,
  distanceText: '',
  outOfRange: false,
  latitude: 0,
  longitude: 0,
};

const form = ref<AddressFull>({ ...empty });
const isEdit = ref(false);
let addressId = '';

onLoad((o) => {
  addressId = (o && o.id) || '';
  isEdit.value = !!addressId;
});

onShow(async () => {
  if (addressId && !form.value.id) {
    const res = await getAddress(addressId);
    if (res) form.value = { ...res };
  }
  // 从 52 地图选点回来：回填 POI
  if (checkout.pickedPoi) {
    form.value.poi = checkout.pickedPoi.name;
    form.value.latitude = checkout.pickedPoi.latitude;
    form.value.longitude = checkout.pickedPoi.longitude;
    checkout.setPoi(null);
  }
});

function edit(field: 'houseNo' | 'receiver' | 'phone', title: string): void {
  uni.showModal({
    title,
    editable: true,
    placeholderText: form.value[field] || title,
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm) return;
      form.value[field] = (res.content || '').trim();
    },
  });
}

/** 交付文档「表单校验」：必填 = 收货人 / 手机号 / 门牌号；手机号 11 位数字 */
function validate(): string {
  if (!form.value.poi) return '请先在地图上选择所在位置';
  if (!form.value.houseNo) return '请填写门牌号';
  if (!form.value.receiver) return '请填写联系人';
  if (!/^\d{11}$/.test(form.value.phone)) return '请填写 11 位手机号';
  return '';
}

async function onSave(): Promise<void> {
  const err = validate();
  if (err) {
    toast(err);
    return;
  }
  const phone = form.value.phone;
  await saveAddress({
    ...form.value,
    phoneMask: `${phone.slice(0, 3)}****${phone.slice(7)}`,
  });
  toast('地址已保存', 'success');
  back();
}

function onRemove(): void {
  uni.showModal({
    title: '删除该地址？',
    confirmText: '删除',
    confirmColor: '#D14343',
    success: async (res) => {
      if (!res.confirm) return;
      await removeAddress(addressId);
      toast('已删除');
      back();
    },
  });
}
</script>

<template>
  <view class="ae">
    <wf-nav-bar :title="isEdit ? '编辑地址' : '新增地址'" />

    <scroll-view class="ae__body" scroll-y>
      <view class="card card--flat">
        <view class="cell tap" @tap="push('/pages/customer/map-picker/index')">
          <text class="ae__label">所在位置</text>
          <text class="ae__value ae__value--primary"
            >📍 {{ form.poi || '在地图上选择' }} ›</text
          >
        </view>
        <view class="cell tap" @tap="edit('houseNo', '门牌号')">
          <text class="ae__label">门牌号</text>
          <text class="ae__value">{{ form.houseNo || '如 15层1501室' }}</text>
        </view>
        <view class="cell tap" @tap="edit('receiver', '联系人')">
          <text class="ae__label">联系人</text>
          <text class="ae__value">{{ form.receiver || '收货人姓名' }}</text>
        </view>
        <view class="cell">
          <text class="ae__label">性别</text>
          <view class="ae__chips">
            <text
              v-for="g in GENDERS"
              :key="g"
              class="ae__chip"
              :class="{ 'ae__chip--on': form.gender === g }"
              @tap="form.gender = g"
              >{{ g }}</text
            >
          </view>
        </view>
        <view class="cell tap" @tap="edit('phone', '手机号')">
          <text class="ae__label">手机号</text>
          <text class="ae__value">{{ form.phone || '11 位手机号' }}</text>
        </view>
      </view>

      <view class="card card--flat">
        <view class="cell">
          <text class="ae__label">标签</text>
          <view class="ae__chips">
            <text
              v-for="t in TAGS"
              :key="t"
              class="ae__chip"
              :class="{ 'ae__chip--on': form.tag === t }"
              @tap="form.tag = t"
              >{{ t }}</text
            >
          </view>
        </view>
        <view class="cell">
          <text class="cell__label">设为默认地址</text>
          <wf-toggle :on="form.isDefault" @change="form.isDefault = $event" />
        </view>
      </view>

      <text v-if="isEdit" class="ae__remove tap" @tap="onRemove">删除该地址</text>
      <view class="ae__foot" />
    </scroll-view>

    <view class="ae__bar">
      <view class="btn btn--primary tap" @tap="onSave">保存</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.ae {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ae__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.ae__body > .card {
  margin-bottom: 24rpx;
}

.ae__label {
  font-size: 26rpx;
  color: var(--c-text-weak);
}

.ae__value {
  font-size: 27rpx;
  font-weight: 700;
}

.ae__value--primary {
  color: var(--c-primary);
}

.ae__chips {
  display: flex;
  gap: 16rpx;
}

.ae__chip {
  border: 3rpx solid var(--c-line-2);
  color: var(--c-text-weak);
  font-size: 24rpx;
  padding: 10rpx 28rpx;
  border-radius: 18rpx;
}

.ae__chip--on {
  border-color: var(--c-primary);
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-weight: 700;
}

.ae__remove {
  display: block;
  text-align: center;
  font-size: 25rpx;
  color: var(--c-danger);
  font-weight: 700;
  padding: 12rpx 0;
}

.ae__foot {
  height: 32rpx;
}

.ae__bar {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #f3eee8;
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
}
</style>
