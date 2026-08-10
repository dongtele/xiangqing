<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import {
  createGoodsDraft,
  getCategoryRows,
  getGoodsDraft,
  saveGoodsDraft,
  submitGoodsAudit,
} from '@/services/api';
import { SPEC_KIND_FLAGS, displayPrice, hasPriceRange } from '@/models';
import { fen2yuan2 } from '@/utils/money';
import { back, push, toast } from '@/utils/nav';
import type { CategoryRow, GoodsDraft, SpecGroup, SpecGroupKind, SpecOption } from '@/models';

/**
 * 99 · 发布商品 · 规格与价格。
 *
 * 与 11 编辑商品的分工（交付文档「页面跳转关系」）：
 * 10 的「＋发布」进这里新建，编辑已有商品仍走 11 → 36。
 * 区别在于这一屏**页内**就能给每档定价与设库存，不用再跳一次规格页。
 */
const draft = ref<GoodsDraft | null>(null);
const categories = ref<CategoryRow[]>([]);
const catSheet = ref(false);
const kindSheet = ref(false);
let goodsId = '';
/** onLoad 是异步的，onShow 可能先跑，所以把建草稿这次请求存成 promise 让 onShow 先 await */
let ready: Promise<void> = Promise.resolve();

const KIND_OPTIONS: { value: SpecGroupKind; label: string; sub: string }[] = [
  { value: 'price', label: '定价格（单选必选）', sub: '份量这类：每档单独定价与库存，展示价取最低档' },
  { value: 'plain', label: '不加价（单选必选）', sub: '辣度这类：只影响做法，不影响价格' },
  { value: 'addon', label: '加料（可多选）', sub: '每项单独加价，勾选后累加' },
];

const shownPrice = computed(() =>
  draft.value ? displayPrice(draft.value.specGroups, draft.value.price) : 0
);
const showFrom = computed(() => (draft.value ? hasPriceRange(draft.value.specGroups) : false));

const categoryOptions = computed(() =>
  categories.value.filter((c) => !c.pinned).map((c) => ({ value: c.id, label: c.name, sub: c.sub }))
);

onLoad((o) => {
  goodsId = (o && o.id) || '';
  if (!goodsId) {
    ready = createGoodsDraft().then((created) => {
      goodsId = created.id;
    });
  }
});

// 从 63 裁图返回也要拿最新草稿，所以每次 show 都重新取
onShow(async () => {
  await ready;
  const [res, rows] = await Promise.all([getGoodsDraft(goodsId), getCategoryRows()]);
  if (!res) {
    toast('商品不存在');
    back();
    return;
  }
  categories.value = rows;
  draft.value = res;
});

function editName(): void {
  if (!draft.value) return;
  uni.showModal({
    title: '商品名称',
    editable: true,
    placeholderText: draft.value.name || '如：香辣鸡腿堡',
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm || !draft.value) return;
      const next = (res.content || '').trim();
      if (next) draft.value.name = next;
    },
  });
}

function onPickCategory(id: string): void {
  const hit = categories.value.find((c) => c.id === id);
  if (!hit || !draft.value) return;
  draft.value.categoryId = hit.id;
  draft.value.categoryName = hit.name;
  catSheet.value = false;
}

function onAddImage(): void {
  if (!draft.value) return;
  if (draft.value.images.filter(Boolean).length >= 5) {
    toast('最多 5 张商品图');
    return;
  }
  push(`/pages/merchant/image-crop/index?id=${goodsId}`);
}

/* ---------- 规格组 ---------- */

function groupTag(group: SpecGroup): string {
  if (group.kind === 'price') return '必选 · 决定商品价格';
  if (group.kind === 'addon') return '可多选 · 单独加价';
  return '必选 · 不加价';
}

function onAddGroup(): void {
  kindSheet.value = true;
}

function onPickKind(value: string): void {
  const kind = value as SpecGroupKind;
  kindSheet.value = false;
  uni.showModal({
    title: '规格组名称',
    editable: true,
    placeholderText: kind === 'addon' ? '如：加料' : '如：份量 / 辣度',
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

function onRemoveGroup(groupId: string): void {
  if (!draft.value) return;
  draft.value.specGroups = draft.value.specGroups.filter((g) => g.id !== groupId);
}

function onAddOption(group: SpecGroup): void {
  uni.showModal({
    title: group.kind === 'addon' ? `新增「${group.name}」项` : `新增「${group.name}」规格`,
    editable: true,
    placeholderText: group.kind === 'addon' ? '如：芝士片' : '如：标准份',
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm || !draft.value) return;
      const name = (res.content || '').trim();
      if (!name) return;
      group.options.push({
        id: `o_${Date.now()}`,
        name,
        priceDelta: 0,
        // 定价档默认给个价，价格框立刻可点改；库存默认不限
        price: group.kind === 'price' ? draft.value.price || 1800 : undefined,
        stock: group.kind === 'price' ? 0 : undefined,
      });
    },
  });
}

function onRemoveOption(group: SpecGroup, optionId: string): void {
  group.options = group.options.filter((o) => o.id !== optionId);
}

function optionPriceText(group: SpecGroup, option: SpecOption): string {
  if (!draft.value) return '0.00';
  return group.kind === 'price'
    ? fen2yuan2(option.price ?? draft.value.price)
    : fen2yuan2(option.priceDelta);
}

function onEditOptionPrice(group: SpecGroup, option: SpecOption): void {
  const pricing = group.kind === 'price';
  uni.showModal({
    title: pricing ? `${option.name} 售价（元）` : `${option.name} 加价（元）`,
    editable: true,
    placeholderText: optionPriceText(group, option),
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm) return;
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

/** 每档独立库存；改库存不需要重新审核 */
function onEditOptionStock(option: SpecOption): void {
  uni.showModal({
    title: `${option.name} 库存`,
    editable: true,
    placeholderText: String(option.stock ?? 0),
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm) return;
      const value = Number(res.content);
      if (Number.isNaN(value) || value < 0) {
        toast('请输入正确的数量');
        return;
      }
      option.stock = Math.round(value);
    },
  });
}

/* ---------- 提交 ---------- */

function validate(): string {
  if (!draft.value) return '商品不存在';
  if (!draft.value.name.trim()) return '请填写商品名称';
  if (!draft.value.categoryId) return '请选择所属分类';
  const empty = draft.value.specGroups.find((g) => !g.options.length);
  if (empty) return `「${empty.name}」还没有规格`;
  if (shownPrice.value <= 0) return '请填写规格价格';
  return '';
}

/** 存草稿：只落库不送审 */
async function onSaveDraft(): Promise<void> {
  if (!draft.value) return;
  await saveGoodsDraft(JSON.parse(JSON.stringify(draft.value)) as GoodsDraft, false);
  toast('已存为草稿', 'success');
  back();
}

async function onSubmit(): Promise<void> {
  const err = validate();
  if (err) {
    toast(err);
    return;
  }
  if (!draft.value) return;
  await saveGoodsDraft(JSON.parse(JSON.stringify(draft.value)) as GoodsDraft, false);
  const res = await submitGoodsAudit(goodsId);
  if (!res.ok) {
    toast(res.message || '提交失败');
    return;
  }
  // 交付文档：提交后落到 100 审核进度
  uni.redirectTo({ url: '/pages/merchant/goods-audit/index' });
}
</script>

<template>
  <view v-if="draft" class="gp">
    <view class="gp__nav">
      <wf-nav-bar title="发布商品" right="存草稿" @righttap="onSaveDraft" />
      <text class="gp__subtitle">新建 · 待提交审核</text>
    </view>

    <scroll-view class="gp__body" scroll-y>
      <!-- 图片 -->
      <view class="card gp__images">
        <view v-for="(img, i) in draft.images.filter(Boolean)" :key="i" class="gp__img">
          <wf-thumb :src="img" :radius="24" />
        </view>
        <view class="gp__img-add tap" @tap="onAddImage">
          <text class="gp__img-plus">＋</text>
          <text class="gp__img-hint">添加图片 {{ draft.images.filter(Boolean).length }}/5</text>
        </view>
      </view>

      <!-- 基础信息 -->
      <view class="card card--flat">
        <view class="cell tap" @tap="editName">
          <text class="gp__label">商品名称 <text class="gp__req">*</text></text>
          <text class="gp__value" :class="{ 'gp__value--empty': !draft.name }">{{
            draft.name || '未填写'
          }}</text>
        </view>
        <view class="cell tap" @tap="catSheet = true">
          <text class="gp__label">所属分类 <text class="gp__req">*</text></text>
          <text class="gp__value" :class="{ 'gp__value--empty': !draft.categoryName }"
            >{{ draft.categoryName || '请选择' }} ›</text
          >
        </view>
      </view>

      <!-- 规格组：每档单独定价与库存 -->
      <view v-for="group in draft.specGroups" :key="group.id" class="card">
        <view class="row--between">
          <view class="row gp__group-head">
            <text class="gp__group-name">{{ group.name }}</text>
            <text class="gp__group-tag" :class="{ 'gp__group-tag--grey': group.kind === 'plain' }">{{
              groupTag(group)
            }}</text>
          </view>
          <text class="gp__group-del tap" @tap="onRemoveGroup(group.id)">删除组</text>
        </view>

        <template v-if="group.kind === 'plain'">
          <view class="gp__chips">
            <text v-for="o in group.options" :key="o.id" class="gp__chip"
              >{{ o.name }}
              <text class="gp__chip-x tap" @tap.stop="onRemoveOption(group, o.id)">✕</text>
            </text>
            <text class="gp__chip-add tap" @tap="onAddOption(group)">＋</text>
          </view>
        </template>

        <template v-else>
          <view v-for="o in group.options" :key="o.id" class="gp__row">
            <text class="gp__drag">⠿</text>
            <view class="flex1 col gp__opt">
              <text class="gp__opt-name">{{ o.name }}</text>
              <text
                v-if="group.kind === 'price'"
                class="gp__opt-stock tap-sm"
                @tap="onEditOptionStock(o)"
                >库存 {{ o.stock ?? 0 }}</text
              >
            </view>
            <view class="gp__price tap" @tap="onEditOptionPrice(group, o)">
              <text class="gp__price-sym">{{ group.kind === 'addon' ? '+¥' : '¥' }}</text>
              <text class="gp__price-num">{{ optionPriceText(group, o) }}</text>
            </view>
            <text class="gp__del tap" @tap="onRemoveOption(group, o.id)">✕</text>
          </view>
          <view class="gp__add tap" @tap="onAddOption(group)">{{
            group.kind === 'price' ? '＋ 添加规格（可分别定价与库存）' : '＋ 添加加料'
          }}</view>
        </template>
      </view>

      <view class="gp__add-group tap" @tap="onAddGroup">＋ 添加规格组</view>

      <view class="gp__foot" />
    </scroll-view>

    <!-- 底部：实时预览顾客端展示价 -->
    <view class="gp__bar">
      <view class="col gp__preview">
        <text class="gp__preview-label">顾客端展示价</text>
        <view class="row gp__preview-price">
          <wf-price :fen="shownPrice" :size="40" :from="showFrom" />
        </view>
      </view>
      <view class="gp__submit tap" @tap="onSubmit">提交审核</view>
    </view>

    <wf-picker-sheet
      :show="catSheet"
      title="所属分类"
      :options="categoryOptions"
      :value="draft.categoryId"
      footer-text="去分类管理 ›"
      @close="catSheet = false"
      @pick="onPickCategory"
      @footer="
        catSheet = false;
        push('/pages/merchant/categories/index');
      "
    />

    <wf-picker-sheet
      :show="kindSheet"
      title="规格组类型"
      :options="KIND_OPTIONS"
      @close="kindSheet = false"
      @pick="onPickKind"
    />
  </view>
</template>

<style lang="scss" scoped>
.gp {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gp__nav {
  position: relative;
  flex-shrink: 0;
}

.gp__subtitle {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -6rpx;
  text-align: center;
  font-size: 20rpx;
  color: var(--c-text-weaker);
}

.gp__body {
  flex: 1;
  min-height: 0;
  padding: 28rpx 32rpx 0;
}

.card {
  margin-bottom: 24rpx;
}

/* 图片 */
.gp__images {
  flex-direction: row;
  gap: 20rpx;
  padding: 28rpx;
}

.gp__img {
  width: 144rpx;
  height: 144rpx;
  border-radius: 24rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.gp__img-add {
  width: 144rpx;
  height: 144rpx;
  border-radius: 24rpx;
  border: 3rpx dashed var(--c-line-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  flex-shrink: 0;
}

.gp__img-plus {
  font-size: 40rpx;
  line-height: 1;
  color: var(--c-text-placeholder);
}

.gp__img-hint {
  font-size: 20rpx;
  color: var(--c-text-placeholder);
}

/* 基础信息 */
.gp__label {
  font-size: 26rpx;
  color: var(--c-text-weak);
}

.gp__req {
  color: var(--c-primary);
  font-weight: 800;
}

.gp__value {
  font-size: 27rpx;
  font-weight: 700;
}

.gp__value--empty {
  color: var(--c-text-placeholder);
  font-weight: 600;
}

/* 规格组 */
.gp__group-head {
  gap: 16rpx;
}

.gp__group-name {
  font-size: 28rpx;
  font-weight: 800;
}

.gp__group-tag {
  font-size: 20rpx;
  color: var(--c-primary);
  font-weight: 700;
  background: var(--c-primary-bg);
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
}

.gp__group-tag--grey {
  color: #7a7168;
  background: var(--c-fill-3);
}

.gp__group-del {
  font-size: 23rpx;
  color: var(--c-danger);
  font-weight: 700;
}

.gp__row {
  background: #faf7f2;
  border-radius: 24rpx;
  padding: 22rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.gp__drag,
.gp__del {
  color: var(--c-text-placeholder-2);
  font-size: 26rpx;
}

.gp__opt {
  gap: 6rpx;
  min-width: 0;
}

.gp__opt-name {
  font-size: 26rpx;
  font-weight: 700;
}

.gp__opt-stock {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.gp__price {
  background: #fff;
  border: 3rpx solid var(--c-line-2);
  border-radius: 18rpx;
  padding: 12rpx 22rpx;
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.gp__price-sym {
  font-size: 20rpx;
  color: var(--c-text-weaker);
}

.gp__price-num {
  font-size: 28rpx;
  font-weight: 800;
}

.gp__add {
  text-align: center;
  border: 3rpx dashed var(--c-line-5);
  color: var(--c-text-placeholder);
  font-size: 24rpx;
  font-weight: 700;
  padding: 18rpx 0;
  border-radius: 22rpx;
}

.gp__chips {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.gp__chip {
  background: #faf7f2;
  font-size: 24rpx;
  font-weight: 700;
  padding: 14rpx 28rpx;
  border-radius: 20rpx;
}

.gp__chip-x {
  color: var(--c-text-placeholder-2);
  margin-left: 8rpx;
}

.gp__chip-add {
  border: 3rpx dashed var(--c-line-5);
  color: var(--c-text-placeholder);
  font-size: 24rpx;
  padding: 14rpx 28rpx;
  border-radius: 20rpx;
}

.gp__add-group {
  text-align: center;
  border: 3rpx dashed #ffb08f;
  color: var(--c-primary);
  background: #fffdfb;
  font-size: 26rpx;
  font-weight: 800;
  padding: 24rpx 0;
  border-radius: 24rpx;
}

.gp__foot {
  height: 32rpx;
}

/* 底部实时预览 + 提交 */
.gp__bar {
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

.gp__preview {
  gap: 4rpx;
}

.gp__preview-label {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.gp__submit {
  flex: 1;
  height: 96rpx;
  border-radius: 48rpx;
  background: var(--grad-main);
  color: #fff;
  font-size: 30rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--sh-primary-btn);
}
</style>
