<script setup lang="ts">
import { computed, ref } from 'vue';
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import { getMerchantGoods, setGoodsOnSale } from '@/services/api';
import { chrome } from '@/utils/chrome';
import { push, toast } from '@/utils/nav';
import { startPoll } from '@/utils/poll';
import type { MerchantGoods } from '@/models';

/** 10 · 商品管理：分类筛选 + 上下架直达 + 库存预警 + 审核状态 */
const headPad = ref(96);
const categories = ref<string[]>([]);
const activeCategory = ref('全部');
const raw = ref<MerchantGoods[]>([]);
const keyword = ref('');
const loading = ref(true);

const list = computed(() => {
  const kw = keyword.value.trim();
  return kw ? raw.value.filter((g) => g.name.indexOf(kw) >= 0) : raw.value;
});

onLoad(() => {
  headPad.value = chrome().capsuleBottom + 16;
});

onShow(() => {
  load();
});

// 有商品在审核中就轮询等结果，全部出结果就停（与 05/06/09/53 同一套写法）
let stopPoll: (() => void) | null = null;
onHide(() => syncPoll(false));
onUnload(() => syncPoll(false));

async function load(): Promise<void> {
  const res = await getMerchantGoods(activeCategory.value);
  categories.value = res.categories;
  raw.value = res.list;
  loading.value = false;
  syncPoll(true);
}

function syncPoll(alive: boolean): void {
  const wanted = alive && raw.value.some((g) => g.auditState === 'pending');
  if (wanted && !stopPoll) {
    stopPoll = startPoll(async () => {
      const res = await getMerchantGoods(activeCategory.value);
      raw.value = res.list;
      if (!res.list.some((g) => g.auditState === 'pending')) syncPoll(false);
    }, 5000);
  } else if (!wanted && stopPoll) {
    stopPoll();
    stopPoll = null;
  }
}

function onSwitchCategory(name: string): void {
  if (name === activeCategory.value) return;
  activeCategory.value = name;
  load();
}

// uni-app 的 <input> 事件在 vue-tsc 里被当成 HTML input，取值要从 detail 上转一次
function onSearchInput(e: Event): void {
  keyword.value = (e as unknown as { detail: { value: string } }).detail.value;
}

async function onToggleSale(id: string, on: boolean): Promise<void> {
  const res = await setGoodsOnSale(id, on);
  toast(res.ok ? (on ? '已上架' : '已下架') : res.message || '操作失败');
  load();
}

/** 四态标签：审核中黄 / 已驳回红 / 售卖中绿 / 已下架灰 */
function stateTagText(item: MerchantGoods): string {
  if (item.auditState === 'pending') return '审核中';
  if (item.auditState === 'rejected') return '已驳回';
  if (item.auditState === 'draft') return '待提交';
  return item.onSale ? '售卖中' : '已下架';
}

function stateTagClass(item: MerchantGoods): string {
  if (item.auditState === 'pending') return 'tag--warn';
  if (item.auditState === 'rejected') return 'tag--danger';
  if (item.auditState === 'draft') return 'tag--grey';
  return item.onSale ? 'tag--success' : 'tag--grey';
}

/** 驳回的商品直接进 101 看逐项原因 */
function onTapRejected(item: MerchantGoods): void {
  push(`/pages/merchant/goods-reject/index?id=${item.id}`);
}
</script>

<template>
  <view class="mg">
    <view class="mg__header" :style="{ paddingTop: headPad + 'px' }">
      <view class="row--between">
        <text class="mg__title">商品管理</text>
        <view class="row mg__head-actions">
          <view class="mg__pill mg__pill--grey tap" @tap="push('/pages/merchant/categories/index')"
            >分类</view
          >
          <view class="mg__pill mg__pill--grey tap" @tap="push('/pages/merchant/sale-time/index')"
            >批量时段</view
          >
          <view
            class="mg__pill mg__pill--primary tap"
            @tap="push('/pages/merchant/goods-publish/index')"
            >＋ 发布</view
          >
        </view>
      </view>

      <view class="mg__search">
        <wf-icon name="search" :size="26" color="#B0A69D" :weight="2.4" />
        <input
          class="mg__search-input"
          :value="keyword"
          placeholder="搜索商品名称"
          placeholder-class="mg__search-ph"
          @input="onSearchInput"
        />
      </view>

      <scroll-view class="mg__cats" scroll-x>
        <view
          v-for="c in categories"
          :key="c"
          class="mg__cat"
          :class="{ 'mg__cat--on': activeCategory === c }"
          @tap="onSwitchCategory(c)"
          >{{ c }}</view
        >
      </scroll-view>
    </view>

    <scroll-view class="mg__body" scroll-y>
      <view v-if="loading" class="mg__card">
        <view class="skeleton" style="width: 148rpx; height: 148rpx; border-radius: 24rpx" />
        <view class="flex1 col" style="gap: 12rpx">
          <view class="skeleton" style="width: 60%; height: 28rpx" />
          <view class="skeleton" style="width: 40%; height: 24rpx" />
        </view>
      </view>

      <template v-else-if="list.length">
        <view
          v-for="item in list"
          :key="item.id"
          class="mg__card"
          :class="{ 'mg__card--off': !item.onSale }"
        >
          <view class="mg__thumb-wrap" @tap="push(`/pages/merchant/goods-edit/index?id=${item.id}`)">
            <view class="mg__thumb" :class="{ 'mg__thumb--out': item.stockLevel === 'out' }">
              <wf-thumb :src="item.image" :radius="0" />
            </view>
            <view v-if="item.stockLevel === 'out'" class="mg__out">
              <text class="mg__out-text">售罄</text>
            </view>
          </view>

          <view class="mg__info" @tap="push(`/pages/merchant/goods-edit/index?id=${item.id}`)">
            <text class="mg__name">{{ item.name }}</text>
            <view class="mg__tags">
              <text class="mg__tag">{{ item.categoryName }}</text>
              <text v-if="item.stockLevel === 'low'" class="mg__tag mg__tag--low">{{
                item.specCountText
              }}</text>
              <text v-else-if="item.stockLevel === 'out'" class="mg__tag mg__tag--out">{{
                item.specCountText
              }}</text>
              <text v-else class="mg__stock">{{ item.specCountText }}</text>
            </view>
            <text class="mg__saletime">{{ item.saleTimeText }}</text>
            <wf-price :fen="item.price" :size="32" :from="item.priceFrom" />
          </view>

          <view class="mg__right">
            <text class="tag" :class="stateTagClass(item)">{{ stateTagText(item) }}</text>
            <view
              v-if="item.auditState === 'rejected'"
              class="mg__reason tap"
              @tap="onTapRejected(item)"
              >查看原因 ›</view
            >
            <view
              v-else-if="item.auditState === 'approved' && item.stockLevel === 'out'"
              class="pill pill--outline-primary tap"
              @tap="push('/pages/merchant/stock/index')"
              >补货</view
            >
            <!-- 未过审的商品开关置灰不可点 -->
            <wf-toggle
              v-else
              size="sm"
              :on="item.onSale"
              :disabled="item.auditState !== 'approved'"
              @change="onToggleSale(item.id, $event)"
            />
          </view>
        </view>
      </template>

      <view v-else class="mg__empty">
        <text class="empty__text">没有匹配的商品</text>
      </view>
    </scroll-view>

    <wf-tab-bar role="merchant" active="goods" />
  </view>
</template>

<style lang="scss" scoped>
.mg {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mg__header {
  background: #ffffff;
  padding-left: 32rpx;
  padding-right: 32rpx;
  padding-bottom: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  flex-shrink: 0;
  box-shadow: 0 4rpx 20rpx rgba(32, 22, 15, 0.04);
}

.mg__title {
  font-size: 40rpx;
  font-weight: 800;
}

.mg__head-actions {
  gap: 16rpx;
}

.mg__saletime {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.mg__reason {
  font-size: 21rpx;
  font-weight: 700;
  color: var(--c-danger);
}

.mg__pill {
  font-size: 24rpx;
  font-weight: 700;
  padding: 14rpx 24rpx;
  border-radius: 30rpx;
}

.mg__pill--grey {
  background: var(--c-fill-3);
  color: #7a7168;
}

.mg__pill--primary {
  background: var(--grad-main);
  color: #fff;
  font-weight: 800;
  padding: 14rpx 28rpx;
}

.mg__search {
  background: var(--c-fill-3);
  border-radius: 26rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 24rpx;
}

.mg__search-input {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  height: 68rpx;
}

.mg__search-ph {
  color: var(--c-text-placeholder);
  font-size: 24rpx;
}

.mg__cats {
  white-space: nowrap;
}

.mg__cat {
  display: inline-block;
  background: var(--c-fill-3);
  color: #7a7168;
  font-size: 23rpx;
  padding: 12rpx 24rpx;
  border-radius: 28rpx;
  margin-right: 14rpx;
}

.mg__cat--on {
  background: var(--c-text);
  color: #fff;
  font-weight: 700;
}

.mg__body {
  flex: 1;
  min-height: 0;
  padding: 28rpx 32rpx calc(200rpx + constant(safe-area-inset-bottom));
  padding: 28rpx 32rpx calc(200rpx + env(safe-area-inset-bottom));
}

.mg__card {
  background: #ffffff;
  border-radius: 32rpx;
  padding: 24rpx;
  display: flex;
  gap: 24rpx;
  align-items: center;
  margin-bottom: 24rpx;
}

.mg__card--off {
  opacity: 0.65;
}

.mg__thumb-wrap {
  position: relative;
  width: 148rpx;
  height: 148rpx;
  border-radius: 24rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.mg__thumb {
  width: 100%;
  height: 100%;
}

.mg__thumb--out {
  filter: grayscale(0.4);
}

.mg__out {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(32, 22, 15, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mg__out-text {
  color: #fff;
  font-size: 20rpx;
  font-weight: 800;
  border: 1px solid rgba(255, 255, 255, 0.7);
  padding: 4rpx 16rpx;
  border-radius: 18rpx;
}

.mg__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.mg__name {
  font-size: 27rpx;
  font-weight: 800;
}

.mg__tags {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.mg__tag {
  font-size: 20rpx;
  background: var(--c-fill-3);
  color: #7a7168;
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
}

.mg__tag--low {
  background: var(--c-warn-bg);
  color: var(--c-warn-text);
  font-weight: 700;
}

.mg__tag--out {
  background: #fdecec;
  color: var(--c-danger);
  font-weight: 700;
}

.mg__stock {
  font-size: 20rpx;
  color: var(--c-text-weaker);
}

.mg__right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
}

.mg__sale-label {
  font-size: 18rpx;
  color: var(--c-text-weaker);
}

.mg__sale-label--on {
  color: var(--c-success-deep);
  font-weight: 700;
}

.mg__empty {
  padding: 160rpx 0;
  text-align: center;
}
</style>
