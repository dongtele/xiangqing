<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { createOrder, getAddresses, getShop, trialCheckout } from '@/services/api';
import { useCartStore } from '@/stores/cart';
import { useCheckoutStore } from '@/stores/checkout';
import { fen2yuan } from '@/utils/money';
import { back, push, toast } from '@/utils/nav';
import { requestOrderSubscribe } from '@/utils/notify';
import type { AddressFull, CheckoutTrial, DeliveryType, Shop } from '@/models';

/**
 * 03 · 确认订单：配送方式、地址、时间、优惠、金额明细。
 * 所有金额与优惠都来自 POST /checkout/trial 的服务端试算，前端不自己算。
 */
const cart = useCartStore();
const checkout = useCheckoutStore();

const shop = ref<Shop | null>(null);
const trial = ref<CheckoutTrial | null>(null);
const deliveryType = ref<DeliveryType>('delivery');
const submitting = ref(false);
const addressSheet = ref(false);
const remarkSheet = ref(false);
const timeSheet = ref(false);

const address = computed<AddressFull | null>(() => checkout.address);

const rows = computed(() =>
  cart.items.map((i) => ({ ...i, amountText: fen2yuan(i.unitPrice * i.qty) }))
);

onLoad(async () => {
  if (!cart.count) {
    toast('购物车是空的');
    back();
    return;
  }
  deliveryType.value = cart.deliveryType;
  shop.value = await getShop();
  if (!checkout.address) {
    // 默认收货地址：取默认且在配送范围内的一条
    const list = await getAddresses();
    checkout.setAddress(list.find((a) => a.isDefault && !a.outOfRange) || list[0] || null);
  }
  await refreshTrial();
});

async function refreshTrial(): Promise<void> {
  trial.value = await trialCheckout(cart.snapshot(), deliveryType.value);
}

function onSwitchDelivery(type: DeliveryType): void {
  if (type === deliveryType.value) return;
  deliveryType.value = type;
  cart.setDeliveryType(type);
  refreshTrial();
}

function onTapAddress(): void {
  if (deliveryType.value === 'pickup') {
    push('/pages/customer/pickup-stores/index');
    return;
  }
  addressSheet.value = true;
}

function onPickAddress(next: AddressFull): void {
  checkout.setAddress(next);
  addressSheet.value = false;
}

function onConfirmRemark(payload: { remark: string; tableware: number }): void {
  cart.setRemark(payload.remark);
  checkout.tableware = payload.tableware;
  remarkSheet.value = false;
}

function onPickTime(value: string): void {
  checkout.setDeliveryTime(value);
  timeSheet.value = false;
}

/** 提交订单 → 支付方式选择（85） */
async function onSubmit(): Promise<void> {
  if (submitting.value || !trial.value) return;
  submitting.value = true;
  try {
    // 先申请订阅消息授权：拒绝也照常下单，只是收不到状态推送
    await requestOrderSubscribe();
    const remark = [
      cart.remark,
      checkout.deliveryTime ? `期望${checkout.deliveryTime}送达` : '',
      `餐具 ${checkout.tableware} 份`,
    ]
      .filter(Boolean)
      .join('，');
    const res = await createOrder(cart.snapshot(), deliveryType.value, remark);
    // 购物车里可能躺着已过售卖时段的商品，服务端会拦下来
    if (!res.orderId) {
      toast(res.message || '下单失败');
      return;
    }
    push(`/pages/customer/pay-method/index?id=${res.orderId}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <view class="co">
    <wf-nav-bar title="确认订单" />

    <scroll-view v-if="shop && trial" class="co__body" scroll-y>
      <!-- 配送方式 -->
      <view class="co__seg">
        <view
          class="co__seg-item"
          :class="{ 'co__seg-item--on': deliveryType === 'delivery' }"
          @tap="onSwitchDelivery('delivery')"
          >外卖配送</view
        >
        <view
          class="co__seg-item"
          :class="{ 'co__seg-item--on': deliveryType === 'pickup' }"
          @tap="onSwitchDelivery('pickup')"
          >到店自取</view
        >
      </view>

      <!-- 地址 / 自提门店 + 时间 -->
      <view class="card">
        <view class="co__addr tap" @tap="onTapAddress">
          <view class="co__addr-icon">
            <wf-icon name="pin" :size="30" color="#FF4A17" :weight="2" />
          </view>
          <view class="flex1 col co__addr-text">
            <text class="co__addr-detail">{{
              deliveryType === 'delivery'
                ? address
                  ? address.detail
                  : '请选择收货地址'
                : checkout.pickupStore
                  ? checkout.pickupStore.name
                  : shop.name
            }}</text>
            <text class="co__addr-sub">{{
              deliveryType === 'delivery'
                ? address
                  ? `${address.receiver}（${address.gender}）${address.phoneMask}`
                  : '点击选择'
                : checkout.pickupStore
                  ? `自取门店 · ${checkout.pickupStore.distanceText}`
                  : `自取门店 · ${shop.distanceText}`
            }}</text>
          </view>
          <text class="chevron">›</text>
        </view>
        <view class="hairline" />
        <view class="row--between tap" @tap="timeSheet = true">
          <text class="co__row-label">{{
            checkout.deliveryTime || (deliveryType === 'delivery' ? '立即送出' : '尽快取餐')
          }}</text>
          <text class="co__row-primary">{{
            checkout.deliveryTime ? '已指定时段' : trial.etaText
          }} ›</text>
        </view>
      </view>

      <!-- 商品与金额 -->
      <view class="card">
        <text class="co__shop">{{ shop.name }}</text>

        <view v-for="item in rows" :key="item.key" class="co__item">
          <view class="co__item-img"><wf-thumb :src="item.image" :radius="20" /></view>
          <view class="flex1 col co__item-info">
            <text class="co__item-name">{{ item.name }}</text>
            <text v-if="item.specText" class="co__item-spec">{{ item.specText }}</text>
          </view>
          <view class="co__item-right">
            <text class="co__item-amount">¥{{ item.amountText }}</text>
            <text class="co__item-qty">x{{ item.qty }}</text>
          </view>
        </view>

        <view class="hairline" />

        <view class="co__fee">
          <text>打包费</text>
          <text>¥{{ fen2yuan(trial.packFee) }}</text>
        </view>
        <view v-if="deliveryType === 'delivery'" class="co__fee">
          <text>配送费</text>
          <text>¥{{ fen2yuan(trial.deliveryFee) }}</text>
        </view>

        <view class="row--between tap" @tap="push('/pages/customer/coupons/index')">
          <view class="co__coupon">
            <text class="co__coupon-tag">券</text>
            <text>{{ trial.couponName }}</text>
          </view>
          <text class="co__coupon-cut">{{
            trial.couponDiscount ? `-¥${fen2yuan(trial.couponDiscount)}` : '去选择'
          }}
            ›</text>
        </view>

        <view class="co__subtotal">
          <text class="co__subtotal-label">共{{ trial.count }}件 · 小计</text>
          <wf-price :fen="trial.payable" :size="34" color="#20160F" />
        </view>
      </view>

      <!-- 备注 -->
      <view class="card co__remark tap" @tap="remarkSheet = true">
        <text class="co__row-label">备注</text>
        <text class="co__remark-ph"
          >{{ cart.remark || '口味偏好' }} · 餐具 {{ checkout.tableware }} 份 ›</text
        >
      </view>

      <view class="co__foot" />
    </scroll-view>

    <!-- 15 选择收货地址 / 31 备注与餐具：设计稿是盖在本屏上的半屏浮层 -->
    <wf-address-sheet
      :show="addressSheet"
      :selected-id="address ? address.id : ''"
      @close="addressSheet = false"
      @confirm="onPickAddress"
    />
    <wf-remark-sheet
      :show="remarkSheet"
      :remark="cart.remark"
      :tableware="checkout.tableware"
      @close="remarkSheet = false"
      @confirm="onConfirmRemark"
    />

    <!-- 期望送达时间：与 15 / 31 同样盖在本页上的半屏浮层 -->
    <wf-time-sheet
      :show="timeSheet"
      :value="checkout.deliveryTime"
      :delivery-type="deliveryType"
      :eta-text="trial ? trial.etaText : ''"
      @close="timeSheet = false"
      @pick="onPickTime"
    />

    <!-- 底部合计 + 支付 -->
    <view v-if="trial" class="co__bar">
      <view class="col">
        <view class="co__total">
          <text class="co__total-label">合计</text>
          <wf-price :fen="trial.payable" :size="48" />
        </view>
        <text v-if="trial.discountTotal" class="co__saved"
          >已优惠 ¥{{ fen2yuan(trial.discountTotal) }}</text
        >
      </view>
      <view class="co__pay tap" :class="{ 'btn--disabled': submitting }" @tap="onSubmit"
        >微信支付</view
      >
    </view>
  </view>
</template>

<style lang="scss" scoped>
.co {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.co__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card,
.co__seg {
  margin-bottom: 24rpx;
}

/* 配送方式切换 */
.co__seg {
  background: #ffffff;
  border-radius: var(--r-card);
  padding: 10rpx;
  display: flex;
}

.co__seg-item {
  flex: 1;
  text-align: center;
  font-size: 27rpx;
  font-weight: 600;
  color: var(--c-text-weak);
  padding: 18rpx 0;
  border-radius: 24rpx;
}

.co__seg-item--on {
  background: var(--grad-main);
  color: #fff;
  font-weight: 800;
}

/* 地址 */
.co__addr {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.co__addr-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: var(--c-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.co__addr-text {
  gap: 6rpx;
}

.co__addr-detail {
  font-size: 31rpx;
  font-weight: 800;
}

.co__addr-sub {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.co__row-label {
  font-size: 26rpx;
  font-weight: 700;
}

.co__row-primary {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--c-primary);
}

/* 商品 */
.co__shop {
  font-size: 28rpx;
  font-weight: 800;
}

.co__item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.co__item-img {
  width: 96rpx;
  height: 96rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.co__item-info {
  gap: 4rpx;
}

.co__item-name {
  font-size: 26rpx;
  font-weight: 700;
}

.co__item-spec {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.co__item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.co__item-amount {
  font-size: 26rpx;
  font-weight: 800;
}

.co__item-qty {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.co__fee {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #7a7168;
}

.co__coupon {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.co__coupon-tag {
  background: var(--c-primary-deep);
  color: #fff;
  font-size: 18rpx;
  font-weight: 800;
  padding: 3rpx 10rpx;
  border-radius: 8rpx;
}

.co__coupon-cut {
  font-size: 25rpx;
  font-weight: 800;
  color: var(--c-primary-deep);
}

.co__subtotal {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 12rpx;
  border-top: 1px solid #f3eee8;
  padding-top: 20rpx;
}

.co__subtotal-label {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

/* 备注 */
.co__remark {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
}

.co__remark-ph {
  font-size: 24rpx;
  color: var(--c-text-placeholder);
}

.co__foot {
  height: 40rpx;
}

/* 底部条 */
.co__bar {
  flex-shrink: 0;
  background: #ffffff;
  border-top: 1px solid #f3eee8;
  padding: 28rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.co__total {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.co__total-label {
  font-size: 24rpx;
  font-weight: 700;
}

.co__saved {
  font-size: 20rpx;
  color: var(--c-primary);
}

.co__pay {
  background: var(--c-success);
  color: #fff;
  font-size: 30rpx;
  font-weight: 800;
  padding: 26rpx 60rpx;
  border-radius: 50rpx;
  box-shadow: 0 12rpx 32rpx rgba(7, 193, 96, 0.25);
}
</style>
