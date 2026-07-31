<script setup lang="ts">
import { computed, getCurrentInstance, ref, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getMenu, getShop, trialCheckout } from '@/services/api';
import { CURRENT_SHOP_ID } from '@/config';
import { useCartStore } from '@/stores/cart';
import { chrome } from '@/utils/chrome';
import { fen2yuan } from '@/utils/money';
import { push, todo } from '@/utils/nav';
import type { CheckoutTrial, Goods, MenuGroup, Shop } from '@/models';

/** 01 · 点餐菜单（首页）：左侧分类锚点 + 右侧商品列表 + 底部购物车条 */
const cart = useCartStore();
const instance = getCurrentInstance();

const headPad = ref(92);
const shop = ref<Shop | null>(null);
const rawGroups = ref<MenuGroup[]>([]);
const activeCatId = ref('');
const scrollIntoId = ref('');
const loading = ref(true);
const sheetShow = ref(false);
const trial = ref<CheckoutTrial | null>(null);

/** 各分组在右侧列表中的 top 偏移，用于滚动联动高亮 */
let groupTops: { id: string; top: number }[] = [];
let trialTimer: ReturnType<typeof setTimeout> | null = null;

const groups = computed(() =>
  rawGroups.value.map((g) => ({
    id: g.category.id,
    name: g.category.name,
    goods: g.goods.map((gd) => ({
      ...gd,
      qty: cart.qtyOfGoods(gd.id),
      hasSpec: gd.specGroups.length > 0,
      // 只有存在加价选项才显示「起」，单规格商品不显示
      priceFrom: gd.specGroups.some((sg) => sg.options.some((o) => o.priceDelta > 0)),
    })),
  }))
);

/* ---------- 满减文案：金额与优惠一律由服务端试算，前端只做展示 ---------- */

const hitCoupon = computed(() => !!trial.value && trial.value.couponDiscount > 0);
const gapText = computed(() => (trial.value ? fen2yuan(5000 - trial.value.itemsTotal) : '0'));

const barPromo = computed(() => {
  if (!trial.value || !cart.count) return '';
  return hitCoupon.value
    ? `已享满50减10 · 结算再省 ¥${fen2yuan(trial.value.couponDiscount)}`
    : `再买 ¥${gapText.value} 可减 ¥10`;
});

const sheetPromo = computed(() => {
  if (!trial.value || !cart.count) return '';
  return hitCoupon.value
    ? `已满 ¥50，结算立减 ¥${fen2yuan(trial.value.couponDiscount)}`
    : `再买 ¥${gapText.value} 可减 ¥10`;
});

const sheetPromoNote = computed(() => (hitCoupon.value ? '已是最优惠 ✓' : ''));

const sheetFooterNote = computed(() => {
  if (!trial.value || !hitCoupon.value) return '';
  return `结算再减 ¥${fen2yuan(trial.value.couponDiscount)}，实付约 ¥${fen2yuan(
    trial.value.payable
  )}`;
});

function refreshTrial(): void {
  if (!cart.count) {
    trial.value = null;
    sheetShow.value = false;
    return;
  }
  if (trialTimer) clearTimeout(trialTimer);
  trialTimer = setTimeout(() => {
    trialCheckout(cart.snapshot(), cart.deliveryType).then((t) => {
      trial.value = t;
    });
  }, 120);
}

// 购物车任何变化都重新试算：本页加减、02 详情页加购返回、浮层里改数量都走这里，
// 保证购物车条 / 浮层上的满减文案与实付金额始终是服务端算的那一份。
watch(() => [cart.count, cart.itemsTotal], refreshTrial);

onLoad(async () => {
  headPad.value = chrome().capsuleBottom + 12;
  const [nextShop, menu] = await Promise.all([getShop(), getMenu()]);
  shop.value = nextShop;
  rawGroups.value = menu.groups;
  activeCatId.value = menu.groups.length ? menu.groups[0].category.id : '';
  loading.value = false;
  refreshTrial();
  setTimeout(measureGroups, 60);
});

function measureGroups(): void {
  const query = uni.createSelectorQuery().in(instance?.proxy);
  query.selectAll('.js-group').boundingClientRect();
  query.select('.menu__list').boundingClientRect();
  query.exec((res) => {
    const rects = (res[0] || []) as UniApp.NodeInfo[];
    const list = res[1] as UniApp.NodeInfo;
    if (!list || !rects.length) return;
    groupTops = rects.map((r, i) => ({
      id: rawGroups.value[i] ? rawGroups.value[i].category.id : '',
      top: (r.top || 0) - (list.top || 0),
    }));
  });
}

/* ---------- 分类联动 ---------- */

function onTapCategory(id: string): void {
  activeCatId.value = id;
  scrollIntoId.value = `g-${id}`;
}

function onListScroll(e: { detail: { scrollTop: number } }): void {
  const top = e.detail.scrollTop + 10;
  let active = groupTops.length ? groupTops[0].id : '';
  groupTops.forEach((g) => {
    if (top >= g.top) active = g.id;
  });
  if (active && active !== activeCatId.value) activeCatId.value = active;
}

/* ---------- 选餐 ---------- */

function goodsById(id: string): Goods | undefined {
  for (const g of rawGroups.value) {
    const hit = g.goods.find((x) => x.id === id);
    if (hit) return hit;
  }
  return undefined;
}

function onTapGoods(id: string): void {
  push(`/pages/customer/goods/index?id=${id}`);
}

function onPlus(id: string): void {
  const goods = goodsById(id);
  if (!goods) return;
  if (goods.specGroups.length) {
    // 多规格必须先选规格（设计稿：显示「选规格」）
    push(`/pages/customer/goods/index?id=${id}`);
    return;
  }
  cart.add(CURRENT_SHOP_ID, goods, []);
}

function onMinus(id: string): void {
  cart.decreaseByGoods(id);
}

/* ---------- 购物车浮层（30） ---------- */

function onOpenCart(): void {
  if (!cart.count) return;
  sheetShow.value = true;
}

function onClearCart(): void {
  uni.showModal({
    title: '清空购物车？',
    content: '已选商品将全部移除',
    confirmColor: '#FF4A17',
    success: (res) => {
      if (res.confirm) cart.clear();
    },
  });
}

function onSheetPlus(key: string): void {
  cart.changeQty(key, 1);
}

function onSheetMinus(key: string): void {
  cart.changeQty(key, -1);
}

function onCheckout(): void {
  if (!cart.count) return;
  sheetShow.value = false;
  push('/pages/customer/checkout/index');
}
</script>

<template>
  <view class="menu">
    <!-- 店铺头部 -->
    <view class="menu__header" :style="{ paddingTop: headPad + 'px' }">
      <view class="menu__shop tap" @tap="todo('32', '店铺主页')">
        <view class="menu__logo"><wf-thumb :src="shop ? shop.logo : ''" :radius="28" /></view>
        <view class="menu__shop-info">
          <view class="menu__shop-name">
            <text>{{ shop ? shop.name : '' }}</text>
            <text class="menu__shop-arrow">›</text>
          </view>
          <text v-if="shop" class="menu__shop-meta"
            >★ {{ shop.score }} · {{ shop.monthSoldText }} · {{ shop.etaText }} ·
            {{ shop.distanceText }}</text
          >
        </view>
      </view>

      <view class="menu__search tap" @tap="todo('18', '店内搜索')">
        <wf-icon name="search" :size="28" color="#B0A69D" :weight="2.4" />
        <text class="menu__search-ph">搜索店内美食</text>
      </view>

      <view v-if="shop" class="menu__promo">
        <text class="menu__promo-tag">{{ shop.promoTag }}</text>
        <text class="menu__promo-text ellipsis">{{ shop.promoText }}</text>
      </view>
    </view>

    <!-- 分类 + 商品 -->
    <view class="menu__content">
      <scroll-view class="menu__rail" scroll-y>
        <view
          v-for="g in groups"
          :key="g.id"
          class="menu__cat"
          :class="{ 'menu__cat--on': activeCatId === g.id }"
          @tap="onTapCategory(g.id)"
        >
          <view v-if="activeCatId === g.id" class="menu__cat-bar" />
          <text>{{ g.name }}</text>
        </view>
      </scroll-view>

      <scroll-view
        class="menu__list"
        scroll-y
        :scroll-into-view="scrollIntoId"
        scroll-with-animation
        @scroll="onListScroll"
      >
        <view v-if="loading" class="menu__group">
          <view class="skeleton" style="width: 160rpx; height: 32rpx" />
          <view v-for="n in 4" :key="n" class="menu__row">
            <view class="skeleton" style="width: 192rpx; height: 192rpx; border-radius: 28rpx" />
            <view class="menu__row-main">
              <view class="skeleton" style="width: 70%; height: 30rpx" />
              <view class="skeleton" style="width: 40%; height: 24rpx" />
            </view>
          </view>
        </view>

        <view v-for="group in groups" :id="`g-${group.id}`" :key="group.id" class="menu__group js-group">
          <text class="menu__group-title">{{ group.name }}</text>

          <view v-for="item in group.goods" :key="item.id" class="menu__row">
            <view class="menu__thumb-wrap" @tap="onTapGoods(item.id)">
              <view class="menu__thumb"><wf-thumb :src="item.image" :radius="28" /></view>
              <text v-if="item.rankTag" class="menu__rank">{{ item.rankTag }}</text>
            </view>

            <view class="menu__row-main">
              <view class="menu__row-top" @tap="onTapGoods(item.id)">
                <text class="menu__name">{{ item.name }}</text>
                <text class="menu__meta">月售{{ item.monthSold }} · 好评{{ item.praiseRate }}%</text>
              </view>
              <view class="menu__row-bottom">
                <wf-price :fen="item.price" :size="38" :from="item.priceFrom" :unit="item.unit" />
                <view
                  v-if="item.hasSpec"
                  class="menu__spec-btn tap-sm"
                  @tap="onTapGoods(item.id)"
                  >选规格</view
                >
                <wf-qty-stepper
                  v-else
                  :qty="item.qty"
                  :plus-size="52"
                  :minus-size="48"
                  @plus="onPlus(item.id)"
                  @minus="onMinus(item.id)"
                />
              </view>
            </view>
          </view>
        </view>

        <view class="menu__list-foot" />
      </scroll-view>
    </view>

    <wf-cart-bar
      :count="cart.count"
      :total="cart.itemsTotal"
      :promo-text="barPromo"
      @opencart="onOpenCart"
      @checkout="onCheckout"
    />

    <wf-cart-sheet
      :show="sheetShow"
      :items="cart.items"
      :count="cart.count"
      :total="cart.itemsTotal"
      :promo-text="sheetPromo"
      :promo-note="sheetPromoNote"
      :footer-note="sheetFooterNote"
      @close="sheetShow = false"
      @clear="onClearCart"
      @plus="onSheetPlus"
      @minus="onSheetMinus"
      @checkout="onCheckout"
    />

    <wf-tab-bar role="customer" active="menu" />
  </view>
</template>

<style lang="scss" scoped>
page {
  background: #ffffff;
}

.menu {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ---------- 头部 ---------- */
.menu__header {
  background: var(--grad-header);
  padding-left: 32rpx;
  padding-right: 32rpx;
  padding-bottom: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  flex-shrink: 0;
}

.menu__shop {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.menu__logo {
  width: 104rpx;
  height: 104rpx;
  border-radius: 28rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  overflow: hidden;
}

.menu__shop-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.menu__shop-name {
  color: #fff;
  font-size: 36rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.menu__shop-arrow {
  font-size: 26rpx;
  opacity: 0.75;
}

.menu__shop-meta {
  color: rgba(255, 255, 255, 0.82);
  font-size: 22rpx;
}

.menu__search {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 36rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 28rpx;
}

.menu__search-ph {
  font-size: 25rpx;
  color: var(--c-text-placeholder);
}

.menu__promo {
  display: flex;
  align-items: center;
  gap: 16rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
}

.menu__promo-tag {
  background: rgba(255, 255, 255, 0.22);
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.menu__promo-text {
  flex: 1;
  min-width: 0;
}

/* ---------- 分类 / 列表 ---------- */
.menu__content {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.menu__rail {
  width: 176rpx;
  height: 100%;
  background: #f1eee9;
  flex-shrink: 0;
}

.menu__cat {
  position: relative;
  padding: 28rpx 20rpx;
  font-size: 25rpx;
  color: #7a7168;
}

.menu__cat--on {
  background: #ffffff;
  font-size: 26rpx;
  font-weight: 800;
  color: var(--c-text);
}

.menu__cat-bar {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 7rpx;
  height: 36rpx;
  background: var(--c-primary);
  border-radius: 0 8rpx 8rpx 0;
}

.menu__list {
  flex: 1;
  height: 100%;
  background: #ffffff;
}

.menu__group {
  padding: 28rpx 28rpx 0;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.menu__group-title {
  font-size: 28rpx;
  font-weight: 800;
}

.menu__row {
  display: flex;
  gap: 20rpx;
}

.menu__thumb-wrap {
  position: relative;
  flex-shrink: 0;
}

.menu__thumb {
  width: 192rpx;
  height: 192rpx;
  border-radius: 28rpx;
  overflow: hidden;
}

.menu__rank {
  position: absolute;
  top: 0;
  left: 0;
  background: var(--grad-main);
  color: #fff;
  font-size: 18rpx;
  font-weight: 800;
  padding: 5rpx 14rpx;
  border-radius: 28rpx 0 20rpx 0;
}

.menu__row-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4rpx 0;
  gap: 12rpx;
}

.menu__row-top {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.menu__name {
  font-size: 29rpx;
  font-weight: 800;
}

.menu__meta {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.menu__row-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.menu__spec-btn {
  background: var(--grad-main);
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  padding: 10rpx 22rpx;
  border-radius: 26rpx;
}

/* 让位给购物车条 + TabBar */
.menu__list-foot {
  height: calc(300rpx + constant(safe-area-inset-bottom));
  height: calc(300rpx + env(safe-area-inset-bottom));
}
</style>
