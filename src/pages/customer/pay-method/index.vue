<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { getOrder } from '@/services/api';
import { PAY_TIMEOUT_SECONDS } from '@/config';
import { fen2yuan2 } from '@/utils/money';
import { countdown, mmss } from '@/utils/time';
import { push, toast } from '@/utils/nav';
import type { Order, PayMethod, PayMethodId } from '@/models';

const METHODS: PayMethod[] = [
  {
    id: 'wechat',
    name: '微信支付',
    desc: '立减 ¥1.00 · 推荐',
    icon: 'pay-wechat',
    iconColor: '#07C160',
    iconBg: '#E8F8EF',
    disabled: false,
  },
  {
    id: 'balance',
    name: '储值余额',
    desc: '可用 ¥36.50 · 余额不足需补差',
    icon: 'pay-balance',
    iconColor: '#FF4A17',
    iconBg: '#FFF1E9',
    disabled: false,
  },
  {
    id: 'friend',
    name: '找人代付',
    desc: '分享给微信好友，30 分钟内有效',
    icon: 'pay-friend',
    iconColor: '#7A7168',
    iconBg: '#F1ECE5',
    disabled: false,
  },
];

/** 85 · 支付方式选择：多支付方式 + 15 分钟倒计时（服务端时间为准） */
const order = ref<Order | null>(null);
const selected = ref<PayMethodId>('wechat');
const leftText = ref('15:00');
const expired = ref(false);

let stop: (() => void) | null = null;

const payableText = computed(() => (order.value ? fen2yuan2(order.value.payable) : '0.00'));
const itemsTotalText = computed(() => (order.value ? fen2yuan2(order.value.itemsTotal) : '0.00'));
const couponText = computed(() => (order.value ? fen2yuan2(order.value.couponDiscount) : '0.00'));
const feeText = computed(() =>
  order.value ? fen2yuan2(order.value.packFee + order.value.deliveryFee) : '0.00'
);

onLoad(async (options) => {
  const detail = await getOrder((options && options.id) || '');
  if (!detail) {
    toast('订单不存在');
    return;
  }
  order.value = detail;
  stop = countdown(
    PAY_TIMEOUT_SECONDS,
    (left) => {
      leftText.value = mmss(left);
    },
    () => {
      expired.value = true;
    }
  );
});

onUnload(() => {
  if (stop) stop();
});

/**
 * 找人代付。
 * 设计稿只画了这一项支付方式，没画卡片本身与分享流程，
 * 这里按平台能力补：小程序端唤起转发（卡片带订单号与金额），H5 端复制代付链接。
 * 代付链接的真实生成属于后端，接入前用订单 id 拼一个可读的占位。
 */
function onAskFriend(): void {
  if (!order.value) return;
  const link = `https://weiweifang.example.com/pay/${order.value.id}`;

  // #ifdef MP-WEIXIN
  uni.showModal({
    title: '找人代付',
    content: '点击「分享」把代付卡片发给好友，好友付款后订单自动完成',
    confirmText: '去分享',
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm) return;
      uni.showShareMenu({ withShareTicket: true });
      toast('点击右上角「···」转发给好友');
    },
  });
  // #endif

  // #ifndef MP-WEIXIN
  uni.setClipboardData({
    data: link,
    success: () => toast('代付链接已复制，发给好友即可'),
  });
  // #endif
}

function onConfirm(): void {
  if (expired.value) {
    toast('订单已超时取消');
    return;
  }
  if (!order.value) return;
  if (selected.value === 'friend') {
    onAskFriend();
    return;
  }
  push(`/pages/customer/pay/index?id=${order.value.id}&method=${selected.value}`);
}
</script>

<template>
  <view class="pm">
    <wf-nav-bar title="选择支付方式" />

    <view v-if="order" class="pm__body">
      <view class="pm__amount">
        <text class="pm__amount-label">待支付</text>
        <text class="pm__amount-num">￥{{ payableText }}</text>
        <text class="pm__amount-tip">{{
          expired ? '订单已超时取消' : `${leftText} 后订单自动取消`
        }}</text>
      </view>

      <view class="card">
        <template v-for="(m, index) in METHODS" :key="m.id">
          <view v-if="index > 0" class="hairline" />
          <view class="pm__method tap" @tap="selected = m.id">
            <view class="pm__method-icon" :style="{ background: m.iconBg }">
              <wf-icon :name="m.icon" :size="36" :color="m.iconColor" :weight="2" />
            </view>
            <view class="flex1 col pm__method-text">
              <text class="pm__method-name">{{ m.name }}</text>
              <text
                class="pm__method-desc"
                :class="{ 'pm__method-desc--wechat': m.id === 'wechat' }"
                >{{ m.desc }}</text
              >
            </view>
            <view v-if="selected === m.id" class="pm__radio pm__radio--on">
              <wf-icon name="check" :size="22" color="#FFFFFF" :weight="3.4" />
            </view>
            <view v-else class="pm__radio" />
          </view>
        </template>
      </view>

      <view class="card">
        <view class="cell cell--plain">
          <text class="cell__label">商品小计</text>
          <text class="cell__value">￥{{ itemsTotalText }}</text>
        </view>
        <view class="hairline" />
        <view class="cell cell--plain">
          <text class="cell__label">优惠券</text>
          <text class="cell__value pm__cut">-￥{{ couponText }}</text>
        </view>
        <view class="hairline" />
        <view class="cell cell--plain">
          <text class="cell__label">{{
            order.deliveryType === 'delivery' ? '配送费 + 包装费' : '包装费'
          }}</text>
          <text class="cell__value">￥{{ feeText }}</text>
        </view>
      </view>

      <view class="flex1" />

      <view class="btn btn--primary tap" :class="{ 'btn--disabled': expired }" @tap="onConfirm">
        确认支付 ￥{{ payableText }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.pm {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pm__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(32rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.pm__amount {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 28rpx 0 36rpx;
}

.pm__amount-label {
  font-size: 24rpx;
  color: var(--c-text-weaker);
}

.pm__amount-num {
  font-size: 72rpx;
  font-weight: 800;
  letter-spacing: -2rpx;
}

.pm__amount-tip {
  font-size: 23rpx;
  color: var(--c-primary);
  font-weight: 700;
}

.pm__method {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.pm__method-icon {
  width: 68rpx;
  height: 68rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pm__method-text {
  gap: 4rpx;
}

.pm__method-name {
  font-size: 27rpx;
  font-weight: 800;
}

.pm__method-desc {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.pm__method-desc--wechat {
  color: var(--c-success);
}

.pm__radio {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 3rpx solid var(--c-line-5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pm__radio--on {
  background: var(--c-primary);
  border-color: var(--c-primary);
}

.cell--plain {
  padding: 0;
}

.pm__cut {
  color: var(--c-primary);
  font-weight: 700;
}
</style>
