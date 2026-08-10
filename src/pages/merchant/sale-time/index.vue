<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getGoodsDraft, getMerchantGoods, saveSaleTime } from '@/services/api';
import { allDaySaleTime } from '@/models';
import { fen2yuan } from '@/utils/money';
import { back, toast } from '@/utils/nav';
import { mergeSlots, nextSlotDefaults, saleTimeText } from '@/utils/sale-time';
import type { MerchantGoods, SaleSlot, SaleTime } from '@/models';

/**
 * 102 · 售卖时段 · 批量设置。
 *
 * 两种进法：
 * - 10 商品管理「批量时段」不带 id → 批量模式，下面勾选商品套用同一时段
 * - 11 编辑商品「售卖时段」带 id   → 单商品模式，只改这一个
 *
 * 时段调整**不触发重新审核**（交付文档）。
 */
const WEEKDAYS = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 7, label: '日' },
];

const goods = ref<MerchantGoods[]>([]);
const picked = reactive<Record<string, boolean>>({});
const singleId = ref('');
const singleName = ref('');

const form = ref<SaleTime>(allDaySaleTime());

const isSingle = computed(() => !!singleId.value);
const pickedIds = computed(() => Object.keys(picked).filter((id) => picked[id]));
const selectedCount = computed(() => (isSingle.value ? 1 : pickedIds.value.length));
const allPicked = computed(
  () => goods.value.length > 0 && pickedIds.value.length === goods.value.length
);

const quickDays = computed(() => {
  const days = [...form.value.weekdays].sort((a, b) => a - b).join();
  return {
    all: days === '1,2,3,4,5,6,7',
    work: days === '1,2,3,4,5',
    weekend: days === '6,7',
  };
});

onLoad((o) => {
  singleId.value = (o && o.id) || '';
});

onShow(async () => {
  if (isSingle.value) {
    const draft = await getGoodsDraft(singleId.value);
    if (!draft) {
      toast('商品不存在');
      back();
      return;
    }
    singleName.value = draft.name;
    form.value = JSON.parse(JSON.stringify(draft.saleTime)) as SaleTime;
    return;
  }
  const res = await getMerchantGoods();
  goods.value = res.list.filter((g) => g.auditState === 'approved');
});

function setMode(mode: 'allday' | 'range'): void {
  form.value.mode = mode;
  // 切到指定时段时至少给一段，否则页面空着没法编辑
  if (mode === 'range' && !form.value.slots.length) onAddSlot();
}

function setQuickDays(kind: 'all' | 'work' | 'weekend'): void {
  form.value.weekdays =
    kind === 'all' ? [1, 2, 3, 4, 5, 6, 7] : kind === 'work' ? [1, 2, 3, 4, 5] : [6, 7];
}

function toggleDay(day: number): void {
  const days = form.value.weekdays;
  const at = days.indexOf(day);
  if (at >= 0) {
    if (days.length === 1) {
      toast('至少保留一天');
      return;
    }
    days.splice(at, 1);
  } else {
    days.push(day);
  }
}

function onAddSlot(): void {
  const { start, end } = nextSlotDefaults(form.value.slots);
  form.value.slots.push({
    id: `sl_${Date.now()}`,
    label: form.value.slots.length === 0 ? '午市' : form.value.slots.length === 1 ? '晚市' : '时段',
    start,
    end,
    enabled: true,
  });
}

function onRemoveSlot(id: string): void {
  form.value.slots = form.value.slots.filter((s) => s.id !== id);
}

/** 时间用 showModal 收，格式 HH:mm–HH:mm */
function onEditSlot(slot: SaleSlot): void {
  uni.showModal({
    title: `${slot.label} 时间`,
    editable: true,
    placeholderText: `${slot.start}-${slot.end}`,
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm) return;
      const m = /^(\d{1,2}):(\d{2})\s*[-–~]\s*(\d{1,2}):(\d{2})$/.exec((res.content || '').trim());
      if (!m) {
        toast('请按 11:00-14:00 的格式填写');
        return;
      }
      const pad = (n: string) => n.padStart(2, '0');
      slot.start = `${pad(m[1])}:${m[2]}`;
      slot.end = `${pad(m[3])}:${m[4]}`;
    },
  });
}

function onToggleAll(): void {
  const next = !allPicked.value;
  goods.value.forEach((g) => {
    picked[g.id] = next;
  });
}

async function onSave(): Promise<void> {
  if (form.value.mode === 'range') {
    const merged = mergeSlots(form.value.slots);
    if (!merged.length) {
      toast('至少启用一个时段');
      return;
    }
    // 重叠自动合并（交付文档）
    form.value.slots = merged;
  }
  const ids = isSingle.value ? [singleId.value] : pickedIds.value;
  if (!ids.length) {
    toast('请先勾选要套用的商品');
    return;
  }
  await saveSaleTime(JSON.parse(JSON.stringify(form.value)) as SaleTime, ids);
  toast(`已应用到 ${ids.length} 件商品`, 'success');
  back();
}
</script>

<template>
  <view class="st">
    <view class="st__nav">
      <wf-nav-bar title="售卖时段" />
      <text class="st__subtitle">{{
        isSingle ? singleName : `批量设置 · ${selectedCount} 件已选`
      }}</text>
    </view>

    <scroll-view class="st__body" scroll-y>
      <!-- 全天 / 指定时段 -->
      <view class="st__seg">
        <view
          class="st__seg-item tap-sm"
          :class="{ 'st__seg-item--on': form.mode === 'allday' }"
          @tap="setMode('allday')"
          >全天售卖</view
        >
        <view
          class="st__seg-item tap-sm"
          :class="{ 'st__seg-item--on': form.mode === 'range' }"
          @tap="setMode('range')"
          >指定时段</view
        >
      </view>

      <!-- 重复日期 -->
      <view class="card">
        <text class="t-section">重复日期</text>
        <view class="st__quick">
          <text
            class="st__quick-item tap-sm"
            :class="{ 'st__quick-item--on': quickDays.all }"
            @tap="setQuickDays('all')"
            >每天</text
          >
          <text
            class="st__quick-item tap-sm"
            :class="{ 'st__quick-item--on': quickDays.work }"
            @tap="setQuickDays('work')"
            >工作日</text
          >
          <text
            class="st__quick-item tap-sm"
            :class="{ 'st__quick-item--on': quickDays.weekend }"
            @tap="setQuickDays('weekend')"
            >周末</text
          >
        </view>
        <view class="st__days">
          <text
            v-for="d in WEEKDAYS"
            :key="d.value"
            class="st__day tap-sm"
            :class="{ 'st__day--on': form.weekdays.indexOf(d.value) >= 0 }"
            @tap="toggleDay(d.value)"
            >{{ d.label }}</text
          >
        </view>
      </view>

      <!-- 时段列表 -->
      <view v-if="form.mode === 'range'" class="card">
        <view class="row--between">
          <text class="t-section">售卖时段</text>
          <text class="st__hint">可多段，重叠自动合并</text>
        </view>

        <view v-for="slot in form.slots" :key="slot.id" class="st__slot">
          <view class="flex1 col st__slot-text">
            <text class="st__slot-label">{{ slot.label }}</text>
            <text class="st__slot-time tap-sm" @tap="onEditSlot(slot)"
              >{{ slot.start }} – {{ slot.end }} ✎</text
            >
          </view>
          <wf-toggle size="sm" :on="slot.enabled" @change="slot.enabled = $event" />
          <text class="st__slot-del tap" @tap="onRemoveSlot(slot.id)">✕</text>
        </view>

        <view class="st__add tap" @tap="onAddSlot">＋ 添加时段</view>
      </view>

      <!-- 批量模式才出商品勾选 -->
      <view v-if="!isSingle" class="card">
        <view class="row--between">
          <text class="t-section">应用到商品</text>
          <text class="st__all tap" @tap="onToggleAll">{{
            allPicked ? '取消全选' : '全选本分类 ✓'
          }}</text>
        </view>

        <view v-for="g in goods" :key="g.id" class="st__goods tap" @tap="picked[g.id] = !picked[g.id]">
          <view class="st__check" :class="{ 'st__check--on': picked[g.id] }">
            <wf-icon v-if="picked[g.id]" name="check" :size="20" color="#FFFFFF" :weight="3.6" />
          </view>
          <view class="st__thumb"><wf-thumb :src="g.image" :radius="16" /></view>
          <view class="flex1 col st__goods-text">
            <text class="st__goods-name ellipsis">{{ g.name }}</text>
            <text class="st__goods-now">当前：{{ g.saleTimeText }}</text>
          </view>
          <text class="st__goods-price">¥{{ fen2yuan(g.price) }}</text>
        </view>

        <view v-if="!goods.length" class="st__empty">暂无已过审的商品</view>
      </view>

      <text class="st__note"
        >非售卖时段的商品在顾客端置灰并标注「{{
          form.mode === 'range' && form.slots.length ? form.slots[0].start : '11:00'
        }} 开售」，不可加购；时段调整无需重新审核。</text
      >

      <view class="st__foot" />
    </scroll-view>

    <view class="st__bar">
      <view class="col st__count">
        <text class="st__count-label">当前设置</text>
        <text class="st__count-value">{{ saleTimeText(form) }}</text>
      </view>
      <view class="st__submit tap" @tap="onSave">{{
        isSingle ? '保存' : `保存并应用到 ${selectedCount} 件商品`
      }}</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.st {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.st__nav {
  position: relative;
  flex-shrink: 0;
}

.st__subtitle {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -6rpx;
  text-align: center;
  font-size: 20rpx;
  color: var(--c-text-weaker);
}

.st__body {
  flex: 1;
  min-height: 0;
  padding: 28rpx 32rpx 0;
}

.card {
  margin-bottom: 24rpx;
}

.st__seg {
  background: #fff;
  border-radius: var(--r-card);
  padding: 10rpx;
  display: flex;
  margin-bottom: 24rpx;
}

.st__seg-item {
  flex: 1;
  text-align: center;
  font-size: 27rpx;
  font-weight: 700;
  color: var(--c-text-weak);
  padding: 20rpx 0;
  border-radius: 20rpx;
}

.st__seg-item--on {
  background: var(--grad-main);
  color: #fff;
  font-weight: 800;
}

.st__quick {
  display: flex;
  gap: 16rpx;
}

.st__quick-item {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--c-text-2);
  background: var(--c-fill-3);
  padding: 14rpx 30rpx;
  border-radius: 28rpx;
}

.st__quick-item--on {
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-weight: 800;
}

.st__days {
  display: flex;
  gap: 12rpx;
}

.st__day {
  flex: 1;
  text-align: center;
  font-size: 25rpx;
  font-weight: 700;
  color: var(--c-text-weak);
  background: #faf7f2;
  padding: 18rpx 0;
  border-radius: 18rpx;
}

.st__day--on {
  background: var(--c-primary);
  color: #fff;
  font-weight: 800;
}

.st__hint {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.st__slot {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #faf7f2;
  border-radius: 24rpx;
  padding: 22rpx 24rpx;
}

.st__slot-text {
  gap: 8rpx;
  min-width: 0;
}

.st__slot-label {
  font-size: 26rpx;
  font-weight: 800;
}

.st__slot-time {
  font-size: 23rpx;
  color: var(--c-text-2);
}

.st__slot-del {
  font-size: 26rpx;
  color: var(--c-text-placeholder-2);
}

.st__add {
  text-align: center;
  border: 3rpx dashed var(--c-line-5);
  color: var(--c-text-placeholder);
  font-size: 24rpx;
  font-weight: 700;
  padding: 18rpx 0;
  border-radius: 22rpx;
}

.st__all {
  font-size: 22rpx;
  font-weight: 700;
  color: var(--c-primary);
}

.st__goods {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding-top: 20rpx;
  border-top: 1px solid var(--c-line);
}

.st__check {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 3rpx solid var(--c-line-5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.st__check--on {
  background: var(--c-primary);
  border-color: var(--c-primary);
}

.st__thumb {
  width: 76rpx;
  height: 76rpx;
  border-radius: 16rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.st__goods-text {
  gap: 6rpx;
  min-width: 0;
}

.st__goods-name {
  font-size: 26rpx;
  font-weight: 700;
}

.st__goods-now {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.st__goods-price {
  font-size: 26rpx;
  font-weight: 800;
  color: var(--c-primary-deep);
}

.st__empty {
  padding: 40rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: var(--c-text-weak);
}

.st__note {
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.6;
}

.st__foot {
  height: 32rpx;
}

.st__bar {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #f3eee8;
  padding: 20rpx 32rpx;
  padding-bottom: calc(24rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.st__count {
  gap: 4rpx;
  min-width: 0;
}

.st__count-label {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.st__count-value {
  font-size: 24rpx;
  font-weight: 800;
}

.st__submit {
  flex: 1;
  height: 96rpx;
  border-radius: 48rpx;
  background: var(--grad-main);
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--sh-primary-btn);
}
</style>
