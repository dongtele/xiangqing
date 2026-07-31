<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { searchGoods } from '@/services/api';
import { CURRENT_SHOP_ID } from '@/config';
import { useCartStore } from '@/stores/cart';
import { chrome } from '@/utils/chrome';
import { back, push } from '@/utils/nav';
import type { Goods } from '@/models';

/** 18 · 店内搜索：关键词高亮、结果列表、热搜词 */
const cart = useCartStore();

const headPad = ref(96);
const keyword = ref('');
const submitted = ref('');
const list = ref<Goods[]>([]);
const hotWords = ref<string[]>([]);

const rows = computed(() =>
  list.value.map((g) => {
    const idx = g.name.indexOf(submitted.value);
    return {
      ...g,
      hasSpec: g.specGroups.length > 0,
      priceFrom: g.specGroups.some((sg) => sg.options.some((o) => o.priceDelta > 0)),
      qty: cart.qtyOfGoods(g.id),
      // 命中词高亮：拆成前 / 中 / 后三段
      pre: idx >= 0 ? g.name.slice(0, idx) : g.name,
      hit: idx >= 0 ? g.name.slice(idx, idx + submitted.value.length) : '',
      post: idx >= 0 ? g.name.slice(idx + submitted.value.length) : '',
    };
  })
);

onLoad(async () => {
  headPad.value = chrome().capsuleBottom + 16;
  const res = await searchGoods('');
  hotWords.value = res.hotWords;
});

function onInput(e: Event): void {
  keyword.value = (e as unknown as { detail: { value: string } }).detail.value;
}

async function doSearch(word?: string): Promise<void> {
  const kw = (word ?? keyword.value).trim();
  keyword.value = kw;
  submitted.value = kw;
  const res = await searchGoods(kw);
  list.value = res.list;
  hotWords.value = res.hotWords;
}

function onTapGoods(id: string): void {
  push(`/pages/customer/goods/index?id=${id}`);
}

function onPlus(g: Goods): void {
  if (g.specGroups.length) {
    onTapGoods(g.id);
    return;
  }
  cart.add(CURRENT_SHOP_ID, g, []);
}
</script>

<template>
  <view class="sc">
    <view class="sc__head" :style="{ paddingTop: headPad + 'px' }">
      <view class="sc__back tap" @tap="back()"><text class="sc__back-glyph">‹</text></view>
      <view class="sc__field">
        <wf-icon name="search" :size="26" color="#B0A69D" :weight="2.4" />
        <input
          class="sc__input"
          :value="keyword"
          placeholder="搜索店内美食"
          placeholder-class="sc__ph"
          confirm-type="search"
          focus
          @input="onInput"
          @confirm="doSearch()"
        />
      </view>
      <text class="sc__submit tap" @tap="doSearch()">搜索</text>
    </view>

    <scroll-view class="sc__body" scroll-y>
      <text v-if="submitted" class="sc__count">找到 {{ rows.length }} 个相关菜品</text>

      <view v-for="item in rows" :key="item.id" class="sc__row">
        <view class="sc__thumb" @tap="onTapGoods(item.id)">
          <wf-thumb :src="item.image" :radius="28" />
        </view>
        <view class="sc__main">
          <view class="sc__top" @tap="onTapGoods(item.id)">
            <text class="sc__name"
              >{{ item.pre }}<text class="sc__hit">{{ item.hit }}</text
              >{{ item.post }}</text
            >
            <text class="sc__meta">月售{{ item.monthSold }} · 好评{{ item.praiseRate }}%</text>
          </view>
          <view class="sc__bottom">
            <wf-price :fen="item.price" :size="38" :from="item.priceFrom" :unit="item.unit" />
            <view v-if="item.hasSpec" class="sc__spec tap" @tap="onTapGoods(item.id)">选规格</view>
            <wf-qty-stepper
              v-else
              :qty="item.qty"
              :plus-size="52"
              :minus-size="48"
              @plus="onPlus(item)"
              @minus="cart.decreaseByGoods(item.id)"
            />
          </view>
        </view>
      </view>

      <view v-if="submitted && !rows.length" class="empty">
        <text class="empty__text">没有找到「{{ submitted }}」相关的菜品</text>
      </view>

      <view class="sc__hot">
        <text class="sc__hot-title">大家都在搜</text>
        <view class="sc__hot-words">
          <text v-for="w in hotWords" :key="w" class="sc__hot-word tap" @tap="doSearch(w)">{{
            w
          }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
page {
  background: #ffffff;
}

.sc {
  height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sc__head {
  padding-left: 32rpx;
  padding-right: 32rpx;
  padding-bottom: 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex-shrink: 0;
  border-bottom: 1px solid #f7f3ee;
}

.sc__back {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: var(--c-fill-3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sc__back-glyph {
  font-size: 36rpx;
  line-height: 1;
  margin-top: -4rpx;
}

.sc__field {
  flex: 1;
  min-width: 0;
  background: var(--c-fill-3);
  border-radius: 34rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 28rpx;
}

.sc__input {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  font-weight: 600;
  height: 68rpx;
}

.sc__ph {
  color: var(--c-text-placeholder);
  font-size: 26rpx;
}

.sc__submit {
  font-size: 27rpx;
  font-weight: 800;
  color: var(--c-primary);
  flex-shrink: 0;
}

.sc__body {
  flex: 1;
  min-height: 0;
  padding: 28rpx 32rpx;
}

.sc__count {
  display: block;
  font-size: 23rpx;
  color: var(--c-text-weaker);
  padding-bottom: 24rpx;
}

.sc__row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.sc__thumb {
  width: 192rpx;
  height: 192rpx;
  border-radius: 28rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.sc__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4rpx 0;
  gap: 12rpx;
}

.sc__top {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.sc__name {
  font-size: 29rpx;
  font-weight: 800;
}

.sc__hit {
  color: var(--c-primary);
}

.sc__meta {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.sc__bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.sc__spec {
  background: var(--grad-main);
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  padding: 10rpx 22rpx;
  border-radius: 26rpx;
}

.sc__hot {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 16rpx;
}

.sc__hot-title {
  font-size: 26rpx;
  font-weight: 800;
  color: var(--c-text-weak);
}

.sc__hot-words {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.sc__hot-word {
  background: #f4f2ee;
  color: var(--c-text-2);
  font-size: 24rpx;
  padding: 14rpx 28rpx;
  border-radius: 30rpx;
}
</style>
