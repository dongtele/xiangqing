<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getGoodsDraft, saveGoodsDraft } from '@/services/api';
import { fen2yuan2 } from '@/utils/money';
import { back, push, toast } from '@/utils/nav';
import type { GoodsDraft, SpecGroup } from '@/models';

/**
 * 36 · 规格与价格编辑。
 * 「份量」这类定价组：选项各自带整价；「加料」这类加价组：选项带 +￥。
 * 顾客端展示价 = 最低定价组价格，勾选加料自动累加（02 商品详情实时同步）。
 */
const draft = ref<GoodsDraft | null>(null);
let goodsId = '';

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

/** 定价组：选项价 = 基础价 + 加价；加价组：只展示 +￥ */
function isPricing(group: SpecGroup): boolean {
  return group.required && group.options.some((o) => o.priceDelta > 0);
}

function groupTag(group: SpecGroup): string {
  if (group.multiple) return '可多选 · 加价';
  return isPricing(group) ? '必选 · 定价格' : `${group.required ? '必选' : '可选'} · 不加价`;
}

function optionPriceText(group: SpecGroup, priceDelta: number): string {
  if (!draft.value) return '';
  return isPricing(group)
    ? fen2yuan2(draft.value.price + priceDelta)
    : fen2yuan2(priceDelta);
}

function onEditPrice(group: SpecGroup, optionId: string): void {
  const option = group.options.find((o) => o.id === optionId);
  if (!option || !draft.value) return;
  const pricing = isPricing(group);
  uni.showModal({
    title: pricing ? `${option.name} 售价（元）` : `${option.name} 加价（元）`,
    editable: true,
    placeholderText: optionPriceText(group, option.priceDelta),
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm || !draft.value) return;
      const value = Number(res.content);
      if (Number.isNaN(value) || value < 0) {
        toast('请输入正确的金额');
        return;
      }
      const fen = Math.round(value * 100);
      option.priceDelta = pricing ? Math.max(0, fen - draft.value.price) : fen;
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
      group.options.push({ id: `o_${Date.now()}`, name, priceDelta: 0 });
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

function onAddGroup(): void {
  uni.showModal({
    title: '新增规格组',
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
        multiple: false,
        required: true,
        options: [],
      });
    },
  });
}

async function onSave(): Promise<void> {
  if (!draft.value) return;
  const empty = draft.value.specGroups.find((g) => !g.options.length);
  if (empty) {
    toast(`「${empty.name}」还没有选项`);
    return;
  }
  await saveGoodsDraft(JSON.parse(JSON.stringify(draft.value)) as GoodsDraft);
  toast('规格已保存', 'success');
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
            <text class="se__group-tag" :class="{ 'se__group-tag--grey': group.multiple }">{{
              groupTag(group)
            }}</text>
          </view>
          <text class="se__group-del tap" @tap="onRemoveGroup(group.id)">删除组</text>
        </view>

        <!-- 带价选项：一行一个，右侧价格框 -->
        <template v-if="isPricing(group) || group.multiple">
          <view v-for="o in group.options" :key="o.id" class="se__row">
            <text class="se__drag">⠿</text>
            <text class="flex1 se__opt-name">{{ o.name }}</text>
            <view class="se__price tap" @tap="onEditPrice(group, o.id)">
              <text class="se__price-sym">{{ group.multiple ? '+¥' : '¥' }}</text>
              <text class="se__price-num">{{ optionPriceText(group, o.priceDelta) }}</text>
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
