<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getGoods } from '@/services/api';
import { CURRENT_SHOP_ID } from '@/config';
import { useCartStore } from '@/stores/cart';
import { back, toast, todo } from '@/utils/nav';
import type { Goods, SpecOption } from '@/models';

/** 02 · 商品详情：规格 / 加料选择 → 加入购物车 */
const cart = useCartStore();

const goods = ref<Goods | null>(null);
const qty = ref(1);
/** groupId → 选中的 optionId 集合 */
const selection = reactive<Record<string, string[]>>({});

onLoad(async (options) => {
  const detail = await getGoods((options && options.id) || '');
  if (!detail) {
    toast('商品不存在');
    back();
    return;
  }
  // 必选组预选：优先取 defaultOptionId，否则第一项（设计稿：标准 / 微辣）
  detail.specGroups.forEach((g) => {
    if (!g.required || !g.options.length) {
      selection[g.id] = [];
      return;
    }
    const preset = g.defaultOptionId
      ? g.options.find((o) => o.id === g.defaultOptionId)
      : undefined;
    selection[g.id] = [(preset || g.options[0]).id];
  });
  goods.value = detail;
});

const groups = computed(() =>
  (goods.value ? goods.value.specGroups : []).map((g) => ({
    id: g.id,
    name: g.name,
    multiple: g.multiple,
    required: g.required,
    options: g.options.map((o) => ({
      ...o,
      selected: (selection[g.id] || []).indexOf(o.id) >= 0,
      label: o.priceDelta > 0 ? `${o.name} +¥${o.priceDelta / 100}` : o.name,
    })),
  }))
);

const picked = computed<SpecOption[]>(() => {
  if (!goods.value) return [];
  const out: SpecOption[] = [];
  goods.value.specGroups.forEach((g) => {
    (selection[g.id] || []).forEach((id) => {
      const hit = g.options.find((o) => o.id === id);
      if (hit) out.push(hit);
    });
  });
  return out;
});

const selectedText = computed(() => picked.value.map((o) => o.name).join(' / '));

const unitPrice = computed(() =>
  goods.value ? goods.value.price + picked.value.reduce((n, o) => n + o.priceDelta, 0) : 0
);

/** 只有存在加价选项才显示「起」 */
const priceFrom = computed(() =>
  goods.value
    ? goods.value.specGroups.some((g) => g.options.some((o) => o.priceDelta > 0))
    : false
);

function onTapOption(gid: string, oid: string, multiple: boolean): void {
  const current = selection[gid] || [];
  if (multiple) {
    selection[gid] =
      current.indexOf(oid) >= 0 ? current.filter((x) => x !== oid) : [...current, oid];
  } else {
    selection[gid] = [oid];
  }
}

function onAddToCart(): void {
  if (!goods.value) return;
  const missing = goods.value.specGroups.find(
    (g) => g.required && !(selection[g.id] || []).length
  );
  if (missing) {
    toast(`请选择${missing.name}`);
    return;
  }
  cart.add(CURRENT_SHOP_ID, goods.value, picked.value, qty.value);
  uni.vibrateShort({ type: 'light' });
  back();
}
</script>

<template>
  <view v-if="goods" class="gd">
    <!-- 大图 + 返回 -->
    <view class="gd__hero">
      <view class="gd__hero-img" @tap="todo('54', '菜品大图预览')">
        <wf-thumb :src="goods.image" :radius="0" />
      </view>
      <wf-nav-bar theme="dark" fixed title="" />
      <text v-if="goods.rankTag" class="gd__hero-tag"
        >热销 {{ goods.rankTag }} · 月售{{ goods.monthSold }}</text
      >
    </view>

    <!-- 详情 -->
    <scroll-view class="gd__sheet" scroll-y>
      <view class="gd__head">
        <view class="gd__title-row">
          <text class="gd__name">{{ goods.name }}</text>
          <wf-price :fen="goods.price" :size="48" :from="priceFrom" />
        </view>
        <text class="gd__praise">好评率 {{ goods.praiseRate }}% · 回头客最爱</text>
        <text class="gd__desc">{{ goods.desc }}</text>
      </view>

      <view v-for="group in groups" :key="group.id" class="gd__group">
        <view class="gd__group-title">
          <text>{{ group.name }}</text>
          <text v-if="group.required" class="gd__req">必选</text>
          <text v-else class="gd__opt">可多选</text>
        </view>
        <view class="gd__options">
          <view
            v-for="o in group.options"
            :key="o.id"
            class="gd__option"
            :class="{ 'gd__option--on': o.selected }"
            @tap="onTapOption(group.id, o.id, group.multiple)"
            >{{ o.label }}</view
          >
        </view>
      </view>

      <view class="gd__sheet-foot" />
    </scroll-view>

    <!-- 底部操作条 -->
    <view class="gd__bar">
      <view class="gd__bar-left">
        <text v-if="selectedText" class="gd__selected">已选：{{ selectedText }}</text>
        <wf-price :fen="unitPrice" :size="44" />
      </view>
      <wf-qty-stepper
        :qty="qty"
        always-minus
        :plus-size="56"
        :minus-size="56"
        :font-size="30"
        tone="soft"
        @plus="qty += 1"
        @minus="qty > 1 && (qty -= 1)"
      />
      <view class="gd__add tap" @tap="onAddToCart">加入购物车</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
page {
  background: #ffffff;
}

.gd {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
}

.gd__hero {
  position: relative;
  height: 600rpx;
  flex-shrink: 0;
  background: var(--c-img-placeholder);
}

.gd__hero-img {
  width: 100%;
  height: 100%;
}

.gd__hero-tag {
  position: absolute;
  left: 28rpx;
  /* 详情卡上移 48rpx 盖住图片底部，角标要落在遮挡线以上 */
  bottom: 72rpx;
  background: rgba(32, 22, 15, 0.72);
  color: #fff;
  font-size: 21rpx;
  font-weight: 700;
  padding: 7rpx 20rpx;
  border-radius: 24rpx;
}

.gd__sheet {
  flex: 1;
  min-height: 0;
  background: #ffffff;
  margin-top: -48rpx;
  border-radius: 48rpx 48rpx 0 0;
  position: relative;
  z-index: 2;
}

.gd__head {
  padding: 40rpx 36rpx 0;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.gd__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.gd__name {
  font-size: 40rpx;
  font-weight: 800;
}

.gd__praise {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.gd__desc {
  font-size: 24rpx;
  color: #7a7168;
  line-height: 1.7;
}

.gd__group {
  padding: 28rpx 36rpx 0;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.gd__group-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
  font-weight: 800;
}

.gd__req {
  font-size: 20rpx;
  color: var(--c-primary);
  font-weight: 600;
  background: var(--c-primary-bg);
  padding: 3rpx 12rpx;
  border-radius: 10rpx;
}

.gd__opt {
  font-size: 20rpx;
  color: var(--c-text-weaker);
  font-weight: 500;
}

.gd__options {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.gd__option {
  border: 3rpx solid var(--c-line-2);
  color: var(--c-text-2);
  font-size: 25rpx;
  padding: 16rpx 32rpx;
  border-radius: 22rpx;
  transition: all 0.12s ease;
}

.gd__option--on {
  border-color: var(--c-primary);
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-weight: 700;
}

.gd__sheet-foot {
  height: 60rpx;
}

.gd__bar {
  flex-shrink: 0;
  background: #ffffff;
  border-top: 1px solid #f3eee8;
  padding: 28rpx 36rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 28rpx;
}

.gd__bar-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.gd__selected {
  font-size: 20rpx;
  color: var(--c-text-weaker);
}

.gd__add {
  background: var(--grad-main);
  color: #fff;
  font-size: 29rpx;
  font-weight: 800;
  padding: 26rpx 44rpx;
  border-radius: 50rpx;
  box-shadow: 0 12rpx 32rpx rgba(255, 61, 0, 0.3);
  flex-shrink: 0;
}
</style>
