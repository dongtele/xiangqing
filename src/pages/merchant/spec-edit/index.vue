<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getGoodsDraft, saveGoodsDraft } from '@/services/api';
import { SPEC_KIND_FLAGS } from '@/models';
import { fen2yuan2 } from '@/utils/money';
import { back, push, toast } from '@/utils/nav';
import type { GoodsDraft, SpecGroup, SpecGroupKind, SpecOption } from '@/models';

/**
 * 36 · 规格与价格编辑。
 * 设计稿写明三种组类型：定价格 / 不加价 / 加价多选，每个选项单独设价。
 *
 * 组类型是建组时**显式选**的（`group.kind`），不能从选项的 priceDelta 反推：
 * 新建的组还没有选项，反推恒为「不加价」，商家就永远进不了设价的入口。
 * 顾客端展示价 = 最低定价组价格，勾选加料自动累加（02 商品详情实时同步）。
 */
const draft = ref<GoodsDraft | null>(null);
let goodsId = '';

/** 组类型选择浮层：新建时 groupBeingTyped 为空，改类型时存的是目标组 id */
const kindSheet = ref(false);
const kindTarget = ref('');

const KIND_OPTIONS: { value: SpecGroupKind; label: string; sub: string }[] = [
  { value: 'price', label: '定价格（单选必选）', sub: '份量这类：每个选项单独定整价，顾客端展示价取最低' },
  { value: 'plain', label: '不加价（单选必选）', sub: '辣度这类：只影响做法，不影响价格' },
  { value: 'addon', label: '加价（可多选）', sub: '加料这类：每个选项一个 +￥，勾选后累加' },
];

onLoad((o) => {
  goodsId = (o && o.id) || '';
});

onShow(async () => {
  const res = await getGoodsDraft(goodsId);
  if (!res) {
    toast('商品不存在');
    back();
    return;
  }
  draft.value = res;
});

/** 定价组：选项自带绝对价；加价组：只展示 +￥ */
function isPricing(group: SpecGroup): boolean {
  return group.kind === 'price';
}

/** 不加价组用胶囊平铺，另外两种都要一行一个带价格框 */
function hasPriceField(group: SpecGroup): boolean {
  return group.kind !== 'plain';
}

function groupTag(group: SpecGroup): string {
  if (group.kind === 'addon') return '可多选 · 加价';
  return group.kind === 'price' ? '必选 · 定价格' : `${group.required ? '必选' : '可选'} · 不加价`;
}

function kindLabel(kind: SpecGroupKind): string {
  return KIND_OPTIONS.find((k) => k.value === kind)?.label || '';
}

function optionPriceText(group: SpecGroup, option: SpecOption): string {
  if (!draft.value) return '';
  return isPricing(group)
    ? fen2yuan2(option.price ?? draft.value.price)
    : fen2yuan2(option.priceDelta);
}

function onEditPrice(group: SpecGroup, optionId: string): void {
  const option = group.options.find((o) => o.id === optionId);
  if (!option || !draft.value) return;
  const pricing = isPricing(group);
  uni.showModal({
    title: pricing ? `${option.name} 售价（元）` : `${option.name} 加价（元）`,
    editable: true,
    placeholderText: optionPriceText(group, option),
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm || !draft.value) return;
      const value = Number(res.content);
      if (Number.isNaN(value) || value < 0) {
        toast('请输入正确的金额');
        return;
      }
      const fen = Math.round(value * 100);
      if (pricing) option.price = fen;
      else option.priceDelta = fen;
    },
  });
}

function onAddOption(group: SpecGroup): void {
  uni.showModal({
    title: `新增「${group.name}」选项`,
    editable: true,
    placeholderText: '选项名称',
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm) return;
      const name = (res.content || '').trim();
      if (!name) return;
      // 定价档默认继承商品基础价，价格框立刻可点改
      group.options.push({
        id: `o_${Date.now()}`,
        name,
        priceDelta: 0,
        price: group.kind === 'price' ? draft.value?.price : undefined,
      });
    },
  });
}

function onRemoveOption(group: SpecGroup, optionId: string): void {
  group.options = group.options.filter((o) => o.id !== optionId);
}

function onRemoveGroup(groupId: string): void {
  if (!draft.value) return;
  uni.showModal({
    title: '删除规格组？',
    content: '已下单的历史订单不受影响',
    confirmText: '删除',
    confirmColor: '#D14343',
    success: (res) => {
      if (!res.confirm || !draft.value) return;
      draft.value.specGroups = draft.value.specGroups.filter((g) => g.id !== groupId);
    },
  });
}

/** 新增：先选类型再输组名——类型定了才知道选项要不要价格框 */
function onAddGroup(): void {
  kindTarget.value = '';
  kindSheet.value = true;
}

/** 已有组改类型：建错了不用删掉重来 */
function onChangeKind(group: SpecGroup): void {
  kindTarget.value = group.id;
  kindSheet.value = true;
}

function onPickKind(value: string): void {
  const kind = value as SpecGroupKind;
  kindSheet.value = false;
  if (kindTarget.value) {
    applyKind(kindTarget.value, kind);
    kindTarget.value = '';
    return;
  }
  uni.showModal({
    title: `新增「${kindLabel(kind)}」`,
    editable: true,
    placeholderText: '组名，如「份量」「加料」',
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm || !draft.value) return;
      const name = (res.content || '').trim();
      if (!name) return;
      draft.value.specGroups.push({
        id: `sg_${Date.now()}`,
        name,
        kind,
        ...SPEC_KIND_FLAGS[kind],
        options: [],
      });
    },
  });
}

function applyKind(groupId: string, kind: SpecGroupKind): void {
  const group = draft.value?.specGroups.find((g) => g.id === groupId);
  if (!group || group.kind === kind) return;
  group.kind = kind;
  group.multiple = SPEC_KIND_FLAGS[kind].multiple;
  group.required = SPEC_KIND_FLAGS[kind].required;
  group.affectsPrice = SPEC_KIND_FLAGS[kind].affectsPrice;
  if (kind === 'plain') {
    // 不加价组不能留着差价，否则顾客端会莫名多收钱
    group.options.forEach((o) => {
      o.priceDelta = 0;
      o.price = undefined;
    });
    toast('已改为不加价，选项差价已清零');
  } else if (kind === 'price') {
    group.options.forEach((o) => {
      if (o.price === undefined) o.price = draft.value?.price;
    });
  }
}

async function onSave(): Promise<void> {
  if (!draft.value) return;
  const empty = draft.value.specGroups.find((g) => !g.options.length);
  if (empty) {
    toast(`「${empty.name}」还没有选项`);
    return;
  }
  const res = await saveGoodsDraft(JSON.parse(JSON.stringify(draft.value)) as GoodsDraft);
  // 规格属于审核字段，改了要重新过审；审核期间顾客端仍是上一版
  toast(res.auditState === 'pending' ? '已提交审核' : '规格已保存', 'success');
  back();
}
</script>

<template>
  <view v-if="draft" class="se">
    <view class="se__nav">
      <wf-nav-bar title="规格与价格" />
      <text class="se__subtitle">{{ draft.name }}</text>
    </view>

    <scroll-view class="se__body" scroll-y>
      <view v-for="group in draft.specGroups" :key="group.id" class="card">
        <view class="row--between">
          <view class="row se__group-head">
            <text class="se__group-name">{{ group.name }}</text>
            <text
              class="se__group-tag tap-sm"
              :class="{ 'se__group-tag--grey': group.kind === 'plain' }"
              @tap="onChangeKind(group)"
              >{{ groupTag(group) }} ▾</text
            >
          </view>
          <text class="se__group-del tap" @tap="onRemoveGroup(group.id)">删除组</text>
        </view>

        <!-- 带价选项：一行一个，右侧价格框 -->
        <template v-if="hasPriceField(group)">
          <view v-for="o in group.options" :key="o.id" class="se__row">
            <text class="se__drag">⠿</text>
            <text class="flex1 se__opt-name">{{ o.name }}</text>
            <view class="se__price tap" @tap="onEditPrice(group, o.id)">
              <text class="se__price-sym">{{ group.kind === 'addon' ? '+¥' : '¥' }}</text>
              <text class="se__price-num">{{ optionPriceText(group, o) }}</text>
            </view>
            <text class="se__del tap" @tap="onRemoveOption(group, o.id)">✕</text>
          </view>
          <view class="se__add tap" @tap="onAddOption(group)">＋ 添加选项</view>
        </template>

        <!-- 不加价选项：胶囊平铺 -->
        <template v-else>
          <view class="se__chips">
            <text v-for="o in group.options" :key="o.id" class="se__chip"
              >{{ o.name }}
              <text class="se__chip-x tap" @tap.stop="onRemoveOption(group, o.id)">✕</text>
            </text>
            <text class="se__chip-add tap" @tap="onAddOption(group)">＋</text>
          </view>
        </template>
      </view>

      <view class="se__tip"
        >顾客端展示价 = 最低「定价组」价格（¥{{ fen2yuan2(draft.price) }} 起）；勾选加料自动累加。保存后
        02 屏商品详情实时同步。</view
      >

      <view class="se__lib tap" @tap="push('/pages/merchant/option-lib/index')"
        >从选项库导入（64）›</view
      >

      <view class="se__foot" />
    </scroll-view>

    <view class="se__bar">
      <view class="se__btn se__btn--ghost tap" @tap="onAddGroup">＋ 新增规格组</view>
      <view class="se__btn se__btn--primary tap" @tap="onSave">保存</view>
    </view>

    <wf-picker-sheet
      :show="kindSheet"
      title="规格组类型"
      :options="KIND_OPTIONS"
      :value="kindTarget ? draft.specGroups.find((g) => g.id === kindTarget)?.kind || '' : ''"
      @close="kindSheet = false"
      @pick="onPickKind"
    />
  </view>
</template>

<style lang="scss" scoped>
.se {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.se__nav {
  position: relative;
  flex-shrink: 0;
}

.se__subtitle {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -6rpx;
  text-align: center;
  font-size: 20rpx;
  color: var(--c-text-weaker);
}

.se__body {
  flex: 1;
  min-height: 0;
  padding: 28rpx 32rpx 0;
}

.card {
  margin-bottom: 24rpx;
}

.se__group-head {
  gap: 16rpx;
}

.se__group-name {
  font-size: 28rpx;
  font-weight: 800;
}

.se__group-tag {
  font-size: 20rpx;
  color: var(--c-primary);
  font-weight: 700;
  background: var(--c-primary-bg);
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
}

.se__group-tag--grey {
  color: #7a7168;
  background: var(--c-fill-3);
}

.se__group-del {
  font-size: 23rpx;
  color: var(--c-danger);
  font-weight: 700;
}

.se__row {
  background: #faf7f2;
  border-radius: 24rpx;
  padding: 22rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.se__drag,
.se__del {
  color: var(--c-text-placeholder-2);
  font-size: 26rpx;
}

.se__opt-name {
  font-size: 26rpx;
  font-weight: 700;
}

.se__price {
  background: #fff;
  border: 3rpx solid var(--c-line-2);
  border-radius: 18rpx;
  padding: 12rpx 22rpx;
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.se__price-sym {
  font-size: 20rpx;
  color: var(--c-text-weaker);
}

.se__price-num {
  font-size: 28rpx;
  font-weight: 800;
}

.se__add {
  text-align: center;
  border: 3rpx dashed var(--c-line-5);
  color: var(--c-text-placeholder);
  font-size: 24rpx;
  font-weight: 700;
  padding: 18rpx 0;
  border-radius: 22rpx;
}

.se__chips {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.se__chip {
  background: #faf7f2;
  color: var(--c-text);
  font-size: 24rpx;
  font-weight: 700;
  padding: 14rpx 28rpx;
  border-radius: 20rpx;
}

.se__chip-x {
  color: var(--c-text-placeholder-2);
  margin-left: 8rpx;
}

.se__chip-add {
  border: 3rpx dashed var(--c-line-5);
  color: var(--c-text-placeholder);
  font-size: 24rpx;
  padding: 14rpx 28rpx;
  border-radius: 20rpx;
}

.se__tip {
  background: var(--c-warn-bg);
  border: 1px solid #f5e3bc;
  border-radius: 24rpx;
  padding: 20rpx 28rpx;
  font-size: 22rpx;
  color: var(--c-warn-text-2);
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.se__lib {
  text-align: center;
  font-size: 24rpx;
  font-weight: 700;
  color: var(--c-primary);
  padding: 8rpx 0;
}

.se__foot {
  height: 32rpx;
}

.se__bar {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #f3eee8;
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 24rpx;
}

.se__btn {
  flex: 1;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 29rpx;
  font-weight: 800;
}

.se__btn--ghost {
  border: 3rpx dashed #ffb08f;
  color: var(--c-primary);
  background: #fffdfb;
}

.se__btn--primary {
  background: var(--grad-main);
  color: #fff;
  box-shadow: var(--sh-primary-btn);
}
</style>
